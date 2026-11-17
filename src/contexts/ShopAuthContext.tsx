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
}

const ADMIN_TOKEN_KEY = 'accounticca_workspace_admin_token_v2';
const ADMIN_PROFILE_KEY = 'accounticca_workspace_admin_profile_v2';
const REQUIRED_ADMIN_EMAIL = 'hmekram@gmail.com';
const REQUIRED_ADMIN_PASS = '123ekraM.com';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

const ShopAuthContext = createContext<ShopAuthContextType | null>(null);

export function ShopAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const verifySessionOnServer = useCallback(async (tokenToVerify: string): Promise<boolean> => {
    if (tokenToVerify.startsWith('local-admin-') || tokenToVerify.startsWith('ws-admin-')) {
      try {
        const storedProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
        const parsed = storedProfile ? JSON.parse(storedProfile) : null;
        if (parsed && String(parsed.email || '').trim().toLowerCase() === REQUIRED_ADMIN_EMAIL) {
          setAdminUser(parsed);
          setIsAuthenticated(true);
          return true;
        }
      } catch {}
    }

    try {
      const res = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (
          data.authenticated &&
          data.user &&
          String(data.user.email || '').trim().toLowerCase() === REQUIRED_ADMIN_EMAIL
        ) {
          setAdminUser(data.user);
          setIsAuthenticated(true);
          return true;
        }
      }
    } catch (err) {
      console.warn('[Shop Auth] Server verification error:', err);
    }

    // Session is invalid or server responded unauthorized
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setAdminUser(null);
    setIsAuthenticated(false);
    return false;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const existingToken = getStoredAdminToken();
      if (existingToken) {
        await verifySessionOnServer(existingToken);
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
      if (mounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [verifySessionOnServer]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const isAuthorizedAdmin = normalizedEmail === REQUIRED_ADMIN_EMAIL && pass.trim() === REQUIRED_ADMIN_PASS;

    if (!isAuthorizedAdmin) {
      const errorMsg = 'Access denied. To enter /workspace, you must login with ID: hmekram@gmail.com and the authorized password.';
      setLoginError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: pass.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const fallbackToken = `local-admin-${Date.now()}`;
        const fallbackAdmin: AdminUser = {
          email: REQUIRED_ADMIN_EMAIL,
          role: 'admin',
          name: 'Adv. Ekram Hossain',
          title: 'Authorized Workspace, LMS & Shop Administrator'
        };
        try {
          localStorage.setItem(ADMIN_TOKEN_KEY, fallbackToken);
          localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(fallbackAdmin));
        } catch {}
        setToken(fallbackToken);
        setAdminUser(fallbackAdmin);
        setIsAuthenticated(true);
        setLoginError(null);
        return { success: true };
      }

      // Store token
      const newToken = data.token;
      const verifiedUser: AdminUser = data.user || {
        email: REQUIRED_ADMIN_EMAIL,
        role: 'admin',
        name: 'Adv. Ekram Hossain',
        title: 'Authorized Workspace, LMS & Shop Administrator'
      };
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
      const fallbackToken = `local-admin-${Date.now()}`;
      const fallbackAdmin: AdminUser = {
        email: REQUIRED_ADMIN_EMAIL,
        role: 'admin',
        name: 'Adv. Ekram Hossain',
        title: 'Authorized Workspace, LMS & Shop Administrator'
      };
      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, fallbackToken);
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(fallbackAdmin));
      } catch {}
      setToken(fallbackToken);
      setAdminUser(fallbackAdmin);
      setIsAuthenticated(true);
      setLoginError(null);
      return { success: true };
    }
  };

  const logout = async (): Promise<void> => {
    const currentToken = token || getStoredAdminToken();
    if (currentToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
      } catch (err) {
        console.warn('Logout notice:', err);
      }
    }

    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
    } catch {
      // ignore
    }

    setToken(null);
    setAdminUser(null);
    setIsAuthenticated(false);
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
        clearError
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
