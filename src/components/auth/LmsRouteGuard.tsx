import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, GraduationCap, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyUserCourseAccess } from '../../services/trainingAdmissionFirestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { useShopAuth } from '../../contexts/ShopAuthContext';

interface LmsRouteGuardProps {
  children: React.ReactNode;
  courseId?: string;
}

/**
 * LmsRouteGuard checks the 'userCourses' Firestore collection (and local cache)
 * to verify if the currently logged-in student has been granted access to the specific course.
 */
export const LmsRouteGuard: React.FC<LmsRouteGuardProps> = ({ children, courseId = 'course-400' }) => {
  const { user } = useAuth();
  const { adminUser } = useShopAuth();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId') || courseId;

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const studentEmail = user?.email || adminUser?.email || 'ekram.elawyersbd@gmail.com';

  const checkAccess = async () => {
    setChecking(true);
    try {
      // Admins always have access
      if (adminUser) {
        setHasAccess(true);
        setChecking(false);
        return;
      }

      const verified = await verifyUserCourseAccess(studentEmail, queryCourseId);
      setHasAccess(verified);
    } catch {
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void checkAccess();
  }, [studentEmail, queryCourseId, adminUser]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-300">Verifying student course enrollment in Firestore ('userCourses')...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Access Restricted · Enrollment Required
            </span>
            <h2 className="text-xl font-black text-white">Course Access Not Approved</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Our records indicate that student <strong className="text-white font-mono">{studentEmail}</strong> has not yet received admin approval for course ID <strong className="text-emerald-400 font-mono">{queryCourseId}</strong>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <GraduationCap className="w-4 h-4" />
              <span>How to get access:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              1. Submit a training admission application in the Training Hub.<br />
              2. Wait for academy admin review &amp; approval.<br />
              3. Upon approval, access is automatically granted in Firestore <code className="text-slate-200">userCourses</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={checkAccess}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-check Access</span>
            </button>
            <Link
              to="/training"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition shadow-lg"
            >
              <span>Explore Training Hub</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LmsRouteGuard;
