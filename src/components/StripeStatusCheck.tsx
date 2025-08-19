import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppConfig } from '@/hooks/useAppConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StripeStatus {
  configEnabled: boolean;
  publishableKeyAvailable: boolean;
  paymentIntentWorks: boolean;
  error?: string;
}

export const StripeStatusCheck: React.FC = () => {
  const { config } = useAppConfig();
  const [status, setStatus] = useState<StripeStatus>({
    configEnabled: false,
    publishableKeyAvailable: false,
    paymentIntentWorks: false
  });
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState<Date | null>(null);

  const runStripeTest = async () => {
    setTesting(true);
    try {
      // Test 1: Check config
      const configEnabled = config.stripePaymentsEnabled;
      
      // Test 2: Test publishable key
      console.log('[STRIPE-TEST] Testing publishable key...');
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-stripe-publishable-key');
      const publishableKeyAvailable = !keyError && keyData?.key;
      
      if (keyError) {
        console.log('[STRIPE-TEST] Key error:', keyError);
      } else {
        console.log('[STRIPE-TEST] Key result:', { hasKey: !!keyData?.key, keyPrefix: keyData?.key?.substring(0, 8) });
      }

      // Test 3: Test payment intent creation
      console.log('[STRIPE-TEST] Testing payment intent...');
      const testPayment = {
        cartItems: [{ id: 'test', title: 'Test Item', price: 10.00, quantity: 1 }],
        amount: 1250, // $12.50
        currency: 'usd',
        subtotal: 10.00,
        deliveryFee: 2.50,
        salesTax: 0,
        tipAmount: 0,
        customerInfo: { firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '555-0123' },
        deliveryInfo: { date: '2024-01-15', timeSlot: '2:00 PM - 4:00 PM', address: '123 Test St', instructions: '' }
      };
      
      const { data: piData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
        body: testPayment
      });
      
      const paymentIntentWorks = !piError && piData?.client_secret;
      
      if (piError) {
        console.log('[STRIPE-TEST] Payment intent error:', piError);
      } else {
        console.log('[STRIPE-TEST] Payment intent result:', { hasClientSecret: !!piData?.client_secret });
      }

      setStatus({
        configEnabled,
        publishableKeyAvailable,
        paymentIntentWorks,
        error: keyError?.message || piError?.message
      });
      
      setLastTest(new Date());
    } catch (error) {
      console.error('[STRIPE-TEST] Test failed:', error);
      setStatus({
        configEnabled: config.stripePaymentsEnabled,
        publishableKeyAvailable: false,
        paymentIntentWorks: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runStripeTest();
  }, [config.stripePaymentsEnabled]);

  const overallStatus = status.configEnabled && status.publishableKeyAvailable && status.paymentIntentWorks;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {overallStatus ? '✅' : '❌'} Stripe Integration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className={`flex items-center gap-2 p-2 rounded ${status.configEnabled ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <span>{status.configEnabled ? '✅' : '❌'}</span>
            <span>App Config: Stripe Enabled</span>
          </div>
          
          <div className={`flex items-center gap-2 p-2 rounded ${status.publishableKeyAvailable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <span>{status.publishableKeyAvailable ? '✅' : '❌'}</span>
            <span>Publishable Key: Available</span>
          </div>
          
          <div className={`flex items-center gap-2 p-2 rounded ${status.paymentIntentWorks ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <span>{status.paymentIntentWorks ? '✅' : '❌'}</span>
            <span>Payment Intent: Working</span>
          </div>
        </div>

        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            <strong>Error:</strong> {status.error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button 
            onClick={runStripeTest} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? 'Testing...' : 'Re-test Integration'}
          </Button>
          
          {lastTest && (
            <span className="text-sm text-muted-foreground">
              Last tested: {lastTest.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className={`p-4 rounded-lg ${overallStatus ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`font-medium ${overallStatus ? 'text-green-800' : 'text-yellow-800'}`}>
            {overallStatus 
              ? '🎉 Stripe is LIVE and ready for payments!' 
              : '⚠️ Stripe integration needs attention'
            }
          </p>
          {overallStatus && (
            <p className="text-sm text-green-700 mt-1">
              Real payment processing is active. Test cards will work in development.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};