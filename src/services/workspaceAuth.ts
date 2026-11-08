import { 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth, fallbackAuth, getActivePopupAuth } from '../lib/firebase';

export const WORKSPACE_SCOPES = [
  // Drive & Files
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  // Spreadsheets
  'https://www.googleapis.com/auth/spreadsheets',
  // Calendar
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  // Docs & Presentations
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  // Tasks
  'https://www.googleapis.com/auth/tasks',
  // Chat
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.messages',
  // Forms
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  // Meet
  'https://www.googleapis.com/auth/meetings.space.created',
  // Contacts / People
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  // Classroom
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  // Gmail
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels'
];

// Token storage keys for permanent session persistence
const STORAGE_KEY_TOKEN = 'workspace_google_access_token';
const STORAGE_KEY_EMAIL = 'workspace_google_user_email';
const STORAGE_KEY_TIMESTAMP = 'workspace_google_token_timestamp';
export const DEFAULT_WORKSPACE_EMAIL = 'ekram.elawyersbd@gmail.com';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Create provider with scopes pre-bound to ekram.elawyersbd@gmail.com
export const createWorkspaceGoogleProvider = (emailHint: string = DEFAULT_WORKSPACE_EMAIL) => {
  const provider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  provider.setCustomParameters({
    login_hint: emailHint,
    prompt: 'consent',
    access_type: 'offline'
  });
  return provider;
};

export const getAccessToken = (): string | null => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (saved) {
      cachedAccessToken = saved;
      return cachedAccessToken;
    }
  } catch (e) {
    // ignore
  }
  // Fallback to active session token if present
  return cachedAccessToken;
};

export const getConnectedWorkspaceEmail = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_EMAIL) || DEFAULT_WORKSPACE_EMAIL;
  } catch {
    return DEFAULT_WORKSPACE_EMAIL;
  }
};

export const setAccessToken = (token: string | null, email: string = DEFAULT_WORKSPACE_EMAIL) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
    }
  } catch (e) {
    // ignore
  }
};

export const signInWithWorkspaceGoogle = async (emailHint: string = DEFAULT_WORKSPACE_EMAIL): Promise<{ user: User; accessToken: string }> => {
  const activeAuth = getActivePopupAuth();
  try {
    isSigningIn = true;
    const provider = createWorkspaceGoogleProvider(emailHint);
    const result = await signInWithPopup(activeAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Workspace access token. Please ensure popup was authorized.');
    }

    cachedAccessToken = credential.accessToken;
    const connectedEmail = result.user.email || emailHint;

    // Silently bridge the Google OAuth access_token to the Firestore project Auth instance
    try {
      localStorage.setItem('erp_google_oauth_access_token', cachedAccessToken);
      if (fallbackAuth && activeAuth !== fallbackAuth) {
        const bridgeCred = GoogleAuthProvider.credential(null, cachedAccessToken);
        await signInWithCredential(fallbackAuth, bridgeCred);
      }
    } catch {
      // Proceed with primary user if bridge is skipped
    }
    
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, cachedAccessToken);
      localStorage.setItem(STORAGE_KEY_EMAIL, connectedEmail);
      localStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
    } catch (e) {
      // ignore
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.error('Workspace Google sign-in failed:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutWorkspace = async () => {
  try {
    await Promise.allSettled([signOut(auth), signOut(fallbackAuth)]);
  } catch (e) {
    // ignore
  }
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
  } catch (e) {
    // ignore
  }
};

