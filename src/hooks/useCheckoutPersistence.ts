import { useState, useEffect } from 'react';
import { DeliveryInfo } from '@/components/DeliveryWidget';
import { CustomerInfo, AddressInfo } from './useCustomerInfo';

interface CheckoutState {
  deliveryInfo: DeliveryInfo;
  customerInfo: CustomerInfo;
  addressInfo: AddressInfo;
  tipPercentage: number;
  appliedDiscount?: {
    code: string;
    type: 'percentage' | 'free_shipping';
    value: number;
  } | null;
  currentStep: 'datetime' | 'address' | 'payment';
  confirmedDateTime: boolean;
  confirmedAddress: boolean;
  confirmedCustomer: boolean;
}

const CHECKOUT_STORAGE_KEY = 'partyondelivery_checkout_state';
const STORAGE_EXPIRY_HOURS = 24; // 24 hours

export function useCheckoutPersistence() {
  const saveCheckoutState = (state: Partial<CheckoutState>) => {
    try {
      const existingData = getCheckoutState();
      const mergedState = { ...existingData, ...state };
      const stateWithTimestamp = {
        ...mergedState,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + STORAGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
      };
      
      // Try localStorage first, fallback to sessionStorage for incognito mode
      try {
        localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
        console.log('✅ Checkout state saved to localStorage:', stateWithTimestamp);
      } catch (localStorageError) {
        console.warn('⚠️ localStorage failed, using sessionStorage for incognito mode:', localStorageError);
        sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
        console.log('✅ Checkout state saved to sessionStorage:', stateWithTimestamp);
      }
    } catch (error) {
      console.error('❌ Failed to save checkout state completely:', error);
    }
  };

  const getCheckoutState = (): Partial<CheckoutState> | null => {
    try {
      // Try localStorage first, fallback to sessionStorage for incognito mode
      let stored: string | null = null;
      let storageType = 'localStorage';
      
      try {
        stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      } catch (localStorageError) {
        console.warn('⚠️ localStorage read failed, trying sessionStorage:', localStorageError);
        try {
          stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
          storageType = 'sessionStorage';
        } catch (sessionStorageError) {
          console.error('❌ Both storage methods failed:', sessionStorageError);
          return null;
        }
      }
      
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if expired
      if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
        try {
          if (storageType === 'localStorage') {
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
          } else {
            sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
          }
        } catch (error) {
          console.warn('Failed to remove expired data:', error);
        }
        return null;
      }

      console.log(`✅ Checkout state loaded from ${storageType}:`, data);
      return data;
    } catch (error) {
      console.error('❌ Failed to load checkout state:', error);
      return null;
    }
  };

  const clearCheckoutState = () => {
    try {
      // Clear from both storage mechanisms to be safe
      try {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        console.log('✅ Checkout state cleared from localStorage');
      } catch (localStorageError) {
        console.warn('⚠️ Failed to clear localStorage:', localStorageError);
      }
      
      try {
        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        console.log('✅ Checkout state cleared from sessionStorage');
      } catch (sessionStorageError) {
        console.warn('⚠️ Failed to clear sessionStorage:', sessionStorageError);
      }
    } catch (error) {
      console.error('❌ Failed to clear checkout state:', error);
    }
  };

  return {
    saveCheckoutState,
    getCheckoutState,
    clearCheckoutState
  };
}