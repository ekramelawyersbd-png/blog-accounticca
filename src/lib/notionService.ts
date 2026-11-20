import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Client as NotionClient } from '@notionhq/client';
import notionPkg from '@notionhq/client';
import { getAdminFirestore } from './firebaseAdmin';
import { maskEmail } from './securityMiddleware';

const { Client } = notionPkg as unknown as { Client: typeof NotionClient };

export interface NotionContactLeadInput {
  id: string;
  referenceId: string;
  clientName: string;
  email: string;
  phone?: string;
  companyName?: string;
  serviceArea: string;
  department?: string;
  messageOrNotes: string;
  urgency?: string;
  source: string;
  submittedAt: string;
  status?: 'New' | 'Pending' | 'In Progress' | 'Replied' | 'Completed';
  followUpNotes?: string;
  notionPageId?: string | null;
}

export interface NotionNewsletterSubscriberInput {
  id: string;
  name?: string | null;
  email: string;
  organization?: string | null;
  designation?: string | null;
  topics: string[];
  source: string;
  subscribedAt: string;
  consentStatus: 'Opted In' | 'Withdrawn';
  subscriptionStatus: 'Active' | 'Unsubscribed';
  lastUpdated: string;
  notionPageId?: string | null;
}

export interface NotionSyncResult {
  configured: boolean;
  synced: boolean;
  pageId?: string | null;
  action?: 'created' | 'updated' | 'skipped' | 'queued';
  error?: string;
}

export interface NotionSyncQueueJob {
  jobId: string;
  targetType: 'contact_lead' | 'newsletter_subscriber';
  recordId: string;
  payload: Record<string, any>;
  attempts: number;
  lastError: string;
  createdAt: string;
  updatedAt: string;
  nextRetryAt: string;
  status: 'pending' | 'completed' | 'dead_letter';
  notionPageId?: string | null;
}

const DATA_DIR = path.join(os.tmpdir(), 'accounticca-runtime-data');
const NOTION_QUEUE_FILE = path.join(DATA_DIR, 'notion-sync-queue.json');
const NOTION_QUEUE_COLLECTION = 'notion_sync_queue';

const PLACEHOLDER_VALUES = new Set([
  '',
  'your_notion_integration_token',
  'your_notion_contact_db_id',
  'your_notion_newsletter_db_id',
  'secret_xxx',
  'ntn_xxx',
]);

function cleanEnvValue(val?: string): string {
  const trimmed = String(val || '').trim();
  if (PLACEHOLDER_VALUES.has(trimmed.toLowerCase()) || PLACEHOLDER_VALUES.has(trimmed)) {
    return '';
  }
  return trimmed;
}

export function getNotionConfiguration(): {
  tokenConfigured: boolean;
  contactDbConfigured: boolean;
  newsletterDbConfigured: boolean;
  fullyConfigured: boolean;
  contactDbId: string;
  newsletterDbId: string;
} {
  const token = cleanEnvValue(process.env.NOTION_TOKEN || process.env.NOTION_API_KEY);
  const contactDbId = cleanEnvValue(process.env.NOTION_CONTACT_DB_ID);
  const newsletterDbId = cleanEnvValue(process.env.NOTION_NEWSLETTER_DB_ID);

  return {
    tokenConfigured: Boolean(token),
    contactDbConfigured: Boolean(contactDbId),
    newsletterDbConfigured: Boolean(newsletterDbId),
    fullyConfigured: Boolean(token && contactDbId && newsletterDbId),
    contactDbId,
    newsletterDbId,
  };
}

let cachedClient: NotionClient | null = null;
let cachedToken: string | null = null;

export function getNotionClient(): NotionClient | null {
  const token = cleanEnvValue(process.env.NOTION_TOKEN || process.env.NOTION_API_KEY);
  if (!token) return null;
  if (cachedClient && cachedToken === token) {
    return cachedClient;
  }
  cachedClient = new Client({ auth: token });
  cachedToken = token;
  return cachedClient;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema Cache so our Notion property builder adapts cleanly to any workspace
// database setup (`status` vs `select`, title property name, missing optional cols)
// ─────────────────────────────────────────────────────────────────────────────
interface CachedDbSchema {
  titlePropertyName: string;
  properties: Record<string, { type: string; name: string }>;
  fetchedAt: number;
}

const schemaCache = new Map<string, CachedDbSchema>();

async function getDatabaseSchema(client: NotionClient, databaseId: string): Promise<CachedDbSchema> {
  const now = Date.now();
  const cached = schemaCache.get(databaseId);
  if (cached && now - cached.fetchedAt < 5 * 60 * 1000) {
    return cached;
  }

  const dbMeta: any = await client.databases.retrieve({ database_id: databaseId });
  const rawProps: Record<string, any> = dbMeta?.properties || {};
  const properties: Record<string, { type: string; name: string }> = {};
  let titlePropertyName = 'Name';

  for (const [propName, propDef] of Object.entries(rawProps)) {
    const type = String(propDef?.type || 'rich_text');
    properties[propName] = { type, name: propName };
    if (type === 'title') {
      titlePropertyName = propName;
    }
  }

  const result: CachedDbSchema = {
    titlePropertyName,
    properties,
    fetchedAt: now,
  };
  schemaCache.set(databaseId, result);
  return result;
}

function resolvePropertyKey(
  schema: CachedDbSchema,
  preferredNames: string[]
): { key: string; type: string } | null {
  for (const name of preferredNames) {
    if (schema.properties[name]) {
      return { key: name, type: schema.properties[name].type };
    }
  }
  const lowerMap = new Map(
    Object.entries(schema.properties).map(([k, v]) => [k.toLowerCase(), { key: k, type: v.type }])
  );
  for (const name of preferredNames) {
    const hit = lowerMap.get(name.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

function buildNotionPropertyValue(
  propType: string,
  value: string | string[] | null | undefined
): any | undefined {
  if (value === undefined || value === null) return undefined;

  if (propType === 'title') {
    const str = Array.isArray(value) ? value.join(', ') : String(value);
    return {
      title: [{ text: { content: (str || 'Untitled').slice(0, 2000) } }],
    };
  }

  if (propType === 'rich_text') {
    const str = Array.isArray(value) ? value.join(', ') : String(value);
    if (!str.trim()) return { rich_text: [] };
    return {
      rich_text: [{ text: { content: str.slice(0, 2000) } }],
    };
  }

  if (propType === 'email') {
    const str = String(value).trim();
    return { email: str && str.includes('@') ? str : null };
  }

  if (propType === 'phone_number') {
    const str = String(value).trim();
    return { phone_number: str || null };
  }

  if (propType === 'select') {
    const str = String(value).trim();
    return str ? { select: { name: str.slice(0, 100) } } : { select: null };
  }

  if (propType === 'status') {
    const str = String(value).trim();
    return str ? { status: { name: str.slice(0, 100) } } : undefined;
  }

  if (propType === 'multi_select') {
    const arr = Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    return {
      multi_select: arr.slice(0, 25).map((item) => ({ name: item.replace(/,/g, '').slice(0, 90) })),
    };
  }

  if (propType === 'date') {
    const str = String(value).trim();
    const parsed = str ? new Date(str) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return undefined;
    return { date: { start: parsed.toISOString() } };
  }

  return undefined;
}

function buildContactPropertiesForSchema(
  schema: CachedDbSchema,
  lead: NotionContactLeadInput
): Record<string, any> {
  const props: Record<string, any> = {};

  const mappings: Array<{ names: string[]; value: string | undefined }> = [
    { names: ['Reference ID', 'Reference', 'Ref ID'], value: lead.referenceId },
    { names: ['Client Name', 'Name', 'Full Name'], value: lead.clientName },
    { names: ['Email', 'Email Address'], value: lead.email || '' },
    { names: ['Phone', 'Phone / WhatsApp'], value: lead.phone || '' },
    { names: ['Company', 'Company / Organization', 'Organization'], value: lead.companyName || '' },
    { names: ['Service', 'Service Area'], value: lead.serviceArea || 'General Advisory' },
    { names: ['Department', 'Division'], value: lead.department || 'Accounticca Advisory' },
    { names: ['Message', 'Matter Description', 'Notes'], value: lead.messageOrNotes },
    { names: ['Urgency', 'Priority'], value: lead.urgency || 'Standard Advisory (24–48h)' },
    { names: ['Source', 'Form Source'], value: lead.source || 'website_contact_form' },
    { names: ['Submitted At', 'Submitted Date', 'Created At'], value: lead.submittedAt },
    { names: ['Status', 'Follow-up Status'], value: lead.status || 'New' },
    { names: ['Follow-up Notes', 'Internal Notes'], value: lead.followUpNotes || '' },
  ];

  let titleAssigned = false;
  for (const item of mappings) {
    const resolved = resolvePropertyKey(schema, item.names);
    if (!resolved) continue;
    const formatted = buildNotionPropertyValue(resolved.type, item.value);
    if (formatted !== undefined) {
      props[resolved.key] = formatted;
      if (resolved.key === schema.titlePropertyName) {
        titleAssigned = true;
      }
    }
  }

  if (!titleAssigned && schema.titlePropertyName) {
    props[schema.titlePropertyName] = buildNotionPropertyValue(
      'title',
      `${lead.referenceId} — ${lead.clientName}`
    );
  }

  return props;
}

function buildSubscriberPropertiesForSchema(
  schema: CachedDbSchema,
  sub: NotionNewsletterSubscriberInput
): Record<string, any> {
  const props: Record<string, any> = {};

  const mappings: Array<{ names: string[]; value: string | string[] | undefined }> = [
    {
      names: ['Subscriber Name', 'Name', 'Full Name'],
      value: (sub.name || '').trim() || sub.email.split('@')[0],
    },
    { names: ['Email', 'Email Address'], value: sub.email },
    { names: ['Organization', 'Company', 'Firm'], value: sub.organization || '' },
    { names: ['Designation', 'Role'], value: sub.designation || 'other' },
    { names: ['Topics', 'Focus Topics'], value: sub.topics.length ? sub.topics : ['tax_vat'] },
    { names: ['Source', 'Form Source'], value: sub.source || 'website' },
    { names: ['Subscription Date', 'Subscribed At'], value: sub.subscribedAt },
    { names: ['Consent Status', 'Consent'], value: sub.consentStatus },
    { names: ['Subscription Status', 'Status'], value: sub.subscriptionStatus },
    { names: ['Last Updated', 'Updated At'], value: sub.lastUpdated },
  ];

  let titleAssigned = false;
  for (const item of mappings) {
    const resolved = resolvePropertyKey(schema, item.names);
    if (!resolved) continue;
    const formatted = buildNotionPropertyValue(resolved.type, item.value);
    if (formatted !== undefined) {
      props[resolved.key] = formatted;
      if (resolved.key === schema.titlePropertyName) {
        titleAssigned = true;
      }
    }
  }

  if (!titleAssigned && schema.titlePropertyName) {
    props[schema.titlePropertyName] = buildNotionPropertyValue(
      'title',
      (sub.name || '').trim() || sub.email
    );
  }

  return props;
}

async function queryExistingPageByProperty(
  client: NotionClient,
  databaseId: string,
  schema: CachedDbSchema,
  propertyNames: string[],
  value: string
): Promise<string | null> {
  const resolved = resolvePropertyKey(schema, propertyNames);
  if (!resolved || !value.trim()) return null;

  const filter: Record<string, any> = { property: resolved.key };
  if (resolved.type === 'title') {
    filter.title = { equals: value.trim() };
  } else if (resolved.type === 'email') {
    filter.email = { equals: value.trim().toLowerCase() };
  } else if (resolved.type === 'rich_text') {
    filter.rich_text = { equals: value.trim() };
  } else {
    return null;
  }

  // Support both Notion SDK v2 (`databases.query`) and v5 (`dataSources` or raw `request`) cleanly
  const resp: any =
    typeof (client as any).databases?.query === 'function'
      ? await (client as any).databases.query({
          database_id: databaseId,
          filter,
          page_size: 1,
        })
      : await client.request({
          path: `databases/${databaseId}/query`,
          method: 'post',
          body: { filter, page_size: 1 },
        });

  if (Array.isArray(resp?.results) && resp.results.length > 0) {
    return String(resp.results[0].id);
  }
  return null;
}

async function withExponentialRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.code;
      const retryable =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err?.code === 'rate_limited' ||
        err?.code === 'internal_server_error' ||
        err?.code === 'service_unavailable' ||
        /timeout|network|ECONNRESET|ETIMEDOUT/i.test(String(err?.message || ''));

      if (!retryable || attempt >= maxAttempts) {
        throw err;
      }

      const backoffMs = 400 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Durable Notion Retry Queue (Firestore + File Backup)
// ─────────────────────────────────────────────────────────────────────────────
function readLocalQueue(): NotionSyncQueueJob[] {
  try {
    if (fs.existsSync(NOTION_QUEUE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(NOTION_QUEUE_FILE, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLocalQueue(jobs: NotionSyncQueueJob[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(NOTION_QUEUE_FILE, JSON.stringify(jobs.slice(0, 300), null, 2), 'utf8');
  } catch {
    // ignore
  }
}

export async function enqueueFailedNotionSync(
  targetType: 'contact_lead' | 'newsletter_subscriber',
  recordId: string,
  payload: Record<string, any>,
  errorMsg: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  const jobId = `${targetType}_${recordId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  const safeError = String(errorMsg || 'Notion sync error').slice(0, 500);

  const localQueue = readLocalQueue();
  const existingIdx = localQueue.findIndex((j) => j.jobId === jobId);
  const attempts = existingIdx >= 0 ? localQueue[existingIdx].attempts + 1 : 1;
  const delayMs = Math.min(3600_000, 30_000 * Math.pow(2, Math.min(attempts, 6)));

  const job: NotionSyncQueueJob = {
    jobId,
    targetType,
    recordId,
    payload,
    attempts,
    lastError: safeError,
    createdAt: existingIdx >= 0 ? localQueue[existingIdx].createdAt : nowIso,
    updatedAt: nowIso,
    nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
    status: attempts >= 8 ? 'dead_letter' : 'pending',
    notionPageId: existingIdx >= 0 ? localQueue[existingIdx].notionPageId || null : null,
  };

  if (existingIdx >= 0) {
    localQueue[existingIdx] = job;
  } else {
    localQueue.unshift(job);
  }
  writeLocalQueue(localQueue);

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(NOTION_QUEUE_COLLECTION).doc(jobId).set(job, { merge: true });
    } catch {
      // ignore if admin Firestore unavailable
    }
  }
}

async function markQueueJobCompleted(
  targetType: 'contact_lead' | 'newsletter_subscriber',
  recordId: string,
  notionPageId: string
): Promise<void> {
  const jobId = `${targetType}_${recordId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  const localQueue = readLocalQueue().map((j) =>
    j.jobId === jobId
      ? {
          ...j,
          status: 'completed' as const,
          notionPageId,
          updatedAt: new Date().toISOString(),
        }
      : j
  );
  writeLocalQueue(localQueue);

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(NOTION_QUEUE_COLLECTION).doc(jobId).set(
        {
          status: 'completed',
          notionPageId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // ignore
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync Database A: Website Contact Leads
// ─────────────────────────────────────────────────────────────────────────────
export async function syncContactLeadToNotion(
  lead: NotionContactLeadInput
): Promise<NotionSyncResult> {
  const cfg = getNotionConfiguration();
  const client = getNotionClient();

  if (!cfg.tokenConfigured || !cfg.contactDbConfigured || !client) {
    return {
      configured: false,
      synced: false,
      action: 'skipped',
      error: 'Notion credentials or NOTION_CONTACT_DB_ID are not configured.',
    };
  }

  try {
    const schema = await withExponentialRetry(() => getDatabaseSchema(client, cfg.contactDbId));
    const properties = buildContactPropertiesForSchema(schema, lead);

    let targetPageId = lead.notionPageId || null;
    if (!targetPageId) {
      targetPageId = await withExponentialRetry(() =>
        queryExistingPageByProperty(
          client,
          cfg.contactDbId,
          schema,
          ['Reference ID', 'Reference', 'Ref ID'],
          lead.referenceId
        )
      );
    }

    let action: 'created' | 'updated' = 'created';
    if (targetPageId) {
      await withExponentialRetry(() =>
        client.pages.update({
          page_id: targetPageId!,
          properties,
        })
      );
      action = 'updated';
    } else {
      const created: any = await withExponentialRetry(() =>
        client.pages.create({
          parent: { database_id: cfg.contactDbId },
          properties,
        })
      );
      targetPageId = String(created.id);
      action = 'created';
    }

    // Store page ID back in Firestore for O(1) idempotent updates later
    const db = getAdminFirestore();
    if (db && lead.id) {
      await db
        .collection('contact_messages')
        .doc(lead.id)
        .set(
          {
            notionPageId: targetPageId,
            notionSyncStatus: 'synced',
            notionSyncedAt: new Date().toISOString(),
          },
          { merge: true }
        )
        .catch(() => {});
    }

    await markQueueJobCompleted('contact_lead', lead.id || lead.referenceId, targetPageId);
    console.log(
      `[NotionSync] Contact lead ${lead.referenceId} (${maskEmail(lead.email)}) ${action} -> page ${targetPageId}`
    );

    return {
      configured: true,
      synced: true,
      pageId: targetPageId,
      action,
    };
  } catch (err: any) {
    const safeMsg = String(err?.message || 'Notion contact sync failure').slice(0, 300);
    console.error(
      `[NotionSync] Failed contact sync for ${lead.referenceId} (${maskEmail(lead.email)}): ${safeMsg}`
    );
    await enqueueFailedNotionSync('contact_lead', lead.id || lead.referenceId, lead, safeMsg);
    return {
      configured: true,
      synced: false,
      action: 'queued',
      error: safeMsg,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync Database B: Newsletter Subscribers
// ─────────────────────────────────────────────────────────────────────────────
export async function syncNewsletterSubscriberToNotion(
  subscriber: NotionNewsletterSubscriberInput
): Promise<NotionSyncResult> {
  const cfg = getNotionConfiguration();
  const client = getNotionClient();

  if (!cfg.tokenConfigured || !cfg.newsletterDbConfigured || !client) {
    return {
      configured: false,
      synced: false,
      action: 'skipped',
      error: 'Notion credentials or NOTION_NEWSLETTER_DB_ID are not configured.',
    };
  }

  try {
    const schema = await withExponentialRetry(() => getDatabaseSchema(client, cfg.newsletterDbId));
    const properties = buildSubscriberPropertiesForSchema(schema, subscriber);

    let targetPageId = subscriber.notionPageId || null;
    if (!targetPageId) {
      targetPageId = await withExponentialRetry(() =>
        queryExistingPageByProperty(
          client,
          cfg.newsletterDbId,
          schema,
          ['Email', 'Email Address'],
          subscriber.email
        )
      );
    }

    let action: 'created' | 'updated' = 'created';
    if (targetPageId) {
      await withExponentialRetry(() =>
        client.pages.update({
          page_id: targetPageId!,
          properties,
        })
      );
      action = 'updated';
    } else {
      const created: any = await withExponentialRetry(() =>
        client.pages.create({
          parent: { database_id: cfg.newsletterDbId },
          properties,
        })
      );
      targetPageId = String(created.id);
      action = 'created';
    }

    const db = getAdminFirestore();
    if (db && subscriber.id) {
      await db
        .collection('newsletterSubscribers')
        .doc(subscriber.id)
        .set(
          {
            notionPageId: targetPageId,
            notionSyncStatus: 'synced',
            notionSyncedAt: new Date().toISOString(),
          },
          { merge: true }
        )
        .catch(() => {});
    }

    await markQueueJobCompleted('newsletter_subscriber', subscriber.id || subscriber.email, targetPageId);
    console.log(
      `[NotionSync] Subscriber ${maskEmail(subscriber.email)} (${subscriber.subscriptionStatus}) ${action} -> page ${targetPageId}`
    );

    return {
      configured: true,
      synced: true,
      pageId: targetPageId,
      action,
    };
  } catch (err: any) {
    const safeMsg = String(err?.message || 'Notion subscriber sync failure').slice(0, 300);
    console.error(
      `[NotionSync] Failed subscriber sync for ${maskEmail(subscriber.email)}: ${safeMsg}`
    );
    await enqueueFailedNotionSync(
      'newsletter_subscriber',
      subscriber.id || subscriber.email,
      subscriber,
      safeMsg
    );
    return {
      configured: true,
      synced: false,
      action: 'queued',
      error: safeMsg,
    };
  }
}

export async function archiveNotionSubscriberPage(pageId: string): Promise<boolean> {
  const client = getNotionClient();
  if (!client || !pageId) return false;
  try {
    await withExponentialRetry(() =>
      client.pages.update({
        page_id: pageId,
        archived: true,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function retryFailedNotionSyncs(): Promise<{
  configured: boolean;
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const cfg = getNotionConfiguration();
  if (!cfg.tokenConfigured) {
    return { configured: false, processed: 0, succeeded: 0, failed: 0 };
  }

  let jobs: NotionSyncQueueJob[] = readLocalQueue();
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db
        .collection(NOTION_QUEUE_COLLECTION)
        .where('status', '==', 'pending')
        .limit(50)
        .get();
      if (!snap.empty) {
        const merged = new Map(jobs.map((j) => [j.jobId, j]));
        snap.forEach((docSnap) => {
          merged.set(docSnap.id, docSnap.data() as NotionSyncQueueJob);
        });
        jobs = Array.from(merged.values());
      }
    } catch {
      // use local queue fallback
    }
  }

  const pending = jobs.filter((j) => j.status === 'pending');
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const job of pending) {
    processed++;
    const res =
      job.targetType === 'contact_lead'
        ? await syncContactLeadToNotion(job.payload as NotionContactLeadInput)
        : await syncNewsletterSubscriberToNotion(job.payload as NotionNewsletterSubscriberInput);
    if (res.synced) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return { configured: true, processed, succeeded, failed };
}

export async function getNotionSyncStatus(): Promise<{
  configuration: ReturnType<typeof getNotionConfiguration>;
  connectivity: { contactDbOk: boolean; newsletterDbOk: boolean; error?: string };
  queueStats: { pending: number; completed: number; deadLetter: number };
}> {
  const configuration = getNotionConfiguration();
  const client = getNotionClient();

  let contactDbOk = false;
  let newsletterDbOk = false;
  let connectivityError: string | undefined;

  if (client) {
    if (configuration.contactDbId) {
      try {
        await client.databases.retrieve({ database_id: configuration.contactDbId });
        contactDbOk = true;
      } catch (err: any) {
        connectivityError = err?.message || 'Contact database retrieve failed';
      }
    }
    if (configuration.newsletterDbId) {
      try {
        await client.databases.retrieve({ database_id: configuration.newsletterDbId });
        newsletterDbOk = true;
      } catch (err: any) {
        connectivityError =
          connectivityError || err?.message || 'Newsletter database retrieve failed';
      }
    }
  }

  const localQueue = readLocalQueue();
  let pending = localQueue.filter((j) => j.status === 'pending').length;
  let completed = localQueue.filter((j) => j.status === 'completed').length;
  let deadLetter = localQueue.filter((j) => j.status === 'dead_letter').length;

  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(NOTION_QUEUE_COLLECTION).limit(200).get();
      if (!snap.empty) {
        pending = 0;
        completed = 0;
        deadLetter = 0;
        snap.forEach((docSnap) => {
          const st = docSnap.data()?.status;
          if (st === 'completed') completed++;
          else if (st === 'dead_letter') deadLetter++;
          else pending++;
        });
      }
    } catch {
      // keep local counts
    }
  }

  return {
    configuration,
    connectivity: {
      contactDbOk,
      newsletterDbOk,
      ...(connectivityError ? { error: connectivityError } : {}),
    },
    queueStats: { pending, completed, deadLetter },
  };
}
