import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, ArrowRight } from 'lucide-react';
import logoImage from '@/assets/party-on-delivery-logo.png';

interface OrderContinuationProps {
  onStartNewOrder: () => void;
  onAddToRecentOrder: () => void;
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
  onAddToRecentOrder,
  lastOrderInfo
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-floating animate-fade-in">
        <CardHeader className="text-center">
          {/* Single welcome screen with logo and main heading */}
          <img 
            src={logoImage} 
            alt="Party On Delivery Logo" 
            className="w-48 h-48 mx-auto mb-4"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-brand-blue">
              Austin's Best Alcohol Delivery Service
            </h1>
            <CardTitle className="text-2xl text-brand-blue">
              Party On Delivery
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              Let's Get This Party Started
            </p>
          </div>
          
          {lastOrderInfo && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Recent Delivery Address:</p>
                <p className="font-medium">{lastOrderInfo.address || 'Address not saved'}</p>
                {lastOrderInfo.instructions && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Instructions: {lastOrderInfo.instructions}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Delivery Date & Time:</p>
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
          {/* Main "Start New Order" button */}
          <Button 
            onClick={onStartNewOrder}
            className="w-full h-16 text-xl"
            variant="default"
          >
            <ArrowRight className="w-6 h-6 mr-2" />
            Start New Order
          </Button>
          
          {/* Show "Add to Recent Order" option if there's a recent order */}
          {lastOrderInfo && (
            <>
              <div className="text-center text-sm text-muted-foreground">or</div>
              
              <Button 
                onClick={onAddToRecentOrder}
                className="w-full h-12 text-base"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Recent Order
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Use same delivery details to save on delivery fees!
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};