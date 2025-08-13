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
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (error) throw error;
        const key = data?.key as string | undefined;
        if (key && mounted) {
          setStripePromise(loadStripe(key));
        }
      } catch (e) {
        console.error('Failed to load Stripe publishable key:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};