import { useState, useEffect } from 'react';
import { cacheManager } from '@/utils/cacheManager';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions: string;
}

// Helper to get data from multiple sources with fallback
function getStoredData<T>(primaryKey: string, backupKey: string, initialValue: T): T {
  try {
    // Try primary localStorage first
    const primary = localStorage.getItem(primaryKey);
    if (primary && primary !== 'null' && primary !== 'undefined') {
      const parsed = JSON.parse(primary);
      // Check if it has meaningful data (not just empty strings)
      if (typeof parsed === 'object' && parsed && Object.values(parsed).some(v => v && v !== '')) {
        console.log(`Found data in primary storage ${primaryKey}:`, parsed);
        return parsed;
      }
    }

    // Try cache manager backup
    const backup = cacheManager.get<T>(backupKey);
    if (backup && typeof backup === 'object' && Object.values(backup).some(v => v && v !== '')) {
      console.log(`Found data in backup storage ${backupKey}:`, backup);
      // Save back to primary for consistency
      localStorage.setItem(primaryKey, JSON.stringify(backup));
      return backup;
    }

    // Try to extract from last order
    const lastOrder = localStorage.getItem('partyondelivery_last_order');
    if (lastOrder) {
      const orderData = JSON.parse(lastOrder);
      if (primaryKey === 'partyondelivery_address' && orderData.address) {
        const addressParts = orderData.address.split(',').map(p => p.trim());
        const stateParts = addressParts[2]?.split(' ') || [];
        const extractedAddress = {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: stateParts[0] || '',
          zipCode: stateParts[1] || '',
          instructions: orderData.instructions || ''
        } as T;
        console.log(`Extracted address from last order:`, extractedAddress);
        return extractedAddress;
      }
      if (primaryKey === 'partyondelivery_customer' && (orderData.customerName || orderData.customerEmail)) {
        const nameParts = orderData.customerName?.split(' ') || [];
        const extractedCustomer = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: orderData.customerEmail || '',
          phone: orderData.customerPhone || ''
        } as T;
        console.log(`Extracted customer from last order:`, extractedCustomer);
        return extractedCustomer;
      }
    }

    return initialValue;
  } catch (error) {
    console.warn(`Error retrieving data for ${primaryKey}:`, error);
    return initialValue;
  }
}

export function useCustomerInfo() {
  // Initialize with comprehensive data loading
  const [customerInfo, setCustomerInfoState] = useState<CustomerInfo>(() => 
    getStoredData('partyondelivery_customer', 'customer_backup', {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    })
  );

  const [addressInfo, setAddressInfoState] = useState<AddressInfo>(() => 
    getStoredData('partyondelivery_address', 'address_backup', {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: ''
    })
  );

  // Enhanced setters that persist to multiple locations
  const setCustomerInfo = (info: CustomerInfo | ((prev: CustomerInfo) => CustomerInfo)) => {
    const newInfo = typeof info === 'function' ? info(customerInfo) : info;
    console.log('Setting customer info:', newInfo);
    
    setCustomerInfoState(newInfo);
    
    // Persist to multiple locations
    try {
      localStorage.setItem('partyondelivery_customer', JSON.stringify(newInfo));
      cacheManager.set('customer_backup', newInfo, 24 * 60); // 24 hour backup
      
      // Also update the comprehensive order storage
      const existingOrder = JSON.parse(localStorage.getItem('partyondelivery_last_order') || '{}');
      const updatedOrder = {
        ...existingOrder,
        customerName: newInfo.firstName && newInfo.lastName ? `${newInfo.firstName} ${newInfo.lastName}`.trim() : existingOrder.customerName,
        customerEmail: newInfo.email || existingOrder.customerEmail,
        customerPhone: newInfo.phone || existingOrder.customerPhone,
        recentpurchase: true
      };
      localStorage.setItem('partyondelivery_last_order', JSON.stringify(updatedOrder));
    } catch (error) {
      console.warn('Failed to persist customer info:', error);
    }
  };

  const setAddressInfo = (info: AddressInfo | ((prev: AddressInfo) => AddressInfo)) => {
    const newInfo = typeof info === 'function' ? info(addressInfo) : info;
    console.log('Setting address info:', newInfo);
    
    setAddressInfoState(newInfo);
    
    // Persist to multiple locations
    try {
      localStorage.setItem('partyondelivery_address', JSON.stringify(newInfo));
      cacheManager.set('address_backup', newInfo, 24 * 60); // 24 hour backup
      
      // Also update the comprehensive order storage
      const existingOrder = JSON.parse(localStorage.getItem('partyondelivery_last_order') || '{}');
      const fullAddress = newInfo.street && newInfo.city && newInfo.state && newInfo.zipCode 
        ? `${newInfo.street}, ${newInfo.city}, ${newInfo.state} ${newInfo.zipCode}`
        : existingOrder.address;
      
      const updatedOrder = {
        ...existingOrder,
        address: fullAddress,
        instructions: newInfo.instructions || existingOrder.instructions,
        recentpurchase: true
      };
      localStorage.setItem('partyondelivery_last_order', JSON.stringify(updatedOrder));
    } catch (error) {
      console.warn('Failed to persist address info:', error);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('useCustomerInfo - Current state:');
    console.log('customerInfo:', customerInfo);
    console.log('addressInfo:', addressInfo);
  }, [customerInfo, addressInfo]);

  return {
    customerInfo,
    setCustomerInfo,
    addressInfo,
    setAddressInfo
  };
}