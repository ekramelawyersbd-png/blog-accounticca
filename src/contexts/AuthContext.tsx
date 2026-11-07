import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, fallbackAuth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { authService, ERPAuthUser } from '../services/authService';

interface AuthContextType {
  user: User | null;
  authUser: ERPAuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<ERPAuthUser>;
  signInWithFacebook: () => Promise<ERPAuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<ERPAuthUser | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isBridging = false;

    const handleAuthState = async (incomingUser: User | null) => {
      // If customDomainAuth is signed in, but fallbackAuth (Firestore project) is not yet bridged,
      // try to bridge using cached Google OAuth access_token
      if (auth.currentUser && !fallbackAuth.currentUser && !isBridging) {
        const cachedOAuthToken = localStorage.getItem('erp_google_oauth_access_token');
        if (cachedOAuthToken) {
          isBridging = true;
          try {
            const bridgeCred = GoogleAuthProvider.credential(null, cachedOAuthToken);
            await signInWithCredential(fallbackAuth, bridgeCred);
          } catch {
            localStorage.removeItem('erp_google_oauth_access_token');
          } finally {
            isBridging = false;
          }
        }
      }

      const activeUser = fallbackAuth.currentUser || auth.currentUser || incomingUser;

      if (activeUser) {
        setUser(activeUser);
        const currentEmail = (activeUser.email || activeUser.providerData?.[0]?.email || '').trim().toLowerCase();
        const isAdmin = [
          "admin@erpforu.com",
          "superadmin@erpforu.com",
          "info@erpforu.com",
          "ekram@elawyersbd.com",
          "ekram.elawyersbd@gmail.com",
          "hmekram@gmail.com",
          "hmekram@mail.com",
          "admin@admin.com"
        ].includes(currentEmail);

        const role: 'admin' | 'client' = isAdmin ? 'admin' : 'client';
        const roleId: 'role-admin' | 'role-client' = isAdmin ? 'role-admin' : 'role-client';
        const displayName = activeUser.displayName || (currentEmail ? currentEmail.split('@')[0] : 'User');

        try {
          const token = await activeUser.getIdToken();
          const rawProviderId = activeUser.providerData?.[0]?.providerId || '';
          const provider: 'google' | 'facebook' | 'email' = 
            rawProviderId === 'facebook.com' ? 'facebook' :
            rawProviderId === 'google.com' ? 'google' : 'email';

          const sessionUser: ERPAuthUser = {
            uid: activeUser.uid,
            email: currentEmail,
            displayName,
            photoURL: activeUser.photoURL || null,
            role,
            roleId,
            provider,
            token
          };
          setAuthUser(sessionUser);
          localStorage.setItem('erp_auth_user', JSON.stringify(sessionUser));
        } catch {
          // Fallback session user if token refresh fails while offline
          const fallbackSession: ERPAuthUser = {
            uid: activeUser.uid,
            email: currentEmail,
            displayName,
            photoURL: activeUser.photoURL || null,
            role,
            roleId,
            provider: 'google',
            token: ''
          };
          setAuthUser(fallbackSession);
          localStorage.setItem('erp_auth_user', JSON.stringify(fallbackSession));
        }

        // Only write to Firestore users collection when fallbackAuth.currentUser (the Firestore project's Auth) is authenticated
        const firestoreUser = fallbackAuth.currentUser;
        if (firestoreUser) {
          try {
            const userRef = doc(db, 'users', firestoreUser.uid);
            await setDoc(
              userRef,
              {
                email: currentEmail,
                displayName: activeUser.displayName || displayName,
                updatedAt: serverTimestamp(),
                role
              },
              { merge: true }
            );
          } catch {
            // Client may be operating in offline mode; local cache will sync when online
          }
        }
      } else {
        if (!auth.currentUser && !fallbackAuth.currentUser) {
          setUser(null);
          setAuthUser(null);
          localStorage.removeItem('erp_auth_user');
        }
      }
      setLoading(false);
    };

    const unsub1 = onAuthStateChanged(auth, handleAuthState);
    const unsub2 = onAuthStateChanged(fallbackAuth, handleAuthState);

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const signInWithGoogle = async (): Promise<ERPAuthUser> => {
    const session = await authService.loginWithGoogle();
    setAuthUser(session);
    return session;
  };

  const signInWithFacebook = async (): Promise<ERPAuthUser> => {
    const session = await authService.loginWithFacebook();
    setAuthUser(session);
    return session;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authUser, loading, signInWithGoogle, signInWithFacebook, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

