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
    const initStripe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        if (error || !data?.key) {
          console.log('Stripe not configured, running without payment processing');
          return;
        }
        
        const stripe = loadStripe(data.key);
        setStripePromise(stripe);
      } catch (e) {
        console.log('Stripe initialization failed:', e);
      }
    };

    initStripe();
  }, []);

  if (!stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};