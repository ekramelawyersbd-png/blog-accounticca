import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser } from '../context/AuthContext';

export interface ToolSigningRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  photoURL?: string;
  toolId: string;
  toolName: string;
  toolCategory: string;
  toolPath: string;
  authProvider: string;
  signedAt: string;
  formattedDate: string;
  sessionStatus: 'active' | 'verified' | 'completed';
  userAgent?: string;
}

const LOCAL_STORAGE_SIGNINGS_KEY = 'elaw_workspace_tool_signings';
const LAST_RECORDED_MAP = new Map<string, number>();

// Format date into Bangladesh Standard Time (BST, UTC+6) readable string
export function formatBstDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date) + ' (BST)';
  } catch {
    return date.toLocaleString() + ' BST';
  }
}

/**
 * Record a user signing session when accessing a tool freely.
 * Records to Firestore, Backend Server, and LocalStorage.
 */
export async function recordToolSigning(
  toolId: string,
  toolName: string,
  toolCategory: string,
  toolPath: string,
  user: AppUser | null
): Promise<ToolSigningRecord | null> {
  if (!user) return null;

  const now = Date.now();
  const userToolKey = `${user.uid}_${toolId}`;
  const lastLogged = LAST_RECORDED_MAP.get(userToolKey) || 0;

  // 60-second cooldown per tool to prevent redundant spam writes
  if (now - lastLogged < 60000) {
    return null;
  }
  LAST_RECORDED_MAP.set(userToolKey, now);

  const id = `sign-${now}-${Math.random().toString(36).substring(2, 7)}`;
  const record: ToolSigningRecord = {
    id,
    userId: user.uid,
    userEmail: user.email || 'anonymous@elawyersbd.com',
    userName: user.displayName || user.email?.split('@')[0] || 'Verified Advocate/Member',
    photoURL: user.photoURL || undefined,
    toolId,
    toolName,
    toolCategory,
    toolPath,
    authProvider: user.email?.endsWith('@gmail.com') ? 'Google Verified' : 'eLawyers BD Auth',
    signedAt: new Date(now).toISOString(),
    formattedDate: formatBstDate(new Date(now)),
    sessionStatus: 'active',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  };

  // 1. Save to Local Storage immediately
  try {
    const localSignings = getLocalSignings();
    localSignings.unshift(record);
    if (localSignings.length > 500) localSignings.length = 500;
    localStorage.setItem(LOCAL_STORAGE_SIGNINGS_KEY, JSON.stringify(localSignings));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }

  // 2. Sync to Backend API
  try {
    fetch('/api/workspace/tool-signings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(() => {});
  } catch {}

  // 3. Sync to Firestore collection 'workspace_tool_signings'
  try {
    const docRef = doc(db, 'workspace_tool_signings', id);
    await setDoc(docRef, record);
  } catch (err) {
    console.warn('Firestore tool signing record warning (persisted locally & backend):', err);
  }

  // Trigger browser storage event so any open Workspace tab updates live
  try {
    window.dispatchEvent(new CustomEvent('elaw_tool_signing_updated', { detail: record }));
  } catch {}

  return record;
}

function getLocalSignings(): ToolSigningRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SIGNINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Fetch all signing records from Firestore, falling back to Backend API and Local Storage.
 */
export async function fetchAllToolSignings(): Promise<ToolSigningRecord[]> {
  const mergedMap = new Map<string, ToolSigningRecord>();

  // 1. Seed from local storage
  getLocalSignings().forEach(s => mergedMap.set(s.id, s));

  // 2. Fetch from Backend API
  try {
    const res = await fetch('/api/workspace/tool-signings');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.signings)) {
        data.signings.forEach((s: ToolSigningRecord) => mergedMap.set(s.id, s));
      }
    }
  } catch (err) {
    console.debug('Backend signing API fetch fallback:', err);
  }

  // 3. Fetch from Firestore
  try {
    const colRef = collection(db, 'workspace_tool_signings');
    const q = query(colRef, orderBy('signedAt', 'desc'), limit(150));
    const snap = await getDocs(q);
    snap.forEach(d => {
      const data = d.data() as ToolSigningRecord;
      mergedMap.set(data.id, data);
    });
  } catch (err) {
    console.debug('Firestore query fallback to local/backend signings:', err);
  }

  const allRecords = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
  );

  return allRecords;
}

/**
 * Delete a specific signing record.
 */
export async function deleteToolSigning(id: string): Promise<boolean> {
  // 1. Remove from local storage
  try {
    const local = getLocalSignings().filter(s => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_SIGNINGS_KEY, JSON.stringify(local));
  } catch {}

  // 2. Delete from Backend API
  try {
    fetch(`/api/workspace/tool-signings/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch {}

  // 3. Delete from Firestore
  try {
    await deleteDoc(doc(db, 'workspace_tool_signings', id));
  } catch {}

  return true;
}

/**
 * Export records as CSV for legal/firm audit.
 */
export function exportToolSigningsCsv(records: ToolSigningRecord[]): void {
  const headers = ['Record ID', 'User Name', 'Email', 'Tool Name', 'Category', 'Tool Path', 'Provider', 'Signed At (BST)', 'Status'];
  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.userName.replace(/"/g, '""')}"`,
    `"${r.userEmail}"`,
    `"${r.toolName.replace(/"/g, '""')}"`,
    `"${r.toolCategory}"`,
    `"${r.toolPath}"`,
    `"${r.authProvider}"`,
    `"${r.formattedDate}"`,
    `"${r.sessionStatus}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `elawyersbd_tool_signings_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
