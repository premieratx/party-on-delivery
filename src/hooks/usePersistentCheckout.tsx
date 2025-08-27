import { useState, useEffect } from 'react';
import { checkoutStorage } from '@/utils/universalStorage';

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

  // Load persistent data on mount - optimized for speed with incognito mode support
  useEffect(() => {
    const loadData = () => {
      try {
        let saved: string | null = null;
        let storageType = 'localStorage';
        
        // Try localStorage first, fallback to sessionStorage for incognito mode
        try {
          saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
        } catch (localStorageError) {
          console.warn('⚠️ localStorage read failed, trying sessionStorage for incognito mode:', localStorageError);
          try {
            saved = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
            storageType = 'sessionStorage';
          } catch (sessionStorageError) {
            console.error('❌ Both storage methods failed during load:', sessionStorageError);
          }
        }
        
        if (saved) {
          const data: PersistentCheckoutData = JSON.parse(saved);
          
          // Check if data is not expired
          if (Date.now() - data.lastUsed < EXPIRATION_TIME) {
            // Load data synchronously for instant display
            setCustomerInfo(data.customerInfo);
            setAddressInfo(data.addressInfo);
            console.log(`✅ Fast checkout: Loaded saved data instantly from ${storageType}`);
          } else {
            // Clean up expired data from both storage locations
            try {
              if (storageType === 'localStorage') {
                localStorage.removeItem(CHECKOUT_STORAGE_KEY);
              } else {
                sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
              }
            } catch (cleanupError) {
              console.warn('Failed to cleanup expired data:', cleanupError);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load persistent checkout data:', error);
        // Try to clean up both storages if parsing failed
        try {
          localStorage.removeItem(CHECKOUT_STORAGE_KEY);
          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        } catch (cleanupError) {
          console.warn('Failed to cleanup corrupted data:', cleanupError);
        }
      }
      setIsLoaded(true);
    };

    // Load immediately, no setTimeout
    loadData();
  }, []);

  // Save data whenever it changes (faster debounced) with incognito mode support
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
          
          // Use universal storage for bulletproof saving
          checkoutStorage.savePersistentData(dataToSave);
          console.log('✅ Persistent checkout data saved universally');
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
      // Clear from both storage mechanisms to be thorough
      try {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        localStorage.removeItem(DELIVERY_APP_REFERRER_KEY);
        console.log('✅ Persistent data cleared from localStorage');
      } catch (localStorageError) {
        console.warn('⚠️ Failed to clear localStorage:', localStorageError);
      }
      
      try {
        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        sessionStorage.removeItem(DELIVERY_APP_REFERRER_KEY);
        console.log('✅ Persistent data cleared from sessionStorage');
      } catch (sessionStorageError) {
        console.warn('⚠️ Failed to clear sessionStorage:', sessionStorageError);
      }
      
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