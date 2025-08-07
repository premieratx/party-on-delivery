/**
 * Calculate delivery fee based on order total
 * Orders over $200 use 10% of subtotal, otherwise $20 flat fee
 */
export const calculateDeliveryFee = (subtotal: number): number => {
  const FLAT_FEE = 20;
  const PERCENTAGE_FEE = 0.10; // 10%
  const THRESHOLD = 200;

  if (subtotal >= THRESHOLD) {
    return subtotal * PERCENTAGE_FEE;
  }
  
  return FLAT_FEE;
};

/**
 * Get delivery fee display text
 */
export const getDeliveryFeeText = (subtotal: number): string => {
  const fee = calculateDeliveryFee(subtotal);
  return `$${fee.toFixed(2)}`;
};

/**
 * Check if order qualifies for percentage-based delivery
 */
export const qualifiesForPercentageFee = (subtotal: number): boolean => {
  return subtotal >= 200;
};