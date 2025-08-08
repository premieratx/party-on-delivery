import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';
interface CustomDeliveryStartScreenProps {
  appName: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  startButtonText?: string;
  onStartOrder: () => void;
  onSearchProducts: () => void;
  onGoHome: () => void;
}

export function CustomDeliveryStartScreen({ 
  appName, 
  title,
  subtitle,
  logoUrl,
  startButtonText,
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
    <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center p-4">
      <Card className="max-w-sm w-full shadow-floating animate-fade-in bg-card/90 backdrop-blur border border-primary/10">
        <CardHeader className="text-center py-6">
          {logoUrl && (
            <img 
              src={logoUrl}
              alt={`${appName} logo`}
              className="h-16 w-auto mx-auto mb-3 animate-fade-in pulse"
              loading="eager"
            />
          )}
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title || appName}
            </h1>
            <CardTitle className="text-sm text-muted-foreground">
              {subtitle || 'Exclusive concierge delivery'}
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
            {startButtonText || getButtonText()}
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