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
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold text-center">
              Enter code <span className="font-bold">PREMIER2025</span> to get free shipping on your next order!
            </p>
          </div>
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