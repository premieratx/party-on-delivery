import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface CustomPostCheckoutProps {
  config: {
    enabled: boolean;
    title: string;
    message: string;
    cta_button_text: string;
    cta_button_url: string;
    background_color: string;
    text_color: string;
  };
  orderData: {
    order_number: string;
    customer_name: string;
    total_amount: number;
    delivery_date?: string;
    delivery_time?: string;
  };
}

export const CustomPostCheckout: React.FC<CustomPostCheckoutProps> = ({
  config,
  orderData
}) => {
  const handleCTAClick = () => {
    if (config.cta_button_url) {
      window.location.href = config.cta_button_url;
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: config.background_color }}
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700">
            Order Complete!
          </CardTitle>
          <p className="text-muted-foreground">
            Thank you, {orderData.customer_name}! Your order #{orderData.order_number} has been confirmed.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Order Number:</span>
                <span className="font-medium">#{orderData.order_number}</span>
              </div>
              {orderData.delivery_date && (
                <div className="flex justify-between">
                  <span>Delivery Date:</span>
                  <span className="font-medium">{orderData.delivery_date}</span>
                </div>
              )}
              {orderData.delivery_time && (
                <div className="flex justify-between">
                  <span>Delivery Time:</span>
                  <span className="font-medium">{orderData.delivery_time}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">${orderData.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          {config.enabled && config.title && (
            <div className="text-center p-6 border-2 border-dashed border-primary rounded-lg">
              <h3 
                className="text-xl font-bold mb-4"
                style={{ color: config.text_color }}
              >
                {config.title}
              </h3>
              <p 
                className="text-lg mb-6"
                style={{ color: config.text_color }}
              >
                {config.message}
              </p>
              {config.cta_button_text && config.cta_button_url && (
                <Button 
                  onClick={handleCTAClick}
                  size="lg"
                  className="text-white bg-primary hover:bg-primary/90"
                >
                  {config.cta_button_text}
                </Button>
              )}
            </div>
          )}

          {/* Default Actions */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" asChild className="flex-1">
                <a href="/customer/login">Manage Order</a>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/">Continue Shopping</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};