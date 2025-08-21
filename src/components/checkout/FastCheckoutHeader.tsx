import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, MapPin, User, Edit3 } from 'lucide-react';
import { CustomerInfo } from '@/hooks/useCustomerInfo';
import { DeliveryInfo } from '@/components/DeliveryWidget';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FastCheckoutHeaderProps {
  customerInfo: CustomerInfo;
  deliveryInfo: DeliveryInfo;
  hasSavedData: boolean;
  onEditAll: () => void;
}

export const FastCheckoutHeader: React.FC<FastCheckoutHeaderProps> = ({
  customerInfo,
  deliveryInfo,
  hasSavedData,
  onEditAll
}) => {
  if (!hasSavedData) return null;

  const hasCustomerData = customerInfo.firstName || customerInfo.email;
  const hasDeliveryData = deliveryInfo.date || deliveryInfo.address;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Previously Saved Information</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Auto-filled
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEditAll}
          className="text-green-700 hover:bg-green-100"
        >
          <Edit3 className="w-4 h-4 mr-1" />
          Edit All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Customer Info Section */}
        {hasCustomerData && (
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Contact Information</p>
              <div className="text-green-700 space-y-1">
                {(customerInfo.firstName || customerInfo.lastName) && (
                  <p>{customerInfo.firstName} {customerInfo.lastName}</p>
                )}
                {customerInfo.email && <p>{customerInfo.email}</p>}
                {customerInfo.phone && <p>{customerInfo.phone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Info Section */}
        {hasDeliveryData && (
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <MapPin className="w-4 h-4 text-green-600" />
              {deliveryInfo.date && (
                <Clock className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-green-800">Delivery Details</p>
              <div className="text-green-700 space-y-1">
                {deliveryInfo.date && (
                  <p>
                    {format(deliveryInfo.date, 'EEE, MMM dd')}
                    {deliveryInfo.timeSlot && ` at ${deliveryInfo.timeSlot}`}
                  </p>
                )}
                {deliveryInfo.address && (
                  <p className="text-xs leading-tight">{deliveryInfo.address}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-green-600">
        ✓ Information will be automatically populated in the checkout form
      </div>
    </div>
  );
};