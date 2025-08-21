import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { PaymentStep } from './PaymentStep';
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
  tipAmount?: number;
  onTipChange?: (amount: number) => void;
}

export const StripePaymentWrapper: React.FC<StripePaymentWrapperProps> = (props) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { config } = useAppConfig();

  const total = props.subtotal + props.deliveryFee + props.salesTax + (props.tipAmount || 0);

  useEffect(() => {
    let mounted = true;
    
    // Clean lovable token from URL if present to prevent interference
    const url = new URL(window.location.href);
    if (url.searchParams.has('__lovable_token')) {
      url.searchParams.delete('__lovable_token');
      window.history.replaceState({}, document.title, url.toString());
    }
    
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
        
        console.log('[STRIPE-WRAPPER] Attempting to get publishable key...');
        console.log('[STRIPE-WRAPPER] Supabase client ready, invoking function...');
        
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        console.log('[STRIPE-WRAPPER] Response received:', { 
          hasData: !!data, 
          hasError: !!error, 
          data: data ? { hasKey: !!data.key, keyLength: data.key?.length } : null,
          error 
        });
        
        // Additional debug logging
        if (error) {
          console.error('[STRIPE-WRAPPER] Function invocation error:', error);
        }
        if (data?.key) {
          console.log('[STRIPE-WRAPPER] Key received successfully, initializing Stripe...');
        }
        
        if (error || !data?.key) {
          console.log('[STRIPE-WRAPPER] Stripe not configured, running without payment processing:', { error, data });
          if (mounted) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }
        
        console.log('[STRIPE-WRAPPER] Got publishable key, initializing Stripe...', { keyPrefix: data.key.substring(0, 8) });
        const stripe = loadStripe(data.key);
        if (mounted) {
          setStripePromise(stripe);
          setIsLoading(false);
          console.log('[STRIPE-WRAPPER] Stripe successfully initialized');
        }
      } catch (e) {
        console.log('[STRIPE-WRAPPER] Stripe initialization failed:', e);
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

  // NEVER show fallback - force Stripe to work or show error
  if (hasError) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Stripe Payment System Error</p>
          <p className="text-xs text-red-500 mt-1">
            The payment system failed to initialize. Please refresh the page or contact support.
          </p>
          <Button 
            onClick={() => {
              // Force re-initialization instead of page reload
              setIsLoading(true);
              setHasError(false);
            }}
            size="sm"
            variant="destructive"
            className="mt-2"
          >
            Retry Payment System
          </Button>
        </div>
    );
  }
  
  if (!stripePromise) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-600">Loading Stripe payment system...</p>
        <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentStep {...props} />
    </Elements>
  );
};