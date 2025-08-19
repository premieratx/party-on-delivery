import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const StripeTestComponent: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runStripeTest = async () => {
    setTesting(true);
    setResults([]);
    const testResults: any[] = [];

    // Test 1: Check Stripe publishable key
    try {
      console.log('🔍 Testing Stripe publishable key...');
      const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
      
      if (error) {
        testResults.push({
          test: 'Get Stripe Publishable Key',
          status: 'failed',
          message: error.message || 'Function call failed',
          details: error
        });
      } else if (data?.key) {
        testResults.push({
          test: 'Get Stripe Publishable Key',
          status: 'passed',
          message: `Key retrieved (length: ${data.key.length})`,
          details: { keyPrefix: data.key.substring(0, 8) + '...' }
        });
      } else {
        testResults.push({
          test: 'Get Stripe Publishable Key',
          status: 'failed',
          message: 'No key returned from function',
          details: data
        });
      }
    } catch (err: any) {
      testResults.push({
        test: 'Get Stripe Publishable Key',
        status: 'failed',
        message: err.message || 'Exception occurred',
        details: err
      });
    }

    // Test 2: Check Stripe integration
    try {
      console.log('🔍 Testing Stripe loadStripe...');
      const { loadStripe } = await import('@stripe/stripe-js');
      
      if (testResults[0]?.status === 'passed') {
        const stripe = await loadStripe(testResults[0].details.keyPrefix.replace('...', 'pk_test_demo'));
        testResults.push({
          test: 'Stripe Library Load',
          status: stripe ? 'passed' : 'failed',
          message: stripe ? 'Stripe library loaded successfully' : 'Failed to load Stripe library',
          details: { hasStripe: !!stripe }
        });
      } else {
        testResults.push({
          test: 'Stripe Library Load',
          status: 'skipped',
          message: 'Skipped due to key retrieval failure',
          details: null
        });
      }
    } catch (err: any) {
      testResults.push({
        test: 'Stripe Library Load',
        status: 'failed',
        message: err.message || 'Exception occurred',
        details: err
      });
    }

    // Test 3: Mock payment intent creation
    try {
      console.log('🔍 Testing payment intent creation (mock data)...');
      const mockPaymentData = {
        amount: 5000, // $50.00
        currency: 'usd',
        cartItems: [{ id: 'test', title: 'Test Item', price: 25, quantity: 2 }],
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '555-123-4567'
        },
        deliveryInfo: {
          address: 'Test Address',
          date: new Date().toISOString(),
          timeSlot: '10:00 AM - 11:00 AM'
        },
        subtotal: 50,
        deliveryFee: 0,
        salesTax: 0,
        tipAmount: 0
      };

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: mockPaymentData
      });

      if (error) {
        testResults.push({
          test: 'Create Payment Intent',
          status: 'failed',
          message: error.message || 'Function call failed',
          details: error
        });
      } else if (data?.client_secret) {
        testResults.push({
          test: 'Create Payment Intent',
          status: 'passed',
          message: 'Payment intent created successfully',
          details: { hasClientSecret: !!data.client_secret, paymentIntentId: data.payment_intent_id }
        });
      } else {
        testResults.push({
          test: 'Create Payment Intent',
          status: 'failed',
          message: 'No client secret returned',
          details: data
        });
      }
    } catch (err: any) {
      testResults.push({
        test: 'Create Payment Intent',
        status: 'failed',
        message: err.message || 'Exception occurred',
        details: err
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Stripe Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runStripeTest} 
          disabled={testing}
          className="w-full"
        >
          {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {testing ? 'Running Tests...' : 'Test Stripe Integration'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.test}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.status === 'passed' ? 'bg-green-100 text-green-700' :
                    result.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">Details</summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};