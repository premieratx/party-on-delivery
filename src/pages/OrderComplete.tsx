import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Truck, Plus, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { PostCheckoutContinuation } from '@/components/PostCheckoutContinuation';

interface LastOrderInfo {
  orderNumber: string;
  total: number;
  date: string;
  orderId: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  instructions?: string;
  recentpurchase: boolean;
  items?: Array<{
    id: string;
    title: string;
    variant?: string;
    price: number;
    quantity: number;
  }>;
}

export default function OrderComplete() {
  const navigate = useNavigate();
  const [lastOrderInfo, setLastOrderInfo] = useState<LastOrderInfo | null>(null);
  const [isOrderStillActive, setIsOrderStillActive] = useState(false);
  const [showContinuation, setShowContinuation] = useState(true);

  useEffect(() => {
    // Get the last order info from localStorage
    const orderData = localStorage.getItem('partyondelivery_last_order');
    if (orderData) {
      try {
        const order = JSON.parse(orderData);
        setLastOrderInfo(order);
        
        // Check if the order is still active (delivery date/time hasn't passed)
        if (order.deliveryDate && order.deliveryTime) {
          const deliveryDateTime = new Date(`${order.deliveryDate}T${convertTimeToDateTime(order.deliveryTime)}`);
          setIsOrderStillActive(!isAfter(new Date(), deliveryDateTime));
        }
      } catch (error) {
        console.error('Error parsing last order:', error);
      }
    }
  }, []);

  // Convert time slot to datetime format for comparison
  const convertTimeToDateTime = (timeSlot: string): string => {
    // Extract start time from slot like "10:00 AM - 11:00 AM"
    const startTime = timeSlot.split(' - ')[0];
    
    // Convert to 24-hour format
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const handleOrderAgain = () => {
    // Set a flag to indicate this is an "add to order" flow
    localStorage.setItem('partyondelivery_add_to_order', 'true');
    setShowContinuation(false);
    navigate('/');
  };

  const handleStartNewOrder = () => {
    // Clear the add to order flag and start fresh
    localStorage.removeItem('partyondelivery_add_to_order');
    setShowContinuation(false);
    navigate('/');
  };

  // Show PostCheckoutContinuation first for all users
  if (showContinuation && lastOrderInfo) {
    return (
      <PostCheckoutContinuation
        onStartNewOrder={handleStartNewOrder}
        onAddToOrder={handleOrderAgain}
        lastOrderInfo={lastOrderInfo}
      />
    );
  }

  if (!lastOrderInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Order Complete!</h1>
            <p className="text-muted-foreground mb-6">Thank you for your purchase.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        {/* Order Complete Header */}
        <Card className="shadow-floating animate-fade-in text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Order Complete!
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Thank you for your purchase
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Order #{lastOrderInfo.orderNumber}
            </Badge>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="shadow-floating animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            {lastOrderInfo.items && lastOrderInfo.items.length > 0 && (
              <div className="space-y-3 pb-4 border-b">
                {lastOrderInfo.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-medium">{item.title.replace(/^gid:\/\/shopify\/[^/]+\/\d+\s*/, '')}</span>
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
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-bold text-xl">${(lastOrderInfo.total || 0).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Delivery:</span>
              <span className="font-medium">
                {lastOrderInfo.deliveryDate && format(new Date(lastOrderInfo.deliveryDate), 'MMM d, yyyy')} • {lastOrderInfo.deliveryTime}
              </span>
            </div>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5" />
              <span>{lastOrderInfo.address}</span>
            </div>
            
            {lastOrderInfo.instructions && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Instructions:</span> {lastOrderInfo.instructions}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add to Order Section */}
        {isOrderStillActive && (
          <Card className="shadow-floating animate-fade-in border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Truck className="w-5 h-5" />
                Save on Delivery - Add to This Order!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">FREE Delivery Available</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Add more items to your existing order and get <strong>FREE delivery</strong> since we're already coming to your address!
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Address:</span>
                  <span className="font-medium">{lastOrderInfo.address}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Time:</span>
                  <span className="font-medium">
                    {lastOrderInfo.deliveryDate && format(new Date(lastOrderInfo.deliveryDate), 'MMM d')} • {lastOrderInfo.deliveryTime}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleOrderAgain} 
                className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add More Items - FREE Delivery
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Start New Order */}
        <Card className="shadow-floating animate-fade-in">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Want to start a new order?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new order for a different address or delivery time.
            </p>
            <Button 
              onClick={handleStartNewOrder} 
              variant="outline" 
              className="w-full"
            >
              Start New Order
            </Button>
          </CardContent>
        </Card>


        {/* Back to Home */}
        <div className="text-center pt-4">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost"
            className="text-muted-foreground"
          >
            ← Back to Store
          </Button>
        </div>
      </div>
    </div>
  );
}