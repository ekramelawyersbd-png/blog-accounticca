import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  const verifySessionOnServer = useCallback(
    async (tokenToVerify: string): Promise<boolean> => {
      if (!tokenToVerify || typeof tokenToVerify !== 'string') {
        clearStoredAdminSession();
        return false;
      }

      try {
        const res = await fetch('/api/admin/verify', {
          headers: {
            'x-admin-token': tokenToVerify,
            Authorization: `Bearer ${tokenToVerify}`
          }
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.authenticated && data.user && data.user.role === 'admin') {
            setToken(tokenToVerify);
            setAdminUser(data.user as AdminUser);
            setIsAuthenticated(true);
            try {
              localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data.user));
            } catch {
              // ignore
            }
            return true;
          }
        }
      } catch (err) {
        console.warn('[Shop Auth] Server verification error:', err);
      }

      clearStoredAdminSession();
      return false;
    },
    [clearStoredAdminSession]
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const current = getStoredAdminToken();
    if (!current) {
      clearStoredAdminSession();
      return false;
    }
    return verifySessionOnServer(current);
  }, [clearStoredAdminSession, verifySessionOnServer]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const existingToken = getStoredAdminToken();
      if (existingToken) {
        await verifySessionOnServer(existingToken);
      } else if (mounted) {
        setIsAuthenticated(false);
        setAdminUser(null);
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
  }, [clearStoredAdminSession, refreshSession, verifySessionOnServer]);

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
        body: JSON.stringify({ email: normalizedEmail, password: cleanPass })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.token || !data.user) {
        const errorMsg =
          data.error ||
          data.message ||
          (res.status === 503
            ? 'Administrator authentication is not configured on the server. Set ADMIN_PASSWORD_HASH or sign in with verified Google Admin SSO.'
            : 'Invalid administrator credentials. Server verification failed.');
        setLoginError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const newToken = String(data.token);
      const verifiedUser = data.user as AdminUser;

      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(verifiedUser));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      setToken(newToken);
      setAdminUser(verifiedUser);
      setIsAuthenticated(true);
      setLoginError(null);

      return { success: true };
    } catch {
      const errorMsg = 'Unable to reach authentication server. Administrator sign-in requires live server verification.';
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
            Authorization: `Bearer ${currentToken}`
          }
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
        logout,
        clearError,
        refreshSession
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
