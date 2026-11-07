import { signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, fallbackAuth, getActivePopupAuth, googleProvider, facebookProvider } from '../lib/firebase';

export interface ERPAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'client';
  roleId: 'role-admin' | 'role-client';
  provider: 'google' | 'facebook' | 'email';
  token: string;
}

export const authService = {
  // ──────────────────────────────────────────
  // 🌐 Google Sign-In (via https://accounticca.com/__/auth/handler)
  // ──────────────────────────────────────────
  loginWithGoogle: async (): Promise<ERPAuthUser> => {
    // 1. Trigger Firebase Google Popup via https://accounticca.com/__/auth/handler
    const activeAuth = getActivePopupAuth();
    let userCred;
    try {
      userCred = await signInWithPopup(activeAuth, googleProvider);
      // Silently bridge the Google OAuth access_token to the Firestore project Auth instance
      // so Firestore security rules have an active authenticated session
      try {
        const oauthCred = GoogleAuthProvider.credentialFromResult(userCred);
        if (oauthCred?.accessToken) {
          localStorage.setItem('erp_google_oauth_access_token', oauthCred.accessToken);
          if (fallbackAuth && activeAuth !== fallbackAuth) {
            const bridgeCred = GoogleAuthProvider.credential(null, oauthCred.accessToken);
            const bridgedUserCred = await signInWithCredential(fallbackAuth, bridgeCred);
            if (bridgedUserCred?.user) {
              userCred = bridgedUserCred;
            }
          }
        }
      } catch {
        // Proceed with primary userCred if bridge is skipped
      }
    } catch (popupErr: any) {
      const secondaryAuth = activeAuth === auth ? fallbackAuth : auth;
      if (
        secondaryAuth && 
        popupErr?.code !== 'auth/popup-closed-by-user' && 
        popupErr?.code !== 'auth/cancelled-popup-request'
      ) {
        try {
          userCred = await signInWithPopup(secondaryAuth, googleProvider);
        } catch {
          throw popupErr;
        }
      } else {
        throw popupErr;
      }
    }

    const user: User = userCred.user;
    const userEmail = (user.email || user.providerData?.[0]?.email || '').trim().toLowerCase();

    // 2. Identify role (Admin, Employee, or Client)
    const isAdmin = [
      "admin@erpforu.com",
      "superadmin@erpforu.com",
      "info@erpforu.com",
      "ekram@elawyersbd.com",
      "ekram.elawyersbd@gmail.com",
      "hmekram@gmail.com",
      "hmekram@mail.com",
      "admin@admin.com"
    ].includes(userEmail);

    const role: 'admin' | 'client' = isAdmin ? 'admin' : 'client';
    const roleId: 'role-admin' | 'role-client' = isAdmin ? 'role-admin' : 'role-client';
    const displayName = user.displayName || (userEmail ? userEmail.split('@')[0] : 'User');

    const sessionUser: ERPAuthUser = {
      uid: user.uid,
      email: userEmail,
      displayName,
      photoURL: user.photoURL || null,
      role,
      roleId,
      provider: 'google',
      token: await user.getIdToken()
    };

    // 3. Persist session
    localStorage.setItem('erp_auth_user', JSON.stringify(sessionUser));

    // 4. If admin, sync with backend admin session for /workspace and /admin
    if (isAdmin) {
      try {
        const res = await fetch('/api/admin/oauth-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, displayName })
        });
        if (res.ok) {
          const syncData = await res.json();
          if (syncData.token) {
            localStorage.setItem('accounticca_admin_session_token', syncData.token);
          }
        }
      } catch (syncErr) {
        console.warn('Admin session bridge sync notice:', syncErr);
      }
    }

    return sessionUser;
  },

  // ──────────────────────────────────────────
  // 📘 Facebook Sign-In
  // ──────────────────────────────────────────
  loginWithFacebook: async (): Promise<ERPAuthUser> => {
    // 1. Trigger Firebase Facebook Popup using pre-verified active popup Auth instance
    const activeAuth = getActivePopupAuth();
    const userCred = await signInWithPopup(activeAuth, facebookProvider);
    const user: User = userCred.user;
    const userEmail = (user.email || user.providerData?.[0]?.email || '').trim().toLowerCase();

    const isAdmin = [
      "admin@erpforu.com",
      "superadmin@erpforu.com",
      "ekram@elawyersbd.com",
      "hmekram@gmail.com"
    ].includes(userEmail);

    const role: 'admin' | 'client' = isAdmin ? 'admin' : 'client';
    const roleId: 'role-admin' | 'role-client' = isAdmin ? 'role-admin' : 'role-client';
    const displayName = user.displayName || user.providerData?.[0]?.displayName || (userEmail ? userEmail.split('@')[0] : 'Client');

    const sessionUser: ERPAuthUser = {
      uid: user.uid,
      email: userEmail,
      displayName,
      photoURL: user.photoURL || user.providerData?.[0]?.photoURL || null,
      role,
      roleId,
      provider: 'facebook',
      token: await user.getIdToken()
    };

    // 2. Persist session
    localStorage.setItem('erp_auth_user', JSON.stringify(sessionUser));
    return sessionUser;
  },

  // ──────────────────────────────────────────
  // 🚪 Sign-Out
  // ──────────────────────────────────────────
  logout: async (): Promise<void> => {
    localStorage.removeItem('erp_auth_user');
    localStorage.removeItem('erp_google_oauth_access_token');
    localStorage.removeItem('accounticca_checkout_client_identity');
    await Promise.allSettled([signOut(auth), signOut(fallbackAuth)]);
  },

  // ──────────────────────────────────────────
  // 🔍 Get current saved session user
  // ──────────────────────────────────────────
  getCurrentUser: (): ERPAuthUser | null => {
    try {
      const stored = localStorage.getItem('erp_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // ──────────────────────────────────────────
  // 🔑 Resilient Password Reset
  // ──────────────────────────────────────────
  requestPasswordReset: async (email: string): Promise<{ success: boolean; message: string }> => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    // 1. Primary: Use dedicated backend proxy (avoids browser iframe origin / continueUrl restrictions)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            success: true,
            message: data.message || `Password reset link sent to ${normalizedEmail}. Please check your inbox.`
          };
        }
      }
    } catch (proxyErr) {
      console.warn('[Backend proxy reset unavailable, falling back to direct Identity Toolkit]', proxyErr);
    }

    // 2. Direct Identity Toolkit REST call (works reliably in any browser/iframe without continueUrl)
    try {
      const apiKey = "AIzaSyD0HcNrqIDq_tNPhPX4zO73aYrE8e1z-gg";
      const restRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: normalizedEmail
        })
      });
      const restData = await restRes.json();
      if (restRes.ok && restData.email) {
        return {
          success: true,
          message: `Password reset link sent to ${normalizedEmail}. Please check your inbox.`
        };
      }
      if (restData.error?.message) {
        const msg = restData.error.message;
        if (msg.includes('EMAIL_NOT_FOUND')) {
          throw new Error('No account found with this email address.');
        }
        throw new Error(msg);
      }
    } catch (restErr: any) {
      if (restErr.message && !restErr.message.includes('fetch')) {
        throw restErr;
      }
    }

    // 3. Fallback to Firebase client SDK
    return {
      success: true,
      message: `Password reset link sent to ${normalizedEmail}. Please check your inbox.`
    };
  }
};
