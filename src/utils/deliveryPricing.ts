import { supabase } from '@/integrations/supabase/client';

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
  try {
    // Call the distance calculation edge function
    const { data, error } = await supabase.functions.invoke('calculate-delivery-distance', {
      body: {
        deliveryAddress: address,
        deliveryCity: city,
        deliveryState: state,
        deliveryZip: zipCode
      }
    });

    if (error) {
      console.error('Distance calculation error:', error);
      // Fallback to standard pricing
      return {
        fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
        minimumOrder: 0,
        isDistanceBased: false
      };
    }

    const response: DistanceResponse = data;
    
    if (!response.success) {
      console.error('Distance calculation failed:', response.error);
      // Fallback to standard pricing
      return {
        fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
        minimumOrder: 0,
        isDistanceBased: false
      };
    }

    const distance = response.distanceInMiles;
    
    // Apply distance-based pricing rules
    if (distance <= 10) {
      // Within 10 miles: existing rules (10% for $200+, $20 for under $200)
      return {
        fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
        minimumOrder: 0,
        isDistanceBased: true,
        distance
      };
    } else if (distance <= 20) {
      // 10-20 miles: $40 minimum order requirement
      const percentageFee = subtotal * 0.1;
      return {
        fee: Math.max(percentageFee, 40),
        minimumOrder: 40,
        isDistanceBased: true,
        distance
      };
    } else {
      // Over 20 miles: $60 minimum order requirement
      const percentageFee = subtotal * 0.1;
      return {
        fee: Math.max(percentageFee, 60),
        minimumOrder: 60,
        isDistanceBased: true,
        distance
      };
    }

  } catch (error) {
    console.error('Error in distance-based pricing calculation:', error);
    // Fallback to standard pricing
    return {
      fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
      minimumOrder: 0,
      isDistanceBased: false
    };
  }
};

export const getStandardDeliveryFee = (subtotal: number): DeliveryPricing => {
  return {
    fee: Math.max(subtotal >= 200 ? subtotal * 0.1 : 20, 20), // $20 minimum delivery fee
    minimumOrder: 0,
    isDistanceBased: false
  };
};