import { initializeApp } from 'firebase/app';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress internal @firebase/firestore 10s WebChannel timeout console errors in proxied iframe environments
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

// Custom Domain Auth configuration for https://accounticca.com/__/auth/handler
// Uses the Firebase project that owns the accounticca.com Firebase Hosting domain
// to prevent auth/invalid-continue-uri while displaying "continue to accounticca.com"
const customDomainFirebaseConfig = {
  apiKey: "AIzaSyBC1NdgFVxE5YULuYJV_zSX9-W-P4wP-iE",
  authDomain: "accounticca.com",
  projectId: "elawyersnew",
  storageBucket: "elawyersnew.firebasestorage.app",
  messagingSenderId: "56739184994",
  appId: "1:56739184994:web:43721b822379a65ed22c3b",
  measurementId: "G-5L7XVT8MDQ"
};

// Blog Accounticca Firebase configuration for https://blog.accounticca.com/ & Analytics (G-ZHZ01KNB7B)
const blogAccounticcaConfig = {
  apiKey: "AIzaSyBqo37wCFYp0SQTmAT9h0bl78YEg18rAyU",
  authDomain: "blogaccounticca.firebaseapp.com",
  projectId: "blogaccounticca",
  storageBucket: "blogaccounticca.firebasestorage.app",
  messagingSenderId: "176585173933",
  appId: "1:176585173933:web:e1c7f1973102e0bc8f0f24",
  measurementId: "G-ZHZ01KNB7B"
};

// Initialize Primary App from provisioned firebase-applet-config.json + auxiliary apps
export const app = initializeApp(firebaseConfig);
export const customDomainApp = initializeApp(customDomainFirebaseConfig, 'accounticcaAuthApp');
export const blogAccounticcaApp = initializeApp(blogAccounticcaConfig, 'blogAccounticcaApp');
export const fallbackApp = app;

const FIRESTORE_DB_ID =
  firebaseConfig.firestoreDatabaseId ||
  'ai-studio-accounticcainsig-89414606-29ba-4643-944b-e0ac41725d03';

// Initialize Firestore with specific database ID, forced long-polling for iframe/proxy resilience, and local cache
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    FIRESTORE_DB_ID
  );
} catch {
  firestoreDb = getFirestore(app, FIRESTORE_DB_ID);
}

export const db = firestoreDb;

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

// Initialize Auth & Cloud Functions
// customDomainAuth serves https://accounticca.com/__/auth/handler ("to continue to accounticca.com")
// fallbackAuth serves provisioned applet authDomain (matches Firestore DB project & *.ai.studio / *.run.app)
export const customDomainAuth = getAuth(customDomainApp);
export const fallbackAuth = getAuth(app);
export const blogAccounticcaAuth = getAuth(blogAccounticcaApp);

const isAccounticcaCustomRoot =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'accounticca.com' ||
    window.location.hostname.endsWith('.accounticca.com'));

export const auth = isAccounticcaCustomRoot ? customDomainAuth : fallbackAuth;
export const functions = getFunctions(app);

/**
 * Returns the active popup Auth instance matching the current deployment domain
 * (`customDomainAuth` on accounticca.com, `fallbackAuth` on accounticca.ai.studio / Cloud Run).
 */
export function getActivePopupAuth() {
  return auth;
}

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
facebookProvider.setCustomParameters({
  display: 'popup'
});

// Initialize Analytics (supported in browser environment) using blogaccounticca Measurement ID (G-ZHZ01KNB7B)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
export let primaryAnalytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(blogAccounticcaApp);
      try {
        primaryAnalytics = getAnalytics(app);
      } catch {
        // Primary analytics optional when blogaccounticca analytics is active
      }
    }
  }).catch(() => {
    // Ignore analytics init failure in non-supported environments
  });
}



