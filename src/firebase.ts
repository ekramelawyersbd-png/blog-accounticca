import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { app, customDomainAuth as auth, db, googleProvider } from './lib/firebase';

export { auth, db, googleProvider, signInWithPopup, fbSignOut };
export default app;

