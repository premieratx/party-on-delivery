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
    <Card className="mb-6 border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          Saved Information Found
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCustomerData && (
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 mt-1 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Contact Information</p>
              <p className="text-sm text-green-700">
                {customerInfo.firstName} {customerInfo.lastName}
                {customerInfo.email && (
                  <span className="block">{customerInfo.email}</span>
                )}
                {customerInfo.phone && (
                  <span className="block">{customerInfo.phone}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {hasAddressData && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 mt-1 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Delivery Address</p>
              <p className="text-sm text-green-700">
                {addressInfo.street}
                {addressInfo.city && (
                  <span className="block">{addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}</span>
                )}
                {addressInfo.instructions && (
                  <span className="block text-xs opacity-75">Note: {addressInfo.instructions}</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={onConfirm} className="flex-1" size="sm">
            Use This Information
          </Button>
          <Button onClick={onEdit} variant="outline" size="sm">
            Edit Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};