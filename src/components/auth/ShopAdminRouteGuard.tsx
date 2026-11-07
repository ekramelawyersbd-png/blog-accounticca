import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useShopAuth } from '../../contexts/ShopAuthContext';
import { ShieldCheck } from 'lucide-react';

interface ShopAdminRouteGuardProps {
  children: React.ReactNode;
}

export function ShopAdminRouteGuard({ children }: ShopAdminRouteGuardProps) {
  const { isAuthenticated, isLoading, adminUser } = useShopAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center mb-4 relative shadow-lg">
          <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping" />
        </div>
        <h3 className="text-base font-black text-white tracking-wide">
          Verifying Administrator Session...
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Admin sign-in (hmekram@gmail.com) is strictly required to enter /workspace.
        </p>
      </div>
    );
  }

  // Strictly require an active authenticated session for ID: hmekram@gmail.com
  const isAuthorizedWorkspaceAdmin =
    isAuthenticated &&
    Boolean(adminUser) &&
    adminUser.email.trim().toLowerCase() === 'hmekram@gmail.com';

  if (!isAuthorizedWorkspaceAdmin) {
    const redirectUrl = `/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
}

export default ShopAdminRouteGuard;

