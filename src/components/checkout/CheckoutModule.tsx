import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, CreditCard, Package } from 'lucide-react';

interface CheckoutModuleProps {
  cartItems?: any[];
  onCheckoutComplete?: (orderData: any) => void;
  affiliateCode?: string;
  deliveryAppId?: string;
}

export const CheckoutModule: React.FC<CheckoutModuleProps> = ({
  cartItems = [],
  onCheckoutComplete,
  affiliateCode,
  deliveryAppId
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('cart');
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const orderData = {
        orderId: `ORD-${Date.now()}`,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        affiliateCode,
        deliveryAppId,
        timestamp: new Date().toISOString()
      };

      onCheckoutComplete?.(orderData);
      toast({ title: 'Success', description: 'Order completed successfully!' });
      setCurrentStep('complete');
    } catch (error) {
      toast({ title: 'Error', description: 'Checkout failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Checkout Module
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Independent checkout flow that works with any delivery app
          </p>
        </CardHeader>
        <CardContent>
          {currentStep === 'cart' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {cartItems.length === 0 ? (
                  <p className="text-muted-foreground">No items in cart</p>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span>{item.name} x {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              
              {cartItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  
                  {affiliateCode && (
                    <Badge variant="secondary">Affiliate: {affiliateCode}</Badge>
                  )}
                  
                  <Button 
                    onClick={handleCheckout} 
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Complete Checkout'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-4">
              <Package className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Order Complete!</h3>
              <p className="text-muted-foreground">Thank you for your order.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};