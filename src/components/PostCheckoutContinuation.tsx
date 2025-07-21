import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, ArrowRight } from 'lucide-react';

interface PostCheckoutContinuationProps {
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

export const PostCheckoutContinuation: React.FC<PostCheckoutContinuationProps> = ({
  onStartNewOrder,
  onAddToOrder,
  lastOrderInfo
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-floating animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sure You Got Everything You Need?
          </CardTitle>
          <p className="text-muted-foreground text-lg mt-2">
            Add to Order - Save on Delivery Fee!
          </p>
          
          {lastOrderInfo && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Address:</p>
                <p className="font-medium">{lastOrderInfo.address || 'Address not saved'}</p>
                {lastOrderInfo.instructions && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Instructions: {lastOrderInfo.instructions}
                  </p>
                )}
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
                  Order #{lastOrderInfo.orderNumber} • ${(lastOrderInfo.total || 0).toFixed(2)} • {lastOrderInfo.date}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={onAddToOrder}
            className="w-full h-16 text-xl"
            variant="default"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add to Order
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">or</div>
          
          <Button 
            onClick={onStartNewOrder}
            className="w-full h-12 text-base"
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start New Order
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Adding to your recent order allows us to bundle deliveries and save you money!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};