import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from './cacheManager';
import { ErrorHandler } from './errorHandler';

export interface DistanceResponse {
  distanceInMiles: number;
  durationInMinutes: number;
  success: boolean;
  error?: string;
}

export interface DeliveryPricing {
  fee: number;
  minimumOrder: number;
  isDistanceBased: boolean;
  distance?: number;
}

export const calculateDistanceBasedDeliveryFee = async (
  address: string,
  city: string,
  state: string,
  zipCode: string,
  subtotal: number
): Promise<DeliveryPricing> => {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  
  // Check cache first
  const cachedPricing = cacheManager.getDeliveryPricing(fullAddress);
  if (cachedPricing) {
    console.log('Using cached delivery pricing');
    return cachedPricing;
  }

  try {
    // Use retry logic for API calls
    const result = await ErrorHandler.withRetry(async () => {
      const { data, error } = await supabase.functions.invoke('calculate-delivery-distance', {
        body: {
          deliveryAddress: address,
          deliveryCity: city,
          deliveryState: state,
          deliveryZip: zipCode
        }
      });
      if (error) throw error;
      return data;
    }, {
      maxAttempts: 2,
      delayMs: 1000,
      backoffMultiplier: 1.5
    });

    const response: DistanceResponse = result;
    
    if (!response.success) {
      console.error('Distance calculation failed:', response.error);
      // Return standard pricing but don't cache failures
      return getStandardDeliveryFee(subtotal);
    }

    const distance = response.distanceInMiles;
    let pricing: DeliveryPricing;
    
    // Apply distance-based pricing rules
    if (distance <= 10) {
      // Within 10 miles: existing rules (10% for $200+, $20 for under $200)
      pricing = {
        fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
        minimumOrder: 0,
        isDistanceBased: true,
        distance
      };
    } else if (distance <= 20) {
      // 10-20 miles: $40 minimum order requirement
      const percentageFee = subtotal * 0.1;
      pricing = {
        fee: Math.max(percentageFee, 40),
        minimumOrder: 40,
        isDistanceBased: true,
        distance
      };
    } else {
      // Over 20 miles: $60 minimum order requirement
      const percentageFee = subtotal * 0.1;
      pricing = {
        fee: Math.max(percentageFee, 60),
        minimumOrder: 60,
        isDistanceBased: true,
        distance
      };
    }

    // Cache successful result
    cacheManager.setDeliveryPricing(fullAddress, pricing);
    return pricing;

  } catch (error) {
    ErrorHandler.logError(error, 'calculateDistanceBasedDeliveryFee');
    // Fallback to standard pricing
    return getStandardDeliveryFee(subtotal);
  }
};

export const getStandardDeliveryFee = (subtotal: number): DeliveryPricing => {
  return {
    fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
    minimumOrder: 0,
    isDistanceBased: false
  };
};