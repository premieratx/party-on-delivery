import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';
import logoImage from '@/assets/party-on-delivery-logo.png';

interface CustomDeliveryStartScreenProps {
  appName: string;
  onStartOrder: () => void;
  onSearchProducts: () => void;
  onGoHome: () => void;
}

export function CustomDeliveryStartScreen({ 
  appName, 
  onStartOrder, 
  onSearchProducts, 
  onGoHome 
}: CustomDeliveryStartScreenProps) {
  const getButtonText = () => {
    if (appName.toLowerCase().includes('airbnb')) {
      return 'Stock My BnB Now';
    }
    if (appName.toLowerCase().includes('boat')) {
      return 'Stock My Boat Now';
    }
    return 'Start Order Now';
  };

  const getSearchButtonText = () => {
    if (appName.toLowerCase().includes('airbnb')) {
      return 'Search BnB Essentials';
    }
    if (appName.toLowerCase().includes('boat')) {
      return 'Search Boat Supplies';
    }
    return 'Search All Products';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-2">
      <Card className="max-w-sm w-full shadow-floating animate-fade-in">
        <CardHeader className="text-center py-4">
          {/* Logo */}
          <img 
            src={logoImage} 
            alt="Party On Delivery Logo" 
            className="w-24 h-24 mx-auto mb-2"
          />
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-primary">
              {appName}
            </h1>
            <CardTitle className="text-sm text-muted-foreground">
              Powered by Party On Delivery
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pb-4">
          {/* Start Order button */}
          <Button 
            onClick={onStartOrder}
            className="w-full h-12 text-base"
            variant="default"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {getButtonText()}
          </Button>

          {/* Search Products button */}
          <Button 
            onClick={onSearchProducts}
            className="w-full h-12 text-base"
            variant="secondary"
          >
            <Search className="w-4 h-4 mr-2" />
            {getSearchButtonText()}
          </Button>
          
          {/* Go Home button */}
          <Button 
            onClick={onGoHome}
            className="w-full h-12 text-base"
            variant="outline"
          >
            Back to Main App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}