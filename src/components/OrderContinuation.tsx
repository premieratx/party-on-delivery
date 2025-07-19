import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, RotateCcw } from 'lucide-react';

interface OrderContinuationProps {
  onStartNewOrder: () => void;
  onAddToOrder: () => void;
  lastOrderInfo?: {
    orderNumber: string;
    total: number;
    date: string;
    address?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    instructions?: string;
  };
}

export const OrderContinuation: React.FC<OrderContinuationProps> = ({
  onStartNewOrder,
  onAddToOrder,
  lastOrderInfo
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-floating animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            {lastOrderInfo ? "Welcome Back!" : "Welcome to Party On Delivery"}
          </CardTitle>
          <p className="text-muted-foreground">
            {lastOrderInfo ? "What would you like to do today?" : "Let's Get This Party Started"}
          </p>
          
          {lastOrderInfo && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Address:</p>
                <p className="font-medium">{lastOrderInfo.address || 'Address not saved'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date & Time:</p>
                <p className="font-medium">
                  {lastOrderInfo.deliveryDate && lastOrderInfo.deliveryTime 
                    ? `${new Date(lastOrderInfo.deliveryDate).toLocaleDateString()} at ${lastOrderInfo.deliveryTime}`
                    : 'Date/time not saved'
                  }
                </p>
              </div>
              <div className="pt-1 border-t border-muted-foreground/20">
                <p className="text-xs text-muted-foreground">
                  Order #{lastOrderInfo.orderNumber} • ${lastOrderInfo.total.toFixed(2)} • {lastOrderInfo.date}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={onStartNewOrder}
            className="w-full h-16 text-xl"
            variant="default"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Start New Order
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">or</div>
          
          <Button 
            onClick={onAddToOrder}
            className="w-full h-12 text-base"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Previous Order
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Adding to your previous order allows us to bundle deliveries and save you money!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};