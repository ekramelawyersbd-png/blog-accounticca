import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { recordToolSigning } from '../../services/toolSigningService';
import { ShieldCheck, LogIn, Sparkles, CheckCircle2, Lock, ArrowRight, BookOpen, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CalculationEmailModal } from '../tools/CalculationEmailModal';
import { CalculationEmailActionBarButton } from '../tools/CalculationEmailActionBarButton';

import { ShopProduct } from '../../data/shopProducts';

export interface ToolAccessGuardProps {
  toolId?: string;
  toolName?: string;
  toolCategory?: string;
  toolPath?: string;
  product?: ShopProduct;
  toolTitle?: string;
  redirectUnauthorized?: boolean;
  children: React.ReactNode;
}

export const ToolAccessGuard: React.FC<ToolAccessGuardProps> = ({
  toolId,
  toolName,
  toolCategory,
  toolPath,
  product,
  toolTitle,
  children,
}) => {
  const { user, loading, signInWithGoogle, signInDemoUser } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [signedRecordId, setSignedRecordId] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const guardContentRef = useRef<HTMLDivElement | null>(null);

  const resolvedId = toolId || product?.id || product?.slug || 'tool';
  const resolvedName = toolName || toolTitle || product?.title || 'Compliance Tool';
  const resolvedCategory = toolCategory || product?.category || 'General';
  const resolvedPath = toolPath || (typeof window !== 'undefined' ? window.location.pathname : '/tools');

  // Auto record signing session whenever signed-in user views this tool
  useEffect(() => {
    if (user) {
      recordToolSigning(resolvedId, resolvedName, resolvedCategory, resolvedPath, user).then(rec => {
        if (rec) setSignedRecordId(rec.id);
      });
    }
  }, [user, resolvedId, resolvedName, resolvedCategory, resolvedPath]);

  const handleSignIn = async () => {
    setLoggingIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoggingIn(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoggingIn(true);
    try {
      await signInDemoUser('ekram.elawyersbd@gmail.com');
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-medium">Verifying member signing authorization...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated: 100% FREE UNRESTRICTED ACCESS
  if (user) {
    return (
      <div className="space-y-3">
        {/* Universal Email Calculation Report Bar for standalone tools */}
        {!product && (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-3">
            <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong className="font-bold text-white">Calculation Email Report Ready:</strong> Send this{' '}
                  <strong className="text-cyan-300">{resolvedName}</strong> statement to{' '}
                  <span className="font-mono text-emerald-300">{user.email}</span> (+ optional CC).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalculationEmailActionBarButton
                  options={{
                    toolId: resolvedId,
                    toolName: resolvedName,
                    toolCategory: resolvedCategory,
                    toolPath: resolvedPath,
                    containerRef: guardContentRef,
                  }}
                  label="Send Calculation Report"
                  variant="primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Render the full tool */}
        <div ref={guardContentRef}>
          {children}
        </div>

        <CalculationEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          toolId={resolvedId}
          toolName={resolvedName}
          toolCategory={resolvedCategory}
          toolPath={resolvedPath}
          userEmail={user.email}
          userName={user.displayName}
          containerRef={guardContentRef}
        />
      </div>
    );
  }

  // If unauthenticated: Show clean sign-in prompt (No shop payment paywall!)
  return (
    <div className="max-w-2xl mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-center p-8 sm:p-10">
      <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-blue-100">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
        <ShieldCheck className="w-3.5 h-3.5" />
        100% Free Bangladesh Compliance Tool
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
        Sign in to Access {resolvedName} Freely
      </h2>

      <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 max-w-lg mx-auto">
        All tools on eLawyers BD are completely <strong>free to use</strong> for registered and signed members. 
        No shop purchase, subscription, or credit card required. Simply sign in with your Google or verified email.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs sm:text-sm text-slate-700 mb-6 space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span><strong>Zero Shop Restrictions:</strong> Full feature access without shop checkout or tokens.</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span><strong>Workspace Session Log:</strong> Your signing activity is recorded to your <Link to="/workspace" className="text-blue-600 underline font-medium">/workspace</Link> ledger for easy tracking.</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span><strong>Authoritative BD Law Compliance:</strong> Income Tax Act 2023, Finance Act 2024-25, VAT Act 2012.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleSignIn}
          disabled={loggingIn}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
        >
          <LogIn className="w-4 h-4" />
          {loggingIn ? 'Signing In...' : 'Sign In with Google (Free)'}
        </button>

        <button
          onClick={handleDemoSignIn}
          disabled={loggingIn}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-200 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          1-Click Instant Member Access
        </button>
      </div>

      <p className="text-xs text-slate-600 mt-4">
        Protected under eLawyers BD Privacy Policy. Signing entries are safely viewable in the{' '}
        <Link to="/workspace?tab=tool-signings" className="text-blue-700 hover:underline font-medium">
          Workspace Audit Tab
        </Link>.
      </p>
    </div>
  );
};

export default ToolAccessGuard;
