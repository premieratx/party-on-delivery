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
            Welcome Back!
          </CardTitle>
          <p className="text-muted-foreground">
            What would you like to do today?
          </p>
          
          {lastOrderInfo && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Last order:</p>
              <p className="font-medium">#{lastOrderInfo.orderNumber}</p>
              <p className="text-sm">${lastOrderInfo.total.toFixed(2)} • {lastOrderInfo.date}</p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={onAddToOrder}
            className="w-full h-14 text-lg"
            variant="default"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add to Previous Order
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">or</div>
          
          <Button 
            onClick={onStartNewOrder}
            className="w-full h-16 text-xl"
            variant="outline"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Start New Order
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Adding to your previous order allows us to bundle deliveries and save you money!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};