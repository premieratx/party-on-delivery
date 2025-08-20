import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  userType?: 'admin' | 'customer' | 'affiliate';
}

export const useAuthRedirect = ({
  requireAuth = false,
  redirectTo = '/',
  userType = 'customer'
}: UseAuthRedirectOptions = {}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      // Redirect to appropriate login page
      const loginPaths = {
        admin: '/affiliate/admin-login',
        customer: '/customer/login',
        affiliate: '/affiliate/signup'
      };
      navigate(loginPaths[userType], { replace: true });
    } else if (!requireAuth && user) {
      // User is logged in but on login page, redirect them
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      navigate(redirect || redirectTo, { replace: true });
    }
  }, [user, loading, requireAuth, redirectTo, userType, navigate, location]);

  return { user, loading };
};