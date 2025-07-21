import { useState, useEffect } from 'react';
import { calculateDistanceBasedDeliveryFee, getStandardDeliveryFee, DeliveryPricing } from '@/utils/deliveryPricing';
import { AddressInfo } from './useCustomerInfo';

interface UseDeliveryPricingProps {
  addressInfo: AddressInfo;
  subtotal: number;
  isAddingToOrder: boolean;
  hasChanges: boolean;
}

export function useDeliveryPricing({ addressInfo, subtotal, isAddingToOrder, hasChanges }: UseDeliveryPricingProps) {
  const [deliveryPricing, setDeliveryPricing] = useState<DeliveryPricing>({
    fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20),
    minimumOrder: 0,
    isDistanceBased: false
  });
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  // Calculate delivery pricing whenever address changes or component mounts with complete address
  useEffect(() => {
    const calculatePricing = async () => {
      // Only calculate if we have a complete address
      if (!addressInfo.street || !addressInfo.city || !addressInfo.state || !addressInfo.zipCode) {
        // Use standard pricing for incomplete addresses
        setDeliveryPricing(getStandardDeliveryFee(subtotal));
        return;
      }

      // Skip calculation for "add to order" unless there are changes (to maintain free shipping)
      if (isAddingToOrder && !hasChanges) {
        return;
      }

      setIsPricingLoading(true);
      
      try {
        console.log('Calculating delivery pricing for address:', addressInfo);
        const pricing = await calculateDistanceBasedDeliveryFee(
          addressInfo.street,
          addressInfo.city,
          addressInfo.state,
          addressInfo.zipCode,
          subtotal
        );
        console.log('Calculated delivery pricing:', pricing);
        setDeliveryPricing(pricing);
      } catch (error) {
        console.error('Error calculating delivery pricing:', error);
        // Fallback to standard pricing
        setDeliveryPricing(getStandardDeliveryFee(subtotal));
      } finally {
        setIsPricingLoading(false);
      }
    };

    calculatePricing();
  }, [addressInfo.street, addressInfo.city, addressInfo.state, addressInfo.zipCode, subtotal, isAddingToOrder, hasChanges]);

  return {
    deliveryPricing,
    isPricingLoading
  };
}