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

// Suppress internal @firebase/firestore 10s WebChannel timeout console errors in proxied iframe environments
try {
  setLogLevel('silent');
} catch {
  // Ignore if setLogLevel is unavailable
}

// Primary Firebase configuration for Firestore & backend project (gen-lang-client-0396222608)
const firebaseConfig = {
  apiKey: "AIzaSyD0HcNrqIDq_tNPhPX4zO73aYrE8e1z-gg",
  authDomain: "gen-lang-client-0396222608.firebaseapp.com",
  projectId: "gen-lang-client-0396222608",
  storageBucket: "gen-lang-client-0396222608.firebasestorage.app",
  messagingSenderId: "425825496026",
  appId: "1:425825496026:web:f1564f14d5ae5ba920eee3",
  measurementId: "G-P4WQ33CP7G"
};

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

// Initialize Firebase Apps
export const app = initializeApp(firebaseConfig);
export const customDomainApp = initializeApp(customDomainFirebaseConfig, 'accounticcaAuthApp');
export const fallbackApp = app;

const FIRESTORE_DB_ID = "ai-studio-accounticcainsig-89414606-29ba-4643-944b-e0ac41725d03";

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
// fallbackAuth serves gen-lang-client-0396222608.firebaseapp.com (matches Firestore DB project)
export const customDomainAuth = getAuth(customDomainApp);
export const fallbackAuth = getAuth(app);
export const auth = customDomainAuth;
export const functions = getFunctions(app);

/**
 * Returns the active popup Auth instance configured with authDomain: "accounticca.com"
 * so the Google Sign-In account chooser displays "to continue to accounticca.com".
 */
export function getActivePopupAuth() {
  return customDomainAuth;
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

// Initialize Analytics (supported in browser environment)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics init failure in non-supported environments
  });
}



