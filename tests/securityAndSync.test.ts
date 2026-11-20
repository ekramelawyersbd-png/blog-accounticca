import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  hashAdminPassword,
  verifyAdminPasswordHash,
  issueAdminSessionToken,
  verifyAdminSessionToken,
  revokeAdminSessionToken,
  revokeAllAdminSessionsForEmail,
  isAuthorizedAdminEmail,
  loginAdminWithPassword,
} from '../src/lib/adminAuth';
import {
  maskEmail,
  maskPhone,
  sanitizePlainText,
  checkDuplicateSubmission,
  recordSubmissionFingerprint,
  createTurnstileVerificationProof,
  consumeTurnstileVerificationProof,
  contactInquirySchema,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  createUnsubscribeSignature,
  verifyUnsubscribeSignature,
} from '../src/lib/securityMiddleware';
import {
  getNotionConfiguration,
  syncContactLeadToNotion,
  syncNewsletterSubscriberToNotion,
  enqueueFailedNotionSync,
} from '../src/lib/notionService';
import { getFirebaseAdminStatus } from '../src/lib/firebaseAdmin';

test('adminAuth: password scrypt hashing and verification', () => {
  const secretPass = 'Accounticca!Strong#Pass_2026';
  const hash = hashAdminPassword(secretPass);
  assert.ok(hash.startsWith('scrypt$'));
  assert.equal(verifyAdminPasswordHash(secretPass, hash), true);
  assert.equal(verifyAdminPasswordHash('wrong-password', hash), false);
  assert.equal(verifyAdminPasswordHash(secretPass, 'plain-text-hash'), false);
});

test('adminAuth: rejects legacy hardcoded email and forged token prefixes', () => {
  assert.equal(isAuthorizedAdminEmail('hmekram@gmail.com'), true);
  assert.equal(isAuthorizedAdminEmail('admin@admin.com'), false);
  assert.equal(isAuthorizedAdminEmail('attacker@evil.com'), false);

  assert.equal(verifyAdminSessionToken('admin-oauth-hmekram@gmail.com'), null);
  assert.equal(verifyAdminSessionToken('Bearer admin-oauth-hmekram@gmail.com'), null);
  assert.equal(verifyAdminSessionToken('invalid.token'), null);
});

test('adminAuth: issues signed accadm session, detects tampering, and enforces revocation', async () => {
  const issued = issueAdminSessionToken({
    email: 'superadmin@erpforu.com',
    role: 'admin',
    name: 'Test Admin',
    title: 'Admin',
    authMethod: 'password',
  });

  assert.ok(issued.token.startsWith('accadm.'));
  const verified = verifyAdminSessionToken(issued.token);
  assert.ok(verified);
  assert.equal(verified?.user.email, 'superadmin@erpforu.com');

  // Tamper signature
  const parts = issued.token.split('.');
  const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -2)}AA`;
  assert.equal(verifyAdminSessionToken(tampered), null);

  // Single JTI revocation
  const revoked = await revokeAdminSessionToken(issued.token);
  assert.equal(revoked, true);
  assert.equal(verifyAdminSessionToken(issued.token), null);

  // Email-wide revocation watermark
  const beforeRevoke = issueAdminSessionToken({
    email: 'superadmin@erpforu.com',
    role: 'admin',
    name: 'Test Admin',
    title: 'Admin',
  });
  await new Promise((r) => setTimeout(r, 15));
  await revokeAllAdminSessionsForEmail('superadmin@erpforu.com');
  assert.equal(verifyAdminSessionToken(beforeRevoke.token), null);

  await new Promise((r) => setTimeout(r, 15));
  const afterRevoke = issueAdminSessionToken({
    email: 'superadmin@erpforu.com',
    role: 'admin',
    name: 'Test Admin',
    title: 'Admin',
  });
  assert.ok(verifyAdminSessionToken(afterRevoke.token));
  await revokeAdminSessionToken(afterRevoke.token);
});

test('adminAuth: loginAdminWithPassword fails closed without ADMIN_PASSWORD_HASH and succeeds with valid hash', async () => {
  const prevHash = process.env.ADMIN_PASSWORD_HASH;
  try {
    delete process.env.ADMIN_PASSWORD_HASH;
    const disabledRes = await loginAdminWithPassword('hmekram@gmail.com', 'anything', '127.0.0.10');
    assert.equal(disabledRes.success, false);
    if (!disabledRes.success) {
      assert.equal(disabledRes.status, 503);
    }

    const testPass = 'RotatedAdmin#Secret99!';
    process.env.ADMIN_PASSWORD_HASH = hashAdminPassword(testPass);

    const badPassRes = await loginAdminWithPassword('hmekram@gmail.com', 'wrong-pass', '127.0.0.11');
    assert.equal(badPassRes.success, false);
    if (!badPassRes.success) {
      assert.equal(badPassRes.status, 401);
    }

    const okRes = await loginAdminWithPassword('hmekram@gmail.com', testPass, '127.0.0.12');
    assert.equal(okRes.success, true);
    if (okRes.success) {
      assert.ok(verifyAdminSessionToken(okRes.token));
    }
  } finally {
    if (prevHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = prevHash;
  }
});

test('securityMiddleware: PII masking, text sanitization, Turnstile single-use proof, and HMAC unsubscribe', () => {
  assert.equal(maskEmail('client.name@example.com'), 'cl***@example.com');
  assert.equal(maskPhone('+8801712345678'), '***5678');
  assert.equal(sanitizePlainText('Hello\u0000 World  ', 50), 'Hello World');

  const proof = createTurnstileVerificationProof('contact_form', '203.0.113.5');
  assert.equal(consumeTurnstileVerificationProof(proof, '203.0.113.99').valid, false);
  assert.equal(consumeTurnstileVerificationProof(proof, '203.0.113.5').valid, true);
  // Replay must fail!
  assert.equal(consumeTurnstileVerificationProof(proof, '203.0.113.5').valid, false);

  const dupBefore = checkDuplicateSubmission('contact', ['a@b.com', 'hello']);
  assert.equal(dupBefore.isDuplicate, false);
  recordSubmissionFingerprint(dupBefore.fingerprint, 'INQ-TEST-1');
  const dupAfter = checkDuplicateSubmission('contact', ['a@b.com', 'hello']);
  assert.equal(dupAfter.isDuplicate, true);
  assert.equal(dupAfter.existingReferenceId, 'INQ-TEST-1');

  const sig = createUnsubscribeSignature('Subscriber@Example.com');
  assert.equal(verifyUnsubscribeSignature('subscriber@example.com', sig), true);
  assert.equal(verifyUnsubscribeSignature('other@example.com', sig), false);
});

test('securityMiddleware: Zod validation rejects invalid payloads and accepts valid ones', () => {
  const validContact = contactInquirySchema.safeParse({
    clientName: 'Ayesha Rahman',
    email: 'ayesha@company.com',
    phone: '+8801711223344',
    serviceArea: 'Income Tax Advisory',
    messageOrNotes: 'We need corporate tax return advisory for FY2025-26.',
    source: 'contact_page',
  });
  assert.equal(validContact.success, true);

  const invalidContact = contactInquirySchema.safeParse({
    clientName: 'A',
    email: 'not-an-email',
    messageOrNotes: 'hi',
  });
  assert.equal(invalidContact.success, false);

  const validSub = newsletterSubscribeSchema.safeParse({
    email: '  Finance.Lead@Firm.BD ',
    name: 'Tariq Islam',
    topics: ['tax_vat', 'corporate_rjsc'],
    consentAccepted: true,
  });
  assert.equal(validSub.success, true);
  if (validSub.success) {
    assert.equal(validSub.data.email, 'finance.lead@firm.bd');
  }

  const invalidUnsub = newsletterUnsubscribeSchema.safeParse({ email: 'bad' });
  assert.equal(invalidUnsub.success, false);
});

test('notionService: handles unconfigured credentials safely without fabricating connections', async () => {
  const prevToken = process.env.NOTION_TOKEN;
  const prevContactDb = process.env.NOTION_CONTACT_DB_ID;
  const prevNewsDb = process.env.NOTION_NEWSLETTER_DB_ID;

  try {
    process.env.NOTION_TOKEN = 'your_notion_integration_token';
    process.env.NOTION_CONTACT_DB_ID = '';
    process.env.NOTION_NEWSLETTER_DB_ID = 'secret_xxx';

    const cfg = getNotionConfiguration();
    assert.equal(cfg.tokenConfigured, false);
    assert.equal(cfg.contactDbConfigured, false);
    assert.equal(cfg.newsletterDbConfigured, false);
    assert.equal(cfg.fullyConfigured, false);

    const leadRes = await syncContactLeadToNotion({
      id: 'inq-test-1',
      referenceId: 'INQ-2026-0001',
      clientName: 'Test Client',
      email: 'client@example.com',
      serviceArea: 'Tax Advisory',
      messageOrNotes: 'Need statutory audit guidance.',
      source: 'contact_page',
      submittedAt: new Date().toISOString(),
    });
    assert.equal(leadRes.configured, false);
    assert.equal(leadRes.synced, false);
    assert.equal(leadRes.action, 'skipped');

    const subRes = await syncNewsletterSubscriberToNotion({
      id: 'sub_test_1',
      email: 'reader@example.com',
      topics: ['tax_vat'],
      source: 'footer',
      subscribedAt: new Date().toISOString(),
      consentStatus: 'Opted In',
      subscriptionStatus: 'Active',
      lastUpdated: new Date().toISOString(),
    });
    assert.equal(subRes.configured, false);
    assert.equal(subRes.synced, false);

    await enqueueFailedNotionSync('contact_lead', 'test-queue-item', { ref: 'INQ-Q-1' }, 'Simulated retry');
  } finally {
    if (prevToken === undefined) delete process.env.NOTION_TOKEN;
    else process.env.NOTION_TOKEN = prevToken;
    if (prevContactDb === undefined) delete process.env.NOTION_CONTACT_DB_ID;
    else process.env.NOTION_CONTACT_DB_ID = prevContactDb;
    if (prevNewsDb === undefined) delete process.env.NOTION_NEWSLETTER_DB_ID;
    else process.env.NOTION_NEWSLETTER_DB_ID = prevNewsDb;
  }
});

test('static security scan: no legacy hardcoded auth prefixes or exposed R2 secret keys', () => {
  const root = process.cwd();
  const filesToCheck = [
    'server.ts',
    'src/lib/adminAuth.ts',
    'src/contexts/ShopAuthContext.tsx',
    'src/services/authService.ts',
    'functions/src/index.ts',
  ];

  for (const relPath of filesToCheck) {
    const content = fs.readFileSync(path.join(root, relPath), 'utf8');
    assert.equal(content.includes('admin-oauth-'), false, `${relPath} still contains admin-oauth- prefix`);
    assert.equal(
      content.includes('8442a4593907c0115483a6a582b7d663e7edb924130b9bd20cd4ebc59504768c'),
      false,
      `${relPath} still contains hardcoded R2 secret`
    );
  }
});

test('firebaseAdmin: parses FIREBASE_SERVICE_ACCOUNT_JSON (quoted JSON and base64) safely', () => {
  const prevJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  try {
    const samplePayload = JSON.stringify({
      type: 'service_account',
      project_id: 'gen-lang-client-0361533735',
      client_email: 'firebase-adminsdk-test@gen-lang-client-0361533735.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nTESTKEY\\n-----END PRIVATE KEY-----\\n',
    });

    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = `'${samplePayload}'`;
    const quotedStatus = getFirebaseAdminStatus();
    assert.equal(quotedStatus.hasServiceAccount, true);
    assert.equal(quotedStatus.projectId, 'gen-lang-client-0361533735');

    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = Buffer.from(samplePayload, 'utf8').toString('base64');
    const b64Status = getFirebaseAdminStatus();
    assert.equal(b64Status.hasServiceAccount, true);
    assert.equal(b64Status.projectId, 'gen-lang-client-0361533735');
  } finally {
    if (prevJson === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = prevJson;
  }
});
