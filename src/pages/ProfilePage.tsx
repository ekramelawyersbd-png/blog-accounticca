import React from 'react';
import { UserProfile } from '../components/profile/UserProfile';
import { ServiceSEO } from '../components/SEO';
import { ShieldCheck, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <ServiceSEO
        title="Account Profile, Preferences & Consultations | Compliance Hub"
        description="View your verified account details, track booked legal and tax consultations, manage statutory notifications, and update corporate credentials."
        serviceType="User Profile Management"
        canonicalUrl="/profile"
      />

      <ContactPageShell
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Account Profile & Preferences' }
        ]}
        eyebrow="Member Settings"
        headline="Account Profile &"
        accentHeadline="Preferences"
        description="View your verified account details, track booked legal and tax consultations, manage statutory notifications, and update credentials."
        metaItems={[
          user?.displayName || user?.email || 'Verified Member',
          'Consultation History',
          'Notification Controls'
        ]}
        summaryCard={{
          eyebrow: 'Member Account',
          title: user?.displayName || 'Compliance Profile',
          description: user?.email || 'Manage preferences, saved resources, and advisory bookings.',
          icon: <User className="w-5 h-5" />,
          actions: [
            { label: 'Client Portal', to: '/client-portal', variant: 'emerald' },
            { label: 'Compliance Dashboard', to: '/dashboard', icon: <ArrowLeft className="w-4 h-4" />, variant: 'neutral' }
          ],
          footerIcon: <ShieldCheck className="w-4 h-4 text-emerald-700" />,
          footerText: 'Encrypted Profile Preferences'
        }}
      >
        <div className="max-w-5xl mx-auto">
          <UserProfile />
        </div>
      </ContactPageShell>
    </>
  );
};
