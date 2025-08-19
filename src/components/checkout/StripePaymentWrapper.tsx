import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { PaymentStep } from './PaymentStep';
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

  useEffect(() => {
    let mounted = true;
    
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
  }, []);

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
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Payment system is not available. Please refresh the page and try again.
          </p>
        </div>
        <Button 
          type="button"
          onClick={() => window.location.reload()}
          className="w-full h-12 text-lg font-semibold"
          variant="outline"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentStep {...props} />
    </Elements>
  );
};