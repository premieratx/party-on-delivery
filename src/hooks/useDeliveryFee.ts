import { useMemo } from 'react';

/**
 * Optimized delivery fee calculation with memoization
 * Uses tiered pricing structure for better customer experience
 */
export function useDeliveryFee(subtotal: number) {
  const deliveryFee = useMemo(() => {
    // Optimized delivery fee structure
    if (subtotal >= 75) {
      return 0; // Free delivery for orders $75+
    } else if (subtotal >= 50) {
      return 2.99; // Reduced fee for orders $50-$74.99
    } else {
      return 5.99; // Standard fee for orders under $50
    }
  }, [subtotal]);

  return deliveryFee;
}