import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface PostCheckoutStandardizedProps {
  // Required order data
  orderNumber: string;
  customerName: string;
  
  // Optional custom messaging from app config
  customHeading?: string;
  customSubheading?: string;
  customButtonText?: string;
  customButtonUrl?: string;
  
  // Optional styling
  backgroundColor?: string;
  textColor?: string;
}

export const PostCheckoutStandardized: React.FC<PostCheckoutStandardizedProps> = ({
  orderNumber,
  customerName,
  customHeading,
  customSubheading,
  customButtonText,
  customButtonUrl,
  backgroundColor = '#ffffff',
  textColor = '#000000'
}) => {
  const handleCustomButtonClick = () => {
    if (customButtonUrl) {
      // Open in new tab if external URL, same tab if internal
      if (customButtonUrl.startsWith('http')) {
        window.open(customButtonUrl, '_blank');
      } else {
        window.location.href = customButtonUrl;
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
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
            Thank you, {customerName}! Your order #{orderNumber} has been confirmed.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Custom App Messaging */}
          {(customHeading || customSubheading || customButtonText) && (
            <div className="text-center p-6 border-2 border-dashed border-primary rounded-lg">
              {customHeading && (
                <h3 
                  className="text-xl font-bold mb-4"
                  style={{ color: textColor }}
                >
                  {customHeading}
                </h3>
              )}
              {customSubheading && (
                <p 
                  className="text-lg mb-6"
                  style={{ color: textColor }}
                >
                  {customSubheading}
                </p>
              )}
              {customButtonText && customButtonUrl && (
                <Button 
                  onClick={handleCustomButtonClick}
                  size="lg"
                  className="text-white bg-primary hover:bg-primary/90"
                >
                  {customButtonText}
                </Button>
              )}
            </div>
          )}

          {/* Default Actions - Only show if no custom button */}
          {!(customButtonText && customButtonUrl) && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};