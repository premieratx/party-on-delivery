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
    console.log(`Updating delivery info: ${field} =`, value);
    const newInfo = { ...deliveryInfo, [field]: value };
    console.log('New delivery info:', newInfo);
    onDeliveryInfoChange(newInfo);
  };

  // CENTRALIZED PRE-FILL LOGIC
  useEffect(() => {
    console.log('=== useCheckoutFlow Pre-fill Logic ===');
    console.log('isAddingToOrder:', isAddingToOrder);
    console.log('lastOrderInfo:', lastOrderInfo);
    console.log('deliveryInfo:', deliveryInfo);
    console.log('addressInfo:', addressInfo);
    console.log('customerInfo:', customerInfo);

    if (isAddingToOrder && lastOrderInfo) {
      console.log('Processing ADD TO ORDER pre-fill...');
      setOriginalOrderInfo(lastOrderInfo);
      
      // Pre-fill delivery date and time (force override)
      if (lastOrderInfo.deliveryDate) {
        console.log('Pre-filling delivery date:', lastOrderInfo.deliveryDate);
        try {
          const date = new Date(lastOrderInfo.deliveryDate);
          if (!isNaN(date.getTime())) {
            updateDeliveryInfo('date', date);
          }
        } catch (error) {
          console.error('Error parsing delivery date:', error);
        }
      }
      
      if (lastOrderInfo.deliveryTime) {
        console.log('Pre-filling delivery time:', lastOrderInfo.deliveryTime);
        updateDeliveryInfo('timeSlot', lastOrderInfo.deliveryTime);
      }
      
      // Pre-fill address info
      if (lastOrderInfo.address) {
        console.log('Pre-filling address:', lastOrderInfo.address);
        const addressParts = lastOrderInfo.address.split(',').map(part => part.trim());
        const newAddressInfo = {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2]?.split(' ')[0] || '',
          zipCode: addressParts[2]?.split(' ')[1] || '',
          instructions: lastOrderInfo.instructions || ''
        };
        setAddressInfo(newAddressInfo);
        updateDeliveryInfo('address', lastOrderInfo.address);
        updateDeliveryInfo('instructions', lastOrderInfo.instructions || '');
      }
      
      // Pre-fill customer info
      if (lastOrderInfo.customerEmail) {
        console.log('Pre-filling customer info:', lastOrderInfo.customerEmail);
        const nameParts = lastOrderInfo.customerName?.split(' ') || [];
        setCustomerInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: lastOrderInfo.customerEmail || '',
          phone: lastOrderInfo.customerPhone || ''
        });
      }
      
      // For resume orders, start at datetime step to allow confirmation
      setCurrentStep('datetime');
      
    } else if (!isAddingToOrder && lastOrderInfo) {
      console.log('Processing NEW ORDER with saved info pre-fill...');
      
      // Always pre-fill address from saved info if available and not already filled
      if (lastOrderInfo.address && (!addressInfo.street || !deliveryInfo.address)) {
        console.log('Pre-filling address from saved order:', lastOrderInfo.address);
        const addressParts = lastOrderInfo.address.split(',').map(part => part.trim());
        const newAddressInfo = {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2]?.split(' ')[0] || '',
          zipCode: addressParts[2]?.split(' ')[1] || '',
          instructions: lastOrderInfo.instructions || ''
        };
        setAddressInfo(newAddressInfo);
        updateDeliveryInfo('address', lastOrderInfo.address);
        updateDeliveryInfo('instructions', lastOrderInfo.instructions || '');
      }
      
      // Always pre-fill customer info from saved order if current info is empty
      if (lastOrderInfo.customerEmail && (!customerInfo.email || (!customerInfo.firstName && !customerInfo.lastName))) {
        console.log('Pre-filling customer info from saved order:', lastOrderInfo.customerEmail);
        const nameParts = lastOrderInfo.customerName?.split(' ') || [];
        setCustomerInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: lastOrderInfo.customerEmail || '',
          phone: lastOrderInfo.customerPhone || ''
        });
      }
      
      // Start at datetime step (require manual confirmation)
      setCurrentStep('datetime');
      
    } else if (!isAddingToOrder) {
      console.log('Processing NEW ORDER without saved order info...');
      
      // Pre-fill address from localStorage data only
      if (addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
        const fullAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
        updateDeliveryInfo('address', fullAddress);
        updateDeliveryInfo('instructions', addressInfo.instructions || '');
      }
      
      // Start at datetime step
      setCurrentStep('datetime');
    }
    
    console.log('=== End useCheckoutFlow Pre-fill Logic ===');
  }, [isAddingToOrder, lastOrderInfo]);

  // Additional effect to ensure pre-filling works when localStorage data is available
  useEffect(() => {
    // If we have lastOrderInfo but address/customer info is still empty, try pre-filling again
    if (lastOrderInfo && lastOrderInfo.address && !deliveryInfo.address) {
      console.log('Re-attempting address pre-fill from lastOrderInfo:', lastOrderInfo.address);
      const addressParts = lastOrderInfo.address.split(',').map(part => part.trim());
      const newAddressInfo = {
        street: addressParts[0] || '',
        city: addressParts[1] || '',
        state: addressParts[2]?.split(' ')[0] || '',
        zipCode: addressParts[2]?.split(' ')[1] || '',
        instructions: lastOrderInfo.instructions || ''
      };
      setAddressInfo(newAddressInfo);
      updateDeliveryInfo('address', lastOrderInfo.address);
      updateDeliveryInfo('instructions', lastOrderInfo.instructions || '');
    }

    if (lastOrderInfo && lastOrderInfo.customerEmail && !customerInfo.email) {
      console.log('Re-attempting customer info pre-fill from lastOrderInfo:', lastOrderInfo.customerEmail);
      const nameParts = lastOrderInfo.customerName?.split(' ') || [];
      setCustomerInfo({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: lastOrderInfo.customerEmail || '',
        phone: lastOrderInfo.customerPhone || ''
      });
    }
  }, [lastOrderInfo, deliveryInfo.address, customerInfo.email]);

  // Update delivery info when address changes
  useEffect(() => {
    if (addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
      const fullAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
      updateDeliveryInfo('address', fullAddress);
      updateDeliveryInfo('instructions', addressInfo.instructions || '');
    }
  }, [addressInfo.street, addressInfo.city, addressInfo.state, addressInfo.zipCode, addressInfo.instructions]);

  // Check for changes from original order
  useEffect(() => {
    if (originalOrderInfo && isAddingToOrder) {
      const changes: string[] = [];
      
      // Check address changes
      const currentAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}`;
      if (currentAddress !== originalOrderInfo.address && addressInfo.street && addressInfo.city && addressInfo.state && addressInfo.zipCode) {
        changes.push('delivery address');
      }
      
      // Check date changes
      if (deliveryInfo.date && originalOrderInfo.deliveryDate) {
        const originalDate = new Date(originalOrderInfo.deliveryDate).toDateString();
        const currentDate = deliveryInfo.date.toDateString();
        if (originalDate !== currentDate) {
          changes.push('delivery date');
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