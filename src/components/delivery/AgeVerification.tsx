import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ShieldX } from 'lucide-react';

interface AgeVerificationProps {
  onVerified: (verified: boolean) => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerified }) => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md mx-auto shadow-floating animate-scale-in">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Local Liquor Delivery
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
  );
};