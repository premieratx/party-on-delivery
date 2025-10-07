import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (redirectTo?: string, userType?: 'admin' | 'customer' | 'affiliate') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { linkSessionToUser } = useSessionTracking();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle session linking after state update
        if (session?.user?.email && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            linkSessionToUser(session.user.email);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // Remove linkSessionToUser dependency to stop infinite loop

  const signInWithGoogle = async (redirectTo?: string, userType: 'admin' | 'customer' | 'affiliate' = 'customer') => {
    const baseUrl = window.location.origin;
    
    // Admin login should only use email/password via edge function
    if (userType === 'admin') {
      return { error: new Error('Admin login requires email and password authentication') };
    }
    
    const redirectUrls = {
      customer: redirectTo ? `${baseUrl}/customer/auth?redirect=${redirectTo}` : `${baseUrl}/customer/login?redirect=dashboard`,
      affiliate: `${baseUrl}/affiliate/intro`
    };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrls[userType as 'customer' | 'affiliate'],
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account consent',
        },
        skipBrowserRedirect: false,
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = () => {
    // This would be enhanced with actual admin check logic
    return false; // Placeholder - implement admin verification
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};