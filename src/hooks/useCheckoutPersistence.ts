import { useState, useEffect } from 'react';
import { DeliveryInfo } from '@/components/DeliveryWidget';
import { CustomerInfo, AddressInfo } from './useCustomerInfo';
import { checkoutStorage } from '@/utils/universalStorage';

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
  // REMOVED: confirmedDateTime, confirmedAddress, confirmedCustomer - these caused lockouts
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
      
      // Use universal storage for bulletproof saving
      checkoutStorage.saveCheckoutState(stateWithTimestamp);
      console.log('✅ Checkout state saved universally:', stateWithTimestamp);
    } catch (error) {
      console.error('❌ Failed to save checkout state:', error);
    }
  };

  const getCheckoutState = (): Partial<CheckoutState> | null => {
    try {
      // Use universal storage for bulletproof loading
      const data = checkoutStorage.loadCheckoutState();
      
      if (!data) return null;

      // Check if expired
      if (data && typeof data === 'object' && 'expiresAt' in data && data.expiresAt && new Date() > new Date(data.expiresAt as string)) {
        checkoutStorage.clearAll();
        return null;
      }

      console.log('✅ Checkout state loaded universally:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to load checkout state:', error);
      return null;
    }
  };

  const clearCheckoutState = () => {
    try {
      // Use universal storage for bulletproof clearing
      checkoutStorage.clearAll();
      console.log('✅ Checkout state cleared universally');
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