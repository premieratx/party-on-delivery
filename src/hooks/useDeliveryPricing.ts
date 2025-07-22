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
  // Initialize with current subtotal-based pricing
  const [deliveryPricing, setDeliveryPricing] = useState<DeliveryPricing>(() => 
    getStandardDeliveryFee(subtotal)
  );
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  // Calculate delivery pricing whenever address changes, subtotal changes, or component mounts
  useEffect(() => {
    const calculatePricing = async () => {
      // Always update pricing with current subtotal for incomplete addresses
      if (!addressInfo.street || !addressInfo.city || !addressInfo.state || !addressInfo.zipCode) {
        console.log('Using standard pricing for subtotal:', subtotal);
        setDeliveryPricing(getStandardDeliveryFee(subtotal));
        return;
      }

      // Skip calculation for "add to order" unless there are changes (to maintain free shipping)
      if (isAddingToOrder && !hasChanges) {
        return;
      }

      setIsPricingLoading(true);
      
      try {
        console.log('Calculating delivery pricing for address:', addressInfo, 'subtotal:', subtotal);
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
        // Fallback to standard pricing with current subtotal
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