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
    onDeliveryInfoChange(newInfo);
    console.log('onDeliveryInfoChange called with newInfo');
  };

  // Pre-fill with data - but ONLY if the current storage is empty
  useEffect(() => {
    console.log('=== useCheckoutFlow pre-fill effect ===');
    console.log('Current customerInfo:', customerInfo);
    console.log('Current addressInfo:', addressInfo);
    
    // Check for group order data
    const originalGroupOrderData = localStorage.getItem('originalGroupOrderData');
    const groupOrderJoinDecision = localStorage.getItem('groupOrderJoinDecision');
    
    // For add-to-order flow, save the original info for change tracking
    if (isAddingToOrder && lastOrderInfo) {
      setOriginalOrderInfo(lastOrderInfo);
      console.log('Set original order info for add-to-order flow:', lastOrderInfo);
    }
    
    // Pre-fill delivery date and time for new users or when empty
    if (!deliveryInfo.date || !deliveryInfo.timeSlot) {
      let sourceData = null;
      
      // If joining a group order, use the original group order data for EXACT matching
      if (groupOrderJoinDecision === 'yes' && originalGroupOrderData) {
        try {
          const groupData = JSON.parse(originalGroupOrderData);
          console.log('Using original group order data for exact matching:', groupData);
          sourceData = {
            deliveryDate: groupData.deliveryDate,
            deliveryTime: groupData.deliveryTime,
            deliveryAddress: groupData.deliveryAddress
          };
          
          // Pre-fill address info for group orders
          if (groupData.deliveryAddress) {
            const addr = groupData.deliveryAddress;
            setAddressInfo({
              street: addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              zipCode: addr.zipCode || '',
              instructions: addr.instructions || ''
            });
          }
        } catch (error) {
          console.error('Error parsing group order data:', error);
        }
      }
      
      // Fallback to regular order data
      if (!sourceData) {
        const draftOrder = JSON.parse(localStorage.getItem('partyondelivery_last_order') || '{}');
        console.log('draftOrder for delivery info:', draftOrder);
        sourceData = (isAddingToOrder && lastOrderInfo?.recentpurchase) ? lastOrderInfo : draftOrder;
      }
      
      if (sourceData?.deliveryDate && sourceData?.deliveryTime) {
        try {
          const savedDate = new Date(sourceData.deliveryDate);
          const now = new Date();
          
          // For group orders, always use the exact date/time (don't check if future)
          // For regular orders, only prefill if in the future
          const shouldPrefill = groupOrderJoinDecision === 'yes' || 
            (!isNaN(savedDate.getTime()) && savedDate > now);
          
          if (shouldPrefill) {
            console.log('Pre-filling delivery date:', savedDate);
            updateDeliveryInfo('date', savedDate);
            
            if (sourceData.deliveryTime) {
              console.log('Pre-filling delivery time:', sourceData.deliveryTime);
              updateDeliveryInfo('timeSlot', sourceData.deliveryTime);
            }
          } else {
            console.log('Saved date/time is in the past, forcing user to select new date/time');
          }
        } catch (error) {
          console.error('Error parsing delivery date:', error);
        }
      } else {
        console.log('No saved delivery data, user must select date/time');
      }
    }
    
    // Always start at datetime step for proper flow
    setCurrentStep('datetime');
    setConfirmedDateTime(false);
    setConfirmedAddress(false);
    setConfirmedCustomer(false);
    
    console.log('=== End useCheckoutFlow pre-fill ===');
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