import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DiscountCodeInput } from './checkout/DiscountCodeInput';

export const TestDiscountCodes: React.FC = () => {
  const [subtotal, setSubtotal] = useState(50.00);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  } | null>(null);
  const [isTestingSync, setIsTestingSync] = useState(false);

  const testShopifySync = async () => {
    setIsTestingSync(true);
    try {
      console.log('🧪 Testing Shopify discount sync...');
      
      const { data, error } = await supabase.functions.invoke('fetch-shopify-discounts', {
        body: {
          activeOnly: true,
          includeExpired: false
        }
      });

      if (error) {
        console.error('❌ Sync test failed:', error);
        toast.error('Failed to sync discount codes');
        return;
      }

      console.log('✅ Sync test result:', data);
      
      if (data.success) {
        toast.success(`🎉 Sync successful!`, {
          description: `Found ${data.total_codes} codes, ${data.recomsale_codes} RecomSale codes`
        });
      }
    } catch (error) {
      console.error('❌ Unexpected sync error:', error);
      toast.error('Sync test failed');
    } finally {
      setIsTestingSync(false);
    }
  };

  const handleDiscountApplied = (discount: {
    code: string;
    amount: number;
    type: 'fixed_amount' | 'percentage';
    value: string;
  }) => {
    setAppliedDiscount(discount);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(null);
  };

  const finalTotal = subtotal - (appliedDiscount?.amount || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🎫 Test Shopify Discount Codes Integration</CardTitle>
          <CardDescription>
            Test the RecomSale discount codes integration with your Shopify store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Test */}
          <div>
            <h3 className="text-lg font-medium mb-2">1. Test Shopify Sync</h3>
            <p className="text-sm text-muted-foreground mb-3">
              This will fetch all discount codes from your Shopify store and identify RecomSale codes.
            </p>
            <Button 
              onClick={testShopifySync}
              disabled={isTestingSync}
              className="w-full"
            >
              {isTestingSync ? '🔄 Syncing...' : '📡 Test Shopify Discount Sync'}
            </Button>
          </div>

          {/* Discount Code Testing */}
          <div>
            <h3 className="text-lg font-medium mb-2">2. Test Discount Code Application</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Try applying a discount code to see how it works in your checkout.
            </p>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Mock Cart Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedDiscount.code}):</span>
                    <span>-${appliedDiscount.amount.toFixed(2)}</span>
                  </div>
                )}
                
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Code Input */}
              <DiscountCodeInput
                subtotal={subtotal}
                onDiscountApplied={handleDiscountApplied}
                onDiscountRemoved={handleDiscountRemoved}
                appliedDiscount={appliedDiscount}
              />
            </div>
          </div>

          {/* Test Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Testing Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>First, run the Shopify sync to fetch your discount codes</li>
              <li>Try entering any discount code from your Shopify store</li>
              <li>RecomSale codes will be automatically identified</li>
              <li>The system validates code expiry, usage limits, and minimum order amounts</li>
              <li>Check the console logs for detailed information</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};