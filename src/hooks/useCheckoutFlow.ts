import { useState, useEffect } from 'react';
import { DeliveryInfo } from '@/components/DeliveryWidget';
import { useCustomerInfo } from './useCustomerInfo';

interface UseCheckoutFlowProps {
  isAddingToOrder: boolean;
  lastOrderInfo: any;
  deliveryInfo: DeliveryInfo;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  affiliateCode?: string;
}

export function useCheckoutFlow({ isAddingToOrder, lastOrderInfo, deliveryInfo, onDeliveryInfoChange, affiliateCode }: UseCheckoutFlowProps) {
  const { customerInfo, addressInfo, setAddressInfo, setCustomerInfo } = useCustomerInfo();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'datetime' | 'address' | 'payment'>('datetime');
  const [confirmedDateTime, setConfirmedDateTime] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(false);
  const [confirmedCustomer, setConfirmedCustomer] = useState(false);
  
  // Change tracking for "add to order" flow
  const [originalOrderInfo, setOriginalOrderInfo] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: any) => {
    console.log('🔄 updateDeliveryInfo called with:', { field, value });
    console.log('Current deliveryInfo:', deliveryInfo);
    const newInfo = { ...deliveryInfo, [field]: value };
    console.log('New deliveryInfo will be:', newInfo);
    console.log('🔄 About to call onDeliveryInfoChange...');
    onDeliveryInfoChange(newInfo);
    console.log('🔄 onDeliveryInfoChange completed');
    
    // Add a timeout to check if the state actually updated
    setTimeout(() => {
      console.log('🔄 State check after update - deliveryInfo:', deliveryInfo);
    }, 100);
  };

  // Pre-fill with group order data
  useEffect(() => {
    console.log('=== useCheckoutFlow pre-fill effect ===');
    
    // Check for group order prefill data
    const prefillData = localStorage.getItem('prefill_delivery_data');
    if (prefillData) {
      try {
        const parsed = JSON.parse(prefillData);
        console.log('🔗 PREFILLING delivery info from group order:', parsed);
        
        // Update delivery date and time
        if (parsed.date) {
          updateDeliveryInfo('date', new Date(parsed.date));
        }
        if (parsed.timeSlot) {
          updateDeliveryInfo('timeSlot', parsed.timeSlot);
        }
        
        // Mark datetime as confirmed if we have both
        if (parsed.date && parsed.timeSlot) {
          setConfirmedDateTime(true);
        }
        
        // Clear prefill data after using it
        localStorage.removeItem('prefill_delivery_data');
      } catch (error) {
        console.error('Error parsing prefill delivery data:', error);
      }
    }
    
    // For add-to-order flow, save the original info for change tracking
    if (isAddingToOrder && lastOrderInfo) {
      setOriginalOrderInfo(lastOrderInfo);
      console.log('Set original order info for add-to-order flow:', lastOrderInfo);
    }
  }, []); // Remove dependency to prevent infinite loops - run once on mount

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