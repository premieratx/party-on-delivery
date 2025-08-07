import { useMemo } from 'react';

/**
 * DELIVERY RULES - These rules are enforced across the app
 * 
 * Base Rules (always apply unless discount code overrides):
 * - Orders $200+ = 10% of subtotal as delivery fee
 * - Orders under $200 = $20 minimum delivery fee
 * - Delivery fee is NEVER $0 unless:
 *   a) Free shipping discount code applied (PREMIER2025)
 *   b) Adding to existing order with same address/time
 * 
 * Discount Codes:
 * - PREMIER2025: Free shipping (sets delivery fee to $0)
 * - PARTYON10: 10% off subtotal (delivery fee still applies)
 */
// FIXED: Reliable delivery fee calculation that works every time
export function useDeliveryFee(subtotal: number, appliedDiscount?: {code: string, type: 'percentage' | 'free_shipping', value: number} | null) {
  const deliveryFee = useMemo(() => {
    // Input validation
    const validSubtotal = Math.max(0, Number(subtotal) || 0);
    
    // If free shipping discount is applied, delivery is $0
    if (appliedDiscount?.type === 'free_shipping') {
      return 0;
    }
    
    // Base delivery rules: 10% for $200+, $20 minimum for under $200
    if (validSubtotal >= 200) {
      return Math.round(validSubtotal * 0.1 * 100) / 100; // 10% of subtotal, rounded to cents
    } else {
      return 20; // $20 minimum delivery fee
    }
  }, [subtotal, appliedDiscount]);

  return deliveryFee;
}