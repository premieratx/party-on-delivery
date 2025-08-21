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
      
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
      console.log('Checkout state saved:', stateWithTimestamp);
    } catch (error) {
      console.error('Failed to save checkout state:', error);
    }
  };

  const getCheckoutState = (): Partial<CheckoutState> | null => {
    try {
      const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if expired
      if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load checkout state:', error);
      return null;
    }
  };

  const clearCheckoutState = () => {
    try {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      console.log('Checkout state cleared');
    } catch (error) {
      console.error('Failed to clear checkout state:', error);
    }
  };

  return {
    saveCheckoutState,
    getCheckoutState,
    clearCheckoutState
  };
}