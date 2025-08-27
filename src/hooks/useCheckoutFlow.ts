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
  
  // Step management with auto-progression - load from storage
  const [currentStep, setCurrentStep] = useState<'datetime' | 'address' | 'payment'>(() => {
    const saved = getCheckoutState();
    return saved?.currentStep || 'datetime';
  });
  
  const [confirmedDateTime, setConfirmedDateTime] = useState(() => {
    const saved = getCheckoutState();
    return saved?.confirmedDateTime || false;
  });
  
  const [confirmedAddress, setConfirmedAddress] = useState(() => {
    const saved = getCheckoutState();
    return saved?.confirmedAddress || false;
  });
  
  const [confirmedCustomer, setConfirmedCustomer] = useState(() => {
    const saved = getCheckoutState();
    return saved?.confirmedCustomer || false;
  });

  // Auto-advance to next step when previous step is confirmed - with safeguards
  useEffect(() => {
    console.log('🔄 Step progression check:', { 
      confirmedDateTime, 
      confirmedAddress, 
      confirmedCustomer,
      currentStep,
      shouldGoToAddress: confirmedDateTime && !confirmedAddress && currentStep === 'datetime',
      shouldGoToPayment: confirmedDateTime && confirmedAddress && confirmedCustomer && currentStep !== 'payment'
    });
    
    // Only auto-advance if user has manually confirmed previous steps
    if (confirmedDateTime && !confirmedAddress && currentStep === 'datetime') {
      console.log('✅ Moving to address step');
      setCurrentStep('address');
    } else if (confirmedDateTime && confirmedAddress && confirmedCustomer && currentStep !== 'payment') {
      console.log('✅ Moving to payment step');
      setCurrentStep('payment');
    }
  }, [confirmedDateTime, confirmedAddress, confirmedCustomer, currentStep]);
  
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

  // Save checkout state whenever key values change
  useEffect(() => {
    saveCheckoutState({
      currentStep,
      confirmedDateTime,
      confirmedAddress,
      confirmedCustomer,
      deliveryInfo,
      customerInfo,
      addressInfo
    });
  }, [currentStep, confirmedDateTime, confirmedAddress, confirmedCustomer, deliveryInfo, customerInfo, addressInfo]);

  // Validation helpers
  const isDateTimeComplete = deliveryInfo.date && deliveryInfo.timeSlot;
  // CRITICAL: Always allow address progression - handle verification on backend
  const isAddressComplete = true; // Always true - customers can enter ANY address format
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