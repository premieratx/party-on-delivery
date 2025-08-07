import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface CheckoutKeepShoppingProps {
  onBackToProducts: () => void;
  appName?: string;
}

export const CheckoutKeepShopping: React.FC<CheckoutKeepShoppingProps> = ({
  onBackToProducts,
  appName = "the store"
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Your cart is empty</CardTitle>
          <p className="text-muted-foreground">
            Add some items from {appName} to continue with checkout
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onBackToProducts}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};