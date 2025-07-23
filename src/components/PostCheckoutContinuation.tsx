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
    items?: Array<{
      id: string;
      title: string;
      variant?: string;
      price: number;
      quantity: number;
    }>;
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
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold text-center">
              Enter code <span className="font-bold">PREMIER2025</span> to get free shipping on your next order!
            </p>
          </div>

          {lastOrderInfo && (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-2">Order Successful!</h2>
                <p className="text-muted-foreground">
                  Payment processed • Order #{lastOrderInfo.orderNumber}
                </p>
              </div>
              
              {lastOrderInfo.items && lastOrderInfo.items.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Order Items:</h3>
                  {lastOrderInfo.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.title}</span>
                        {item.variant && (
                          <span className="text-muted-foreground ml-1">• {item.variant}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">×{item.quantity}</span>
                        <span className="ml-2 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total:</span>
                      <span>${lastOrderInfo.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
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