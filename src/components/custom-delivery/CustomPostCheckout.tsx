import React from 'react';
import { Link } from 'react-router-dom';
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
          {/* Simple Order Confirmation - REMOVED detailed breakdown per user request */}
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Order #{orderData.order_number} confirmed
            </p>
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
                <Link to="/customer/login">Manage Order</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};