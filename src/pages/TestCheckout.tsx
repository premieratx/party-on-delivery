import React, { useState } from 'react';
import { RefactoredCheckoutFlow } from '@/components/checkout/RefactoredCheckoutFlow';
import { CartItem, DeliveryInfo } from '@/components/DeliveryWidget';
import { checkoutTester } from '@/utils/checkoutTestUtil';
import { StripeStatusCheck } from '@/components/StripeStatusCheck';
import { StripeCheckoutTest } from '@/components/StripeCheckoutTest';
import { AdminFunctionalityTest } from '@/components/AdminFunctionalityTest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestCheckout = () => {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });

  const [isTestingCheckout, setIsTestingCheckout] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showTests, setShowTests] = useState(false);

  // Test cart items
  const testCartItems: CartItem[] = [
    {
      id: 'test-product-1',
      title: 'Premium Beer Pack',
      name: 'Premium Beer Pack',
      price: 24.99,
      quantity: 2,
      image: '',
      variant: undefined
    },
    {
      id: 'test-product-2', 
      title: 'Party Snacks Bundle',
      name: 'Party Snacks Bundle',
      price: 15.99,
      quantity: 1,
      image: '',
      variant: undefined
    }
  ];

  const totalPrice = testCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const runCheckoutTests = async () => {
    setIsTestingCheckout(true);
    setTestResults([]);
    
    try {
      const results = await checkoutTester.runFullTest();
      setTestResults(results);
      console.log(checkoutTester.getSummaryReport());
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsTestingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Live Status Check */}
        <div className="mb-6">
          <StripeStatusCheck />
        </div>
        
        {/* Checkout Flow Test */}
        <div className="mb-6">
          <StripeCheckoutTest />
        </div>
        
        {/* Admin Functionality Test */}
        <div className="mb-6">
          <AdminFunctionalityTest />
        </div>
        
        {/* Advanced Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🧪 Checkout Flow Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runCheckoutTests} 
                disabled={isTestingCheckout}
                variant="outline"
              >
                {isTestingCheckout ? 'Running Tests...' : '🚀 Test Stripe/Shopify Integration'}
              </Button>
              
              <Button 
                onClick={() => setShowTests(!showTests)}
                variant="secondary"
              >
                {showTests ? 'Hide Tests' : 'Show Test Results'} ({testResults.length})
              </Button>
            </div>

            {/* Test Results */}
            {showTests && testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Test Results:</h4>
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded border-l-4 ${
                      result.success 
                        ? 'bg-green-50 border-green-400 text-green-800' 
                        : 'bg-red-50 border-red-400 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{result.success ? '✅' : '❌'}</span>
                      <span className="font-medium">{result.component}</span>
                    </div>
                    <p className="text-sm mt-1">{result.message}</p>
                    {result.details && (
                      <pre className="text-xs mt-2 p-2 bg-black/10 rounded">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout Flow */}
        <RefactoredCheckoutFlow
          cartItems={testCartItems}
          deliveryInfo={deliveryInfo}
          totalPrice={totalPrice}
          onBack={() => console.log('Back clicked')}
          onDeliveryInfoChange={setDeliveryInfo}
          onUpdateQuantity={(id, variant, quantity) => {
            console.log('Update quantity:', { id, variant, quantity });
          }}
        />
      </div>
    </div>
  );
};

export default TestCheckout;