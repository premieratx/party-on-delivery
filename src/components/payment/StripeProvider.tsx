import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (error || !data?.key) {
          console.log('Stripe not configured, running without payment processing');
          return;
        }
        
        const stripe = await loadStripe(data.key);
        if (mounted && stripe) {
          setStripePromise(Promise.resolve(stripe));
        }
      } catch (e) {
        console.log('Stripe initialization failed, running without payment processing');
      }
    };

    initStripe();
    return () => { mounted = false; };
  }, []);

  // Only wrap in Elements provider when Stripe is properly initialized
  // This prevents "Elements context not found" errors when Stripe is unavailable
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    );
  }

  // Render children directly when Stripe is not available
  return <>{children}</>;
};