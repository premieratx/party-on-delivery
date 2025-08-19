import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeInitialized, setStripeInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (error || !data?.key) {
          console.log('Stripe not configured, running without payment processing');
          if (mounted) {
            setStripeInitialized(true); // Mark as initialized even if Stripe is unavailable
          }
          return;
        }
        
        const stripePromise = loadStripe(data.key);
        if (mounted) {
          setStripePromise(stripePromise);
          setStripeInitialized(true);
        }
      } catch (e) {
        console.log('Stripe initialization failed, running without payment processing');
        if (mounted) {
          setStripeInitialized(true); // Mark as initialized even on failure
        }
      }
    };

    initStripe();
    return () => { mounted = false; };
  }, []);

  // Don't render Elements until Stripe initialization has completed (whether successful or not)
  if (!stripeInitialized) {
    return <>{children}</>;
  }

  // Only wrap in Elements provider after initialization
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};