import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { PaymentStep } from './PaymentStep';
import { PaymentStepFallback } from './PaymentStepFallback';
import { useAppConfig } from '@/hooks/useAppConfig';
import { Button } from '@/components/ui/button';

interface StripePaymentWrapperProps {
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  customerInfo: any;
  deliveryInfo: any;
  appliedDiscount?: any;
  onPaymentSuccess: (paymentIntentId?: string) => void;
  isAddingToOrder?: boolean;
  affiliateCode?: string;
}

export const StripePaymentWrapper: React.FC<StripePaymentWrapperProps> = (props) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { config } = useAppConfig();

  const total = props.subtotal + props.deliveryFee + props.salesTax;

  useEffect(() => {
    let mounted = true;
    
    // If Stripe is disabled, don't try to initialize it
    if (!config.stripePaymentsEnabled) {
      setIsLoading(false);
      setHasError(true);
      return;
    }
    
    const initStripe = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        if (error || !data?.key) {
          console.log('Stripe not configured, running without payment processing');
          if (mounted) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }
        
        const stripe = loadStripe(data.key);
        if (mounted) {
          setStripePromise(stripe);
          setIsLoading(false);
        }
      } catch (e) {
        console.log('Stripe initialization failed:', e);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    initStripe();
    return () => { mounted = false; };
  }, [config.stripePaymentsEnabled]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Loading payment system...
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (hasError || !stripePromise) {
    return <PaymentStepFallback total={total} onPaymentSuccess={props.onPaymentSuccess} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentStep {...props} />
    </Elements>
  );
};