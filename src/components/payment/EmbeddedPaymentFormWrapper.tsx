import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { EmbeddedPaymentForm } from './EmbeddedPaymentForm';
import { useAppConfig } from '@/hooks/useAppConfig';

interface EmbeddedPaymentFormWrapperProps {
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  customerInfo: any;
  deliveryInfo: any;
  appliedDiscount: any;
  onPaymentSuccess: (paymentIntentId?: string) => void;
  tipAmount?: number;
  setTipAmount?: (tip: number, type?: 'percentage' | 'custom', percentage?: number) => void;
  tipType?: 'percentage' | 'custom';
  tipPercentage?: number;
  deliveryPricing?: {
    fee: number;
    minimumOrder: number;
    isDistanceBased: boolean;
    distance?: number;
  };
  isAddingToOrder?: boolean;
  useSameAddress?: boolean;
  hasChanges?: boolean;
  discountCode?: string;
  setDiscountCode?: (code: string) => void;
  handleApplyDiscount?: () => void;
  handleRemoveDiscount?: () => void;
}

export const EmbeddedPaymentFormWrapper: React.FC<EmbeddedPaymentFormWrapperProps> = (props) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { config } = useAppConfig();

  const total = props.subtotal + props.deliveryFee + props.salesTax + (props.tipAmount || 0);

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
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 font-medium">Stripe Payment System Error</p>
        <p className="text-xs text-red-500 mt-1">
          The payment system failed to initialize. Please refresh the page or contact support.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <EmbeddedPaymentForm {...props} />
    </Elements>
  );
};