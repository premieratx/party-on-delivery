import { useState, useEffect } from 'react';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AddressInfo {
  address: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
}

interface PersistentCheckoutData {
  customerInfo: CustomerInfo;
  addressInfo: AddressInfo;
  lastUsed: number;
}

const CHECKOUT_STORAGE_KEY = 'persistent-checkout-info';
const DELIVERY_APP_REFERRER_KEY = 'last-delivery-app-url';
const EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days

export const usePersistentCheckout = () => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    address: '',
    unit: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: ''
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load persistent data on mount - optimized for speed
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
        if (saved) {
          const data: PersistentCheckoutData = JSON.parse(saved);
          
          // Check if data is not expired
          if (Date.now() - data.lastUsed < EXPIRATION_TIME) {
            // Load data synchronously for instant display
            setCustomerInfo(data.customerInfo);
            setAddressInfo(data.addressInfo);
            console.log('✅ Fast checkout: Loaded saved data instantly');
          } else {
            // Clean up expired data
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Failed to load persistent checkout data:', error);
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      }
      setIsLoaded(true);
    };

    // Load immediately, no setTimeout
    loadData();
  }, []);

  // Save data whenever it changes (faster debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      // Only save if we have meaningful data
      if (customerInfo.email || addressInfo.address) {
        try {
          const dataToSave: PersistentCheckoutData = {
            customerInfo,
            addressInfo,
            lastUsed: Date.now()
          };
          localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (error) {
          console.warn('Failed to save persistent checkout data:', error);
        }
      }
    }, 300); // Faster save - 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [customerInfo, addressInfo, isLoaded]);

  // Store and retrieve delivery app referrer for "Back to Cart" functionality
  const saveDeliveryAppReferrer = (url: string) => {
    try {
      localStorage.setItem(DELIVERY_APP_REFERRER_KEY, url);
    } catch (error) {
      console.warn('Failed to save delivery app referrer:', error);
    }
  };

  const getDeliveryAppReferrer = (): string => {
    try {
      return localStorage.getItem(DELIVERY_APP_REFERRER_KEY) || '/';
    } catch (error) {
      console.warn('Failed to get delivery app referrer:', error);
      return '/';
    }
  };

  const clearPersistentData = () => {
    try {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      localStorage.removeItem(DELIVERY_APP_REFERRER_KEY);
      setCustomerInfo({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      setAddressInfo({
        address: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: ''
      });
    } catch (error) {
      console.warn('Failed to clear persistent data:', error);
    }
  };

  const updateCustomerInfo = (updates: Partial<CustomerInfo>) => {
    setCustomerInfo(prev => ({ ...prev, ...updates }));
  };

  const updateAddressInfo = (updates: Partial<AddressInfo>) => {
    setAddressInfo(prev => ({ ...prev, ...updates }));
  };

  const hasSavedData = () => {
    return !!(customerInfo.email || addressInfo.address);
  };

  return {
    customerInfo,
    addressInfo,
    isLoaded,
    updateCustomerInfo,
    updateAddressInfo,
    setCustomerInfo,
    setAddressInfo,
    saveDeliveryAppReferrer,
    getDeliveryAppReferrer,
    clearPersistentData,
    hasSavedData
  };
};