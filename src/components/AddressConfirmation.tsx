import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Check, X } from 'lucide-react';

interface AddressConfirmationProps {
  onConfirmSameAddress: () => void;
  onUseNewAddress: () => void;
  lastOrderInfo?: {
    orderNumber: string;
    total: number;
    date: string;
    address?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    instructions?: string;
  };
}

export const AddressConfirmation: React.FC<AddressConfirmationProps> = ({
  onConfirmSameAddress,
  onUseNewAddress,
  lastOrderInfo
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-floating animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Delivery to Same Address?
          </CardTitle>
          <p className="text-muted-foreground">
            Would you like to deliver to the same address as your previous order?
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {lastOrderInfo?.address && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Previous delivery address:</p>
              <p className="font-medium">{lastOrderInfo.address}</p>
              {lastOrderInfo.instructions && (
                <p className="text-sm text-muted-foreground mt-1">
                  Instructions: {lastOrderInfo.instructions}
                </p>
              )}
              {lastOrderInfo.deliveryDate && lastOrderInfo.deliveryTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Last delivery: {lastOrderInfo.deliveryDate} at {lastOrderInfo.deliveryTime}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <Button 
              onClick={onConfirmSameAddress}
              className="w-full h-14 text-lg"
              variant="default"
            >
              <Check className="w-5 h-5 mr-2" />
              Yes, Same Address
            </Button>
            
            <Button 
              onClick={onUseNewAddress}
              className="w-full h-12 text-base"
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              No, Use New Address
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            If you choose the same address, we'll bundle this with your previous order for efficient delivery!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};