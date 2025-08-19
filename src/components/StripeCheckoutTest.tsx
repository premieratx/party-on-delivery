import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StripeCheckoutTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const navigate = useNavigate();

  const testCheckoutFlow = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('[CHECKOUT-TEST] Testing full checkout flow...');
      
      // Test 1: Create payment intent
      const testPaymentData = {
        cartItems: [
          {
            id: 'test-product-1',
            title: 'Test Beer Pack',
            price: 24.99,
            quantity: 1,
            image: '',
            variant: undefined
          }
        ],
        amount: 2749, // $27.49 in cents
        currency: 'usd',
        subtotal: 24.99,
        deliveryFee: 2.50,
        salesTax: 0,
        tipAmount: 0,
        customerInfo: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@checkout.com',
          phone: '555-1234'
        },
        deliveryInfo: {
          date: '2024-01-15',
          timeSlot: '2:00 PM - 4:00 PM',
          address: '123 Test St, Austin, TX 78701',
          instructions: 'Test checkout instructions'
        }
      };

      console.log('[CHECKOUT-TEST] Testing payment intent creation...');
      const { data: piData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
        body: testPaymentData
      });
      
      if (piError) {
        throw new Error(`Payment intent failed: ${piError.message}`);
      }
      
      if (!piData?.client_secret) {
        throw new Error('No client_secret returned from payment intent');
      }
      
      console.log('[CHECKOUT-TEST] ✅ Payment intent created successfully');
      
      // Test 2: Test checkout session creation  
      console.log('[CHECKOUT-TEST] Testing checkout session creation...');
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout', {
        body: testPaymentData
      });
      
      if (sessionError) {
        throw new Error(`Checkout session failed: ${sessionError.message}`);
      }
      
      if (!sessionData?.url) {
        throw new Error('No checkout URL returned from session');
      }
      
      console.log('[CHECKOUT-TEST] ✅ Checkout session created successfully');
      
      setResults({
        success: true,
        paymentIntent: {
          hasClientSecret: !!piData.client_secret,
          clientSecretPrefix: piData.client_secret.substring(0, 15) + '...'
        },
        checkoutSession: {
          hasUrl: !!sessionData.url,
          urlPrefix: sessionData.url.substring(0, 40) + '...'
        }
      });
      
    } catch (error) {
      console.error('[CHECKOUT-TEST] ❌ Checkout test failed:', error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const testLiveCheckout = () => {
    // Navigate to actual checkout page for live testing
    navigate('/test-checkout');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Checkout Flow Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={testCheckoutFlow} 
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Testing...' : '🧪 Test API Endpoints'}
          </Button>
          
          <Button 
            onClick={testLiveCheckout}
            variant="default"
          >
            🚀 Test Live Checkout
          </Button>
        </div>

        {results && (
          <div className={`p-4 rounded-lg ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className={`font-medium mb-2 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
              {results.success ? '✅ Checkout Flow Working' : '❌ Checkout Flow Issues'}
            </h4>
            
            {results.success && (
              <div className="space-y-2 text-sm text-green-700">
                <div>✅ Payment Intent: {results.paymentIntent.clientSecretPrefix}</div>
                <div>✅ Checkout Session: {results.checkoutSession.urlPrefix}</div>
                <div className="mt-2 font-medium">Ready for live payments!</div>
              </div>
            )}
            
            {results.error && (
              <div className="text-sm text-red-700">
                <strong>Error:</strong> {results.error}
              </div>
            )}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
          <strong>API Test:</strong> Validates payment intent and checkout session creation<br/>
          <strong>Live Test:</strong> Opens the actual checkout page with test products
        </div>
      </CardContent>
    </Card>
  );
};