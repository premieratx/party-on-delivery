/**
 * Utility to sanitize text by removing emojis for Shopify compatibility
 * Shopify has restrictions on emoji characters in certain fields
 */

// Comprehensive emoji regex that matches most emoji characters
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

/**
 * Removes emojis from a string
 * @param text - The text to sanitize
 * @returns The text with emojis removed
 */
export const removeEmojis = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  return text.replace(EMOJI_REGEX, '').trim();
};

/**
 * Sanitizes an object by removing emojis from all string values
 * @param obj - The object to sanitize
 * @returns A new object with emojis removed from string values
 */
export const sanitizeObjectForShopify = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = removeEmojis(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObjectForShopify(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? removeEmojis(item) :
        item && typeof item === 'object' ? sanitizeObjectForShopify(item) :
        item
      );
    }
  }
  
  return sanitized;
};

/**
 * Sanitizes customer data specifically for Shopify orders
 * Focuses on fields that Shopify validates for emoji content
 */
export const sanitizeCustomerDataForShopify = (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    instructions?: string;
    company?: string;
  };
}) => {
  return {
    ...data,
    firstName: removeEmojis(data.firstName || ''),
    lastName: removeEmojis(data.lastName || ''),
    email: removeEmojis(data.email || ''),
    phone: removeEmojis(data.phone || ''),
    company: removeEmojis(data.company || ''),
    address: data.address ? {
      ...data.address,
      street: removeEmojis(data.address.street || ''),
      city: removeEmojis(data.address.city || ''),
      state: removeEmojis(data.address.state || ''),
      zipCode: removeEmojis(data.address.zipCode || ''),
      instructions: removeEmojis(data.address.instructions || ''),
      company: removeEmojis(data.address.company || '')
    } : undefined
  };
};