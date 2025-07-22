import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, User, MapPin } from 'lucide-react';

interface DataConfirmationProps {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  addressInfo: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
}

export const DataConfirmation: React.FC<DataConfirmationProps> = ({
  customerInfo,
  addressInfo,
  onConfirm,
  onEdit
}) => {
  const hasCustomerData = customerInfo.firstName || customerInfo.lastName || customerInfo.email;
  const hasAddressData = addressInfo.street || addressInfo.city || addressInfo.state;

  if (!hasCustomerData && !hasAddressData) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-green-50 shadow-lg">
        <CardHeader className="pb-3 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-blue-800 text-lg md:text-xl">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
            Welcome Back!
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            We found your previous delivery information
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {hasCustomerData && (
            <div className="p-3 border border-blue-200 rounded-lg bg-white/50">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-1 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-800 text-sm">Contact Information</p>
                  <div className="text-sm text-blue-700 space-y-1 mt-1">
                    <div className="truncate">{customerInfo.firstName} {customerInfo.lastName}</div>
                    {customerInfo.email && (
                      <div className="truncate text-xs">{customerInfo.email}</div>
                    )}
                    {customerInfo.phone && (
                      <div className="text-xs">{customerInfo.phone}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasAddressData && (
            <div className="p-3 border border-blue-200 rounded-lg bg-white/50">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-800 text-sm">Delivery Address</p>
                  <div className="text-sm text-blue-700 space-y-1 mt-1">
                    <div className="truncate">{addressInfo.street}</div>
                    {addressInfo.city && (
                      <div className="text-xs">{addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</div>
                    )}
                    {addressInfo.instructions && (
                      <div className="text-xs opacity-75 italic">"{addressInfo.instructions}"</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={onConfirm} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              ✓ Use This Information
            </Button>
            <Button 
              onClick={onEdit} 
              variant="outline" 
              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
              size="lg"
            >
              ✏ Start Fresh
            </Button>
          </div>
          
          <p className="text-xs text-center text-blue-600 opacity-75 mt-2">
            Your information is saved for faster checkout
          </p>
        </CardContent>
      </Card>
    </div>
  );
};