import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, ShoppingBag, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomOrderContinuationProps {
  onStartNewOrder: () => void;
  onResumeOrder: () => void;
  deliveryInfo: any;
  cartItems: any[];
  appName: string;
}

export function CustomOrderContinuation({
  onStartNewOrder,
  onResumeOrder,
  deliveryInfo,
  cartItems,
  appName
}: CustomOrderContinuationProps) {
  const navigate = useNavigate();
  const hasExistingOrder = cartItems.length > 0;
  const hasDeliveryInfo = deliveryInfo.selectedDate || deliveryInfo.customerInfo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* App Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{appName}</h1>
          <p className="text-muted-foreground">
            Delivery service
          </p>
        </div>

        {/* Continue or Start Order */}
        {hasExistingOrder || hasDeliveryInfo ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Continue Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasExistingOrder && (
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span>{cartItems.length} items in cart</span>
                </div>
              )}
              
              {deliveryInfo.selectedDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{deliveryInfo.selectedDate} at {deliveryInfo.selectedTime}</span>
                </div>
              )}
              
              {deliveryInfo.deliveryAddress && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{deliveryInfo.deliveryAddress.street}</span>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={onResumeOrder} className="flex-1">
                  Continue Order
                </Button>
                <Button onClick={onStartNewOrder} variant="outline" className="flex-1">
                  Start Fresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                Ready to place an order for delivery?
              </p>
              <Button onClick={onStartNewOrder} className="w-full mb-4">
                Start New Order
              </Button>
              
              {/* Shared App Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                <Button 
                  onClick={() => navigate('/search')}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Button>
                <Button 
                  onClick={() => navigate('/plan-my-party')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Party Planner
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}