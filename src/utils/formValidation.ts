/**
 * Enhanced form validation utilities with better error messaging
 */

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export const validateRequired = (value: string | undefined | null, fieldName: string): ValidationResult => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }
  return { isValid: true, error: null };
};

export const validateEmail = (email: string | undefined | null): ValidationResult => {
  const requiredCheck = validateRequired(email, 'Email');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email!.trim())) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }
  
  return { isValid: true, error: null };
};

export const validatePhone = (phone: string | undefined | null): ValidationResult => {
  const requiredCheck = validateRequired(phone, 'Phone number');
  if (!requiredCheck.isValid) return requiredCheck;
  
  // Remove all non-digit characters
  const digitsOnly = phone!.replace(/\D/g, '');
  
  if (digitsOnly.length !== 10) {
    return {
      isValid: false,
      error: 'Phone number must be 10 digits'
    };
  }
  
  return { isValid: true, error: null };
};

export const validateName = (name: string | undefined | null, fieldName: string): ValidationResult => {
  const requiredCheck = validateRequired(name, fieldName);
  if (!requiredCheck.isValid) return requiredCheck;
  
  const trimmedName = name!.trim();
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 2 characters`
    };
  }
  
  return { isValid: true, error: null };
};

export const validateAddress = (address: string | undefined | null): ValidationResult => {
  const requiredCheck = validateRequired(address, 'Street address');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const trimmedAddress = address!.trim();
  if (trimmedAddress.length < 5) {
    return {
      isValid: false,
      error: 'Please enter a complete street address'
    };
  }
  
  return { isValid: true, error: null };
};

export const validateZipCode = (zipCode: string | undefined | null): ValidationResult => {
  const requiredCheck = validateRequired(zipCode, 'ZIP code');
  if (!requiredCheck.isValid) return requiredCheck;
  
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zipCode!.trim())) {
    return {
      isValid: false,
      error: 'ZIP code must be in format 12345 or 12345-6789'
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate complete customer info
 */
export const validateCustomerInfo = (customerInfo: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) => {
  const errors: Record<string, string> = {};
  
  const firstNameValidation = validateName(customerInfo.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.error!;
  }
  
  const lastNameValidation = validateName(customerInfo.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.error!;
  }
  
  const emailValidation = validateEmail(customerInfo.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!;
  }
  
  const phoneValidation = validatePhone(customerInfo.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.error!;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate complete address info
 */
export const validateAddressInfo = (addressInfo: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}) => {
  const errors: Record<string, string> = {};
  
  const streetValidation = validateAddress(addressInfo.street);
  if (!streetValidation.isValid) {
    errors.street = streetValidation.error!;
  }
  
  const cityValidation = validateRequired(addressInfo.city, 'City');
  if (!cityValidation.isValid) {
    errors.city = cityValidation.error!;
  }
  
  const stateValidation = validateRequired(addressInfo.state, 'State');
  if (!stateValidation.isValid) {
    errors.state = stateValidation.error!;
  }
  
  const zipValidation = validateZipCode(addressInfo.zipCode);
  if (!zipValidation.isValid) {
    errors.zipCode = zipValidation.error!;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};