/**
 * Utility functions for consistent currency formatting across the application
 */

/**
 * Format a number as currency with proper decimal places
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string (e.g., "$5.40" instead of "$5.4")
 */
export const formatCurrency = (amount: number | string, currency: string = 'USD'): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Format a number as currency without the currency symbol
 * @param amount - The amount to format
 * @returns Formatted amount string (e.g., "5.40" instead of "5.4")
 */
export const formatAmount = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '0.00';
  }

  return numericAmount.toFixed(2);
};

/**
 * Parse a currency string to a number
 * @param currencyString - The currency string to parse (e.g., "$5.40" or "5.40")
 * @returns The numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};