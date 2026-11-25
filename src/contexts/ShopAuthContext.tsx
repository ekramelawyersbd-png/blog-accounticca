import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, fallbackAuth } from '../lib/firebase';
import { authService } from '../services/authService';

export interface AdminUser {
  email: string;
  role: 'admin';
  name: string;
  title: string;
}

interface ShopAuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  syncActiveFirebaseAdmin: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<boolean>;
}

export const ADMIN_TOKEN_KEY = 'accounticca_workspace_admin_token_v2';
export const ADMIN_PROFILE_KEY = 'accounticca_workspace_admin_profile_v2';
export const ADMIN_AUTH_UPDATED_EVENT = 'accounticca:admin-auth-updated';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns authentication headers for admin-only backend endpoints.
 * Preserves any existing `Authorization` header (e.g., Google Workspace OAuth token)
 * while attaching the admin session token via `x-admin-token`.
 */
export function getAdminAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const adminToken = getStoredAdminToken();
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
    if (!headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
  }
  return headers;
}

const ShopAuthContext = createContext<ShopAuthContextType | null>(null);

export function ShopAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const persistAdminSession = useCallback((newToken: string, verifiedUser: AdminUser) => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(verifiedUser));
      localStorage.setItem('accounticca_admin_session_token', newToken);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setToken(newToken);
    setAdminUser(verifiedUser);
    setIsAuthenticated(true);
    setLoginError(null);
  }, []);

  const clearStoredAdminSession = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
      localStorage.removeItem('accounticca_admin_session_token');
    } catch {
      // ignore storage errors
    }
    setToken(null);
    setAdminUser(null);
    setIsAuthenticated(false);
  }, []);

  const exchangeFirebaseIdTokenForAdminSession = useCallback(
    async (idToken: string): Promise<{ success: boolean; error?: string }> => {
      if (!idToken) {
        return { success: false, error: 'Missing Firebase ID token for administrator verification.' };
      }
      try {
        const res = await fetch('/api/admin/oauth-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.token || !data.user) {
          return {
            success: false,
            error:
              data.error ||
              data.message ||
              'Your signed-in account is not authorized as an administrator.',
          };
        }

        persistAdminSession(String(data.token), data.user as AdminUser);
        return { success: true };
      } catch {
        return {
          success: false,
          error: 'Unable to reach authentication server to verify administrator session.',
        };
      }
    },
    [persistAdminSession]
  );

  const syncActiveFirebaseAdmin = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const activeFbUser = fallbackAuth.currentUser || auth.currentUser;
    if (!activeFbUser) {
      return { success: false, error: 'No active Google/Firebase session found.' };
    }
    try {
      const idToken = await activeFbUser.getIdToken(true);
      const result = await exchangeFirebaseIdTokenForAdminSession(idToken);
      if (!result.success && result.error) {
        setLoginError(result.error);
      }
      return result;
    } catch {
      return { success: false, error: 'Unable to refresh Firebase ID token for admin sync.' };
    }
  }, [exchangeFirebaseIdTokenForAdminSession]);

  const verifySessionOnServer = useCallback(
    async (tokenToVerify: string): Promise<boolean> => {
      if (tokenToVerify && typeof tokenToVerify === 'string') {
        try {
          const res = await fetch('/api/admin/verify', {
            headers: {
              'x-admin-token': tokenToVerify,
              Authorization: `Bearer ${tokenToVerify}`,
            },
          });

          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.authenticated && data.user && data.user.role === 'admin') {
              persistAdminSession(tokenToVerify, data.user as AdminUser);
              return true;
            }
          }
        } catch (err) {
          console.warn('[Shop Auth] Server verification error:', err);
        }
      }

      // If stored admin session expired or server restarted, try seamless Firebase ID token re-sync
      const activeFbUser = fallbackAuth.currentUser || auth.currentUser;
      if (activeFbUser) {
        try {
          const idToken = await activeFbUser.getIdToken();
          const synced = await exchangeFirebaseIdTokenForAdminSession(idToken);
          if (synced.success) {
            return true;
          }
        } catch {
          // Proceed to clear stale token
        }
      }

      clearStoredAdminSession();
      return false;
    },
    [clearStoredAdminSession, exchangeFirebaseIdTokenForAdminSession, persistAdminSession]
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const current = getStoredAdminToken();
    return verifySessionOnServer(current || '');
  }, [verifySessionOnServer]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const existingToken = getStoredAdminToken();
      if (existingToken) {
        await verifySessionOnServer(existingToken);
      } else {
        const activeFbUser = fallbackAuth.currentUser || auth.currentUser;
        if (activeFbUser) {
          try {
            const idToken = await activeFbUser.getIdToken();
            await exchangeFirebaseIdTokenForAdminSession(idToken);
          } catch {
            if (mounted) {
              setIsAuthenticated(false);
              setAdminUser(null);
            }
          }
        } else if (mounted) {
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    const handleExternalUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ token?: string; user?: AdminUser }>).detail;
      if (detail?.token && detail?.user?.role === 'admin') {
        setToken(detail.token);
        setAdminUser(detail.user);
        setIsAuthenticated(true);
        setIsLoading(false);
      } else if (detail && detail.token === undefined) {
        clearStoredAdminSession();
      } else {
        void refreshSession();
      }
    };

    window.addEventListener(ADMIN_AUTH_UPDATED_EVENT, handleExternalUpdate);
    return () => {
      mounted = false;
      window.removeEventListener(ADMIN_AUTH_UPDATED_EVENT, handleExternalUpdate);
    };
  }, [
    clearStoredAdminSession,
    exchangeFirebaseIdTokenForAdminSession,
    refreshSession,
    verifySessionOnServer,
  ]);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);
    try {
      const sessionUser = await authService.loginWithGoogle();
      if (!sessionUser?.token) {
        const msg = 'Google sign-in completed, but no verifiable ID token was returned.';
        setLoginError(msg);
        return { success: false, error: msg };
      }

      const syncResult = await exchangeFirebaseIdTokenForAdminSession(sessionUser.token);
      if (!syncResult.success) {
        const msg =
          syncResult.error ||
          `Account "${sessionUser.email}" is not in the authorized administrator allowlist.`;
        setLoginError(msg);
        return { success: false, error: msg };
      }

      return { success: true };
    } catch (err: any) {
      const code = String(err?.code || '');
      const msg =
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? 'Google sign-in popup was closed before completion.'
          : err?.message || 'Google administrator sign-in failed. Please try again.';
      setLoginError(msg);
      return { success: false, error: msg };
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);
    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanPass = pass || '';

    if (!normalizedEmail || !cleanPass.trim()) {
      const msg = 'Please enter both administrator email and password.';
      setLoginError(msg);
      return { success: false, error: msg };
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: cleanPass }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.token && data.user) {
        persistAdminSession(String(data.token), data.user as AdminUser);
        return { success: true };
      }

      // If server password hash is unset (503) or credentials differ from server hash (401),
      // verify against Firebase Auth email/password and exchange the verified Firebase ID token.
      if (res.status === 503 || res.status === 401) {
        const authInstances = auth === fallbackAuth ? [auth] : [auth, fallbackAuth];
        for (const authInst of authInstances) {
          try {
            const cred = await signInWithEmailAndPassword(authInst, normalizedEmail, cleanPass);
            const idToken = await cred.user.getIdToken();
            const synced = await exchangeFirebaseIdTokenForAdminSession(idToken);
            if (synced.success) {
              return { success: true };
            }
            if (synced.error) {
              setLoginError(synced.error);
              return { success: false, error: synced.error };
            }
          } catch {
            // Try next auth instance or fall back to server error message
          }
        }
      }

      const errorMsg =
        res.status === 503
          ? 'Server password login is not configured. Click "Sign in with Google" above using your authorized administrator Google account.'
          : data.error ||
            data.message ||
            'Invalid administrator credentials. Verify your password or click "Sign in with Google" above.';
      setLoginError(errorMsg);
      return { success: false, error: errorMsg };
    } catch {
      const errorMsg =
        'Unable to reach authentication server. Administrator sign-in requires live server verification.';
      setLoginError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async (): Promise<void> => {
    const currentToken = token || getStoredAdminToken();
    if (currentToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'x-admin-token': currentToken,
            Authorization: `Bearer ${currentToken}`,
          },
        });
      } catch (err) {
        console.warn('Logout notice:', err);
      }
    }

    clearStoredAdminSession();
  };

  const clearError = () => {
    setLoginError(null);
  };

  return (
    <ShopAuthContext.Provider
      value={{
        adminUser,
        token,
        isAuthenticated,
        isLoading,
        loginError,
        login,
        loginWithGoogle,
        syncActiveFirebaseAdmin,
        logout,
        clearError,
        refreshSession,
      }}
    >
      {children}
    </ShopAuthContext.Provider>
  );
}

export function useShopAuth() {
  const context = useContext(ShopAuthContext);
  if (!context) {
    throw new Error('useShopAuth must be used within a ShopAuthProvider');
  }
  return context;
}
