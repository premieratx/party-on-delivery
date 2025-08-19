import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const StripeCheckoutVerify: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    publishableKey?: boolean;
    paymentIntent?: boolean;
    checkout?: boolean;
    errors?: string[];
  }>({});

  const runVerification = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    const testResults: any = {};

    try {
      // Test 1: Get Stripe publishable key
      console.log('[VERIFY] Testing Stripe publishable key...');
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-stripe-publishable-key');
      
      if (keyError || !keyData?.key) {
        errors.push(`Publishable key failed: ${keyError?.message || 'No key returned'}`);
        testResults.publishableKey = false;
      } else {
        console.log('[VERIFY] ✅ Publishable key retrieved successfully');
        testResults.publishableKey = true;
      }

      // Test 2: Create payment intent
      console.log('[VERIFY] Testing payment intent creation...');
      const testPayment = {
        amount: 2500, // $25.00 in cents
        currency: 'usd',
        cartItems: [{ id: 'test', title: 'Test Item', price: 20.00, quantity: 1 }],
        customerInfo: { 
          firstName: 'Test', 
          lastName: 'User', 
          email: 'test@example.com', 
          phone: '555-0123' 
        },
        deliveryInfo: { 
          date: '2024-01-15', 
          timeSlot: '2:00 PM - 4:00 PM', 
          address: '123 Test St, Austin, TX 78701' 
        },
        subtotal: 20.00,
        deliveryFee: 3.00,
        salesTax: 2.00,
        tipAmount: 0,
        affiliateCode: 'TEST'
      };
      
      const { data: piData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
        body: testPayment
      });
      
      if (piError || !piData?.client_secret) {
        errors.push(`Payment intent failed: ${piError?.message || 'No client_secret returned'}`);
        testResults.paymentIntent = false;
      } else {
        console.log('[VERIFY] ✅ Payment intent created successfully');
        testResults.paymentIntent = true;
      }

      // Test 3: Create checkout session
      console.log('[VERIFY] Testing checkout session creation...');
      const testCheckout = {
        cartItems: [{ title: 'Test Item', price: 20.00, quantity: 1 }],
        customerInfo: { 
          firstName: 'Test', 
          lastName: 'User', 
          email: 'test@example.com', 
          phone: '555-0123' 
        },
        deliveryInfo: { 
          date: '2024-01-15', 
          timeSlot: '2:00 PM - 4:00 PM' 
        },
        subtotal: 20.00,
        deliveryFee: 3.00,
        salesTax: 2.00,
        tipAmount: 0
      };
      
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: testCheckout
      });
      
      if (checkoutError || !checkoutData?.url) {
        errors.push(`Checkout session failed: ${checkoutError?.message || 'No URL returned'}`);
        testResults.checkout = false;
      } else {
        console.log('[VERIFY] ✅ Checkout session created successfully');
        testResults.checkout = true;
      }

    } catch (error) {
      console.error('[VERIFY] Unexpected error:', error);
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setResults({ ...testResults, errors });
    setIsLoading(false);
  };

  const StatusIcon = ({ success }: { success?: boolean }) => {
    if (success === undefined) return <div className="w-5 h-5" />;
    return success ? 
      <CheckCircle className="w-5 h-5 text-green-600" /> : 
      <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Stripe Integration Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Button 
          onClick={runVerification} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Verify Stripe Integration'
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3">
              <StatusIcon success={results.publishableKey} />
              <span>Stripe Publishable Key</span>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusIcon success={results.paymentIntent} />
              <span>Payment Intent Creation</span>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusIcon success={results.checkout} />
              <span>Checkout Session Creation</span>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800 mb-2">Errors Found:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {results.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.publishableKey && results.paymentIntent && results.checkout && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">✅ All Stripe tests passed!</p>
                <p className="text-sm text-green-600 mt-1">Your checkout system is ready for real payments.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};