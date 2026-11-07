import React from 'react';

interface LmsRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Allows seamless access to the Student Learning Management System (LMS) Portal.
 * Authentication and Firestore sync are handled non-destructively in LmsContext
 * with localStorage fallback ("lmsData").
 */
export const LmsRouteGuard: React.FC<LmsRouteGuardProps> = ({ children }) => {
  return <>{children}</>;
};

export default LmsRouteGuard;
