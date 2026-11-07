import React from 'react';
import { UserProfile } from '../components/profile/UserProfile';
import { ServiceSEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <ServiceSEO
        title="Account Profile, Preferences & Consultations | Compliance Hub"
        description="View your verified account details, track booked legal and tax consultations, manage statutory notifications, and update corporate credentials."
        serviceType="User Profile Management"
        canonicalUrl="/profile"
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb Header */}
        <nav aria-label="Breadcrumb" className="hidden flex items-center text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-300 shrink-0" />
          <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-semibold">Account Profile &amp; Preferences</span>
        </nav>

        {/* User Profile Component */}
        <UserProfile />
      </div>
    </div>
  );
};
