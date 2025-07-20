// Validation utilities for forms

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return phone;
};

export const getEmailErrorMessage = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!validateEmail(email)) return 'Please enter a valid email address';
  return null;
};

export const getPhoneErrorMessage = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  if (!validatePhoneNumber(phone)) return 'Please enter a valid 10-digit US phone number';
  return null;
};