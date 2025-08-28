import { useState, useEffect } from 'react';
import { DeliveryInfo } from '@/components/DeliveryWidget';
import { useCustomerInfo } from './useCustomerInfo';
import { useCheckoutPersistence } from './useCheckoutPersistence';

interface UseCheckoutFlowProps {
  isAddingToOrder: boolean;
  lastOrderInfo: any;
  deliveryInfo: DeliveryInfo;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  affiliateCode?: string;
}

export function useCheckoutFlow({ isAddingToOrder, lastOrderInfo, deliveryInfo, onDeliveryInfoChange, affiliateCode }: UseCheckoutFlowProps) {
  const { customerInfo, addressInfo, setAddressInfo, setCustomerInfo } = useCustomerInfo();
  const { saveCheckoutState, getCheckoutState } = useCheckoutPersistence();
  
  // Step management - ALWAYS start at datetime step, NEVER auto-confirm
  const [currentStep, setCurrentStep] = useState<'datetime' | 'address' | 'payment'>('datetime');
  
  // REMOVED: All confirmation state - this was causing the lockout
  // confirmedDateTime, confirmedAddress, confirmedCustomer states REMOVED
  // These states were preventing users from editing their information
  
  const [confirmedDateTime] = useState(false); // Always false - never lock
  const [confirmedAddress] = useState(false);  // Always false - never lock  
  const [confirmedCustomer] = useState(false); // Always false - never lock
  
  // Provide setters that accept parameters but do nothing (for compatibility)
  const setConfirmedDateTime = (_value?: boolean) => { 
    console.log('🔓 DateTime confirmation disabled - inputs stay editable'); 
  };
  const setConfirmedAddress = (_value?: boolean) => { 
    console.log('🔓 Address confirmation disabled - inputs stay editable'); 
  };
  const setConfirmedCustomer = (_value?: boolean) => { 
    console.log('🔓 Customer confirmation disabled - inputs stay editable'); 
  };

  // REMOVED: Auto-advance lockout logic - users control their own flow
  useEffect(() => {
    console.log('🚫 Auto-advance lockout system DISABLED');
    console.log('✅ Users can now freely navigate between steps without being locked out');
    // REMOVED: All auto-progression logic that was locking users between steps
  }, []);
  
  // Change tracking for "add to order" flow
  const [originalOrderInfo, setOriginalOrderInfo] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: any) => {
    const newInfo = { ...deliveryInfo, [field]: value };
    onDeliveryInfoChange(newInfo);
  };

  // Pre-fill with group order data
  // Simplified prefill - only run once on mount
  useEffect(() => {
    // For add-to-order flow, save the original info for change tracking
    if (isAddingToOrder && lastOrderInfo) {
      setOriginalOrderInfo(lastOrderInfo);
    }
  }, []);

  // Update delivery info when address changes
  useEffect(() => {
    if (addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
      const fullAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
      updateDeliveryInfo('address', fullAddress);
      updateDeliveryInfo('instructions', addressInfo.instructions || '');
    }
  }, [addressInfo.street, addressInfo.city, addressInfo.state, addressInfo.zipCode, addressInfo.instructions]);

  // Check for changes from original order (only for add-to-order flow)
  useEffect(() => {
    if (originalOrderInfo && isAddingToOrder) {
      const changes: string[] = [];
      
      // Check address changes
      const currentAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
      if (currentAddress !== originalOrderInfo.address && addressInfo.street) {
        changes.push('delivery address');
      }
      
      // Check date changes - safely handle date objects
      if (deliveryInfo.date && originalOrderInfo.deliveryDate) {
        try {
          const originalDate = new Date(originalOrderInfo.deliveryDate).toDateString();
          const currentDate = deliveryInfo.date instanceof Date 
            ? deliveryInfo.date.toDateString() 
            : new Date(deliveryInfo.date).toDateString();
          if (originalDate !== currentDate) {
            changes.push('delivery date');
          }
        } catch (error) {
          console.error('Error comparing dates:', error);
        }
      }
      
      // Check time changes
      if (deliveryInfo.timeSlot && originalOrderInfo.deliveryTime) {
        if (deliveryInfo.timeSlot !== originalOrderInfo.deliveryTime) {
          changes.push('delivery time');
        }
      }
      
      setChangedFields(changes);
      setHasChanges(changes.length > 0);
    }
  }, [addressInfo, deliveryInfo.date, deliveryInfo.timeSlot, originalOrderInfo, isAddingToOrder]);

  // Save checkout state - REMOVED confirmation states
  useEffect(() => {
    saveCheckoutState({
      currentStep,
      // REMOVED: confirmedDateTime, confirmedAddress, confirmedCustomer
      // These confirmation states were causing the lockout issue
      deliveryInfo,
      customerInfo,
      addressInfo
    });
  }, [currentStep, deliveryInfo, customerInfo, addressInfo, saveCheckoutState]);

  // Validation helpers
  const isDateTimeComplete = deliveryInfo.date && deliveryInfo.timeSlot;
  const isAddressComplete = addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode;
  const isCustomerComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.phone && customerInfo.email;

  return {
    // State
    currentStep,
    setCurrentStep,
    confirmedDateTime,
    setConfirmedDateTime,
    confirmedAddress,
    setConfirmedAddress,
    confirmedCustomer,
    setConfirmedCustomer,
    originalOrderInfo,
    hasChanges,
    changedFields,
    affiliateCode,
    
    // Helpers
    updateDeliveryInfo,
    isDateTimeComplete,
    isAddressComplete,
    isCustomerComplete
  };
}