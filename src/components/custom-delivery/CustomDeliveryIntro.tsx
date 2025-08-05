import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface CustomDeliveryIntroProps {
  appName: string;
  onStartOrder: () => void;
  onGoHome: () => void;
}

export function CustomDeliveryIntro({ appName, onStartOrder, onGoHome }: CustomDeliveryIntroProps) {
  const getButtonText = () => {
    if (appName.toLowerCase().includes('airbnb')) {
      return 'Stock My BnB Now';
    }
    return 'Start Order Now';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Navigation */}
      <div className="flex items-center justify-between p-4 relative z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoHome}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {appName}
            </h1>
            <p className="text-xl text-muted-foreground">
              Delivery service
            </p>
          </div>

          {/* Main Action Card */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">
                    Ready to get started?
                  </h2>
                  <p className="text-muted-foreground">
                    Browse our curated selection and get everything delivered
                  </p>
                </div>
                
                <Button 
                  onClick={onStartOrder}
                  size="lg"
                  className="w-full text-lg py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                >
                  {getButtonText()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🚚</div>
                <h3 className="font-semibold">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">Same-day delivery available</p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold">Curated Selection</h3>
                <p className="text-sm text-muted-foreground">Handpicked for your needs</p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/10 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-semibold">Premium Service</h3>
                <p className="text-sm text-muted-foreground">White-glove delivery</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
    </div>
  );
}