import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ShieldX, ArrowLeft, ArrowRight } from 'lucide-react';
import logoImage from '@/assets/party-on-delivery-logo.png';

interface AgeVerificationProps {
  onVerified: (verified: boolean) => void;
  onBack?: () => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerified, onBack }) => {
  const [showButtons, setShowButtons] = useState(false);

  const handleStart = () => {
    setShowButtons(true);
  };

  const handleAgeResponse = (isOver21: boolean) => {
    if (isOver21) {
      onVerified(true);
    } else {
      alert("Sorry, you must be 21 or older to use this service.");
      onVerified(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-floating animate-scale-in">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <img 
                src={logoImage} 
                alt="Party On Delivery Logo" 
                className="w-20 h-20 mx-auto"
              />
              
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Austin's Best Alcohol Delivery Service
              </h1>
              
              <p className="text-muted-foreground text-lg">
                Fast, convenient delivery to your door
              </p>
            </div>

            {!showButtons ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get beer, liquor, cocktails & party supplies delivered in minutes
                </p>
                <Button 
                  variant="delivery" 
                  size="xl" 
                  className="w-full"
                  onClick={handleStart}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Start Delivery
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Age Verification Required</h2>
                  <p className="text-muted-foreground">
                    Are you 21 years of age or older?
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleAgeResponse(true)}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Yes, I'm 21+
                  </Button>
                  
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => handleAgeResponse(false)}
                    className="flex items-center gap-2"
                  >
                    <ShieldX className="w-5 h-5" />
                    No, Under 21
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  By continuing, you confirm you are of legal drinking age
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Navigation Footer */}
      {onBack && (
        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step 2 of 4
            </div>
          </div>
        </div>
      )}
    </div>
  );
};