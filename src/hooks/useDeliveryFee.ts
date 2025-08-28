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
export function useDeliveryFee(subtotal: number, appliedDiscount?: {code: string, type: 'percentage' | 'free_shipping', value: number} | null, coverPageFreeShipping?: boolean) {
  const deliveryFee = useMemo(() => {
    // Input validation
    const validSubtotal = Math.max(0, Number(subtotal) || 0);
    
    // Check for free shipping from cover page toggle
    const freeShippingFromCover = sessionStorage.getItem('shipping.free') === '1';
    
    // If free shipping discount is applied OR cover page free shipping is enabled, delivery is $0
    if (appliedDiscount?.type === 'free_shipping' || coverPageFreeShipping || freeShippingFromCover) {
      return 0;
    }
    
    // Base delivery rules: 10% for $200+, $20 minimum for under $200
    if (validSubtotal >= 200) {
      return Math.round(validSubtotal * 0.1 * 100) / 100; // 10% of subtotal, rounded to cents
    } else {
      return 20; // $20 minimum delivery fee
    }
  }, [subtotal, appliedDiscount, coverPageFreeShipping]);

  return deliveryFee;
}