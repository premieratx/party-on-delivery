import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  userType?: 'admin' | 'customer' | 'affiliate';
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  userType = 'customer',
  redirectTo
}) => {
  const { user, loading } = useAuthRedirect({ 
    requireAuth, 
    redirectTo, 
    userType 
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect via useAuthRedirect
  }

  return <>{children}</>;
};