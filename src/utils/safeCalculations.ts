/**
 * Bulletproof calculation utilities to prevent website crashes
 * These functions ensure that invalid data never breaks price calculations or UI rendering
 */

export const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
};

export const safePrice = (price: any): number => {
  return Math.max(0, safeNumber(price));
};

export const safeQuantity = (quantity: any): number => {
  return Math.max(0, Math.floor(safeNumber(quantity)));
};

export const formatPrice = (amount: any): string => {
  return safeNumber(amount).toFixed(2);
};

export const calculateTotal = (items: Array<{ price: any; quantity: any }>): number => {
  return items.reduce((sum, item) => {
    return sum + (safePrice(item.price) * safeQuantity(item.quantity));
  }, 0);
};

export const calculateTotalItems = (items: Array<{ quantity: any }>): number => {
  return items.reduce((sum, item) => sum + safeQuantity(item.quantity), 0);
};

// Prevent any calculation from ever crashing the website
export const robustCalculation = <T>(calculation: () => T, fallback: T): T => {
  try {
    const result = calculation();
    // Extra check for NaN or invalid results
    if (typeof result === 'number' && (isNaN(result) || !isFinite(result))) {
      return fallback;
    }
    return result;
  } catch (error) {
    console.warn('Calculation failed, using fallback:', error);
    return fallback;
  }
};