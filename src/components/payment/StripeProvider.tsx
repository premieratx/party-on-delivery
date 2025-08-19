import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (error || !data?.key) {
          if (mounted) setInitialized(true);
          return;
        }
        
        const stripe = await loadStripe(data.key);
        if (mounted && stripe) {
          setStripePromise(Promise.resolve(stripe));
        }
      } catch (e) {
        // Silently fail for missing Stripe configuration
      } finally {
        if (mounted) setInitialized(true);
      }
    };

    initStripe();
    return () => { mounted = false; };
  }, []);

  // Always render children, with or without Stripe
  if (!initialized) return <>{children}</>;
  
  if (!stripePromise) return <>{children}</>;

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};