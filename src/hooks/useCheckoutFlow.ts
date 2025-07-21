import { useState, useEffect } from 'react';
import { DeliveryInfo } from '@/components/DeliveryWidget';
import { useCustomerInfo } from './useCustomerInfo';

interface UseCheckoutFlowProps {
  isAddingToOrder: boolean;
  lastOrderInfo: any;
  deliveryInfo: DeliveryInfo;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
}

export function useCheckoutFlow({ isAddingToOrder, lastOrderInfo, deliveryInfo, onDeliveryInfoChange }: UseCheckoutFlowProps) {
  const { customerInfo, addressInfo, setAddressInfo, setCustomerInfo } = useCustomerInfo();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'datetime' | 'address' | 'customer' | 'payment'>('datetime');
  const [confirmedDateTime, setConfirmedDateTime] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(false);
  const [confirmedCustomer, setConfirmedCustomer] = useState(false);
  
  // Change tracking for "add to order" flow
  const [originalOrderInfo, setOriginalOrderInfo] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: any) => {
    const newInfo = { ...deliveryInfo, [field]: value };
    onDeliveryInfoChange(newInfo);
  };

  // Pre-fill with data prioritizing completed order info over draft
  useEffect(() => {
    // Get draft order data from localStorage
    const draftOrder = JSON.parse(localStorage.getItem('partyondelivery_last_order') || '{}');
    
    // Determine the source of truth: completed order (lastOrderInfo) or draft order
    const sourceData = (isAddingToOrder && lastOrderInfo?.recentpurchase) ? lastOrderInfo : draftOrder;
    
    console.log('=== useCheckoutFlow pre-fill ===');
    console.log('isAddingToOrder:', isAddingToOrder);
    console.log('lastOrderInfo:', lastOrderInfo);
    console.log('draftOrder:', draftOrder);
    console.log('sourceData chosen:', sourceData);
    
    if (sourceData && Object.keys(sourceData).length > 0) {
      console.log('Pre-filling from source data:', sourceData);
      
      // For add-to-order flow, save the original info for change tracking
      if (isAddingToOrder && lastOrderInfo) {
        setOriginalOrderInfo(lastOrderInfo);
      }
      
      // Pre-fill delivery date and time (for add-to-order flow, use completed order data)
      if (isAddingToOrder && sourceData.deliveryDate) {
        try {
          const date = new Date(sourceData.deliveryDate);
          if (!isNaN(date.getTime())) {
            updateDeliveryInfo('date', date);
          }
        } catch (error) {
          console.error('Error parsing delivery date:', error);
        }
      }
      
      if (isAddingToOrder && sourceData.deliveryTime) {
        updateDeliveryInfo('timeSlot', sourceData.deliveryTime);
      }
      
      // ALWAYS pre-fill address (prioritize completed order for add-to-order)
      if (sourceData.address) {
        const addressParts = sourceData.address.split(',').map(part => part.trim());
        setAddressInfo({
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2]?.split(' ')[0] || '',
          zipCode: addressParts[2]?.split(' ')[1] || '',
          instructions: sourceData.instructions || ''
        });
      }
      
      // ALWAYS pre-fill customer info (prioritize completed order for add-to-order)
      if (sourceData.customerName || sourceData.customerEmail) {
        const nameParts = sourceData.customerName?.split(' ') || [];
        setCustomerInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: sourceData.customerEmail || '',
          phone: sourceData.customerPhone || ''
        });
      }
    }
    
    // Always start at datetime step
    setCurrentStep('datetime');
  }, [isAddingToOrder, lastOrderInfo]); // React to changes in these props

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
    
    // Helpers
    updateDeliveryInfo,
    isDateTimeComplete,
    isAddressComplete,
    isCustomerComplete
  };
}