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

export interface CompletedOrderInfo {
  address: string;
  instructions: string;
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber?: string;
  orderId?: string;
  total?: number;
  recentpurchase: boolean;
  completedAt: string;
  expiresAt: string; // 30 days from completion
}

// Create a persistent customer data manager
class CustomerDataManager {
  private static instance: CustomerDataManager;
  
  public static getInstance(): CustomerDataManager {
    if (!CustomerDataManager.instance) {
      CustomerDataManager.instance = new CustomerDataManager();
    }
    return CustomerDataManager.instance;
  }

  // Save customer data with 30-day expiration
  saveCustomerData(customerInfo: CustomerInfo, addressInfo: AddressInfo): void {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
    
    const customerData = {
      ...customerInfo,
      savedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    const addressData = {
      ...addressInfo,
      savedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    try {
      // Save to multiple locations with debouncing for performance
      localStorage.setItem('partyondelivery_customer_persistent', JSON.stringify(customerData));
      localStorage.setItem('partyondelivery_address_persistent', JSON.stringify(addressData));
      
      // Use async cache updates to improve performance
      requestAnimationFrame(() => {
        cacheManager.set('customer_persistent', customerData, 30 * 24 * 60); // 30 days
        cacheManager.set('address_persistent', addressData, 30 * 24 * 60); // 30 days
      });
      
      console.log('Customer data saved with 30-day expiration');
    } catch (error) {
      console.error('Failed to save customer data:', error);
    }
  }

  // Load customer data if not expired
  loadCustomerData(): { customerInfo: CustomerInfo; addressInfo: AddressInfo } | null {
    try {
      // Try primary storage first
      const customerData = localStorage.getItem('partyondelivery_customer_persistent');
      const addressData = localStorage.getItem('partyondelivery_address_persistent');
      
      if (customerData && addressData) {
        const customer = JSON.parse(customerData);
        const address = JSON.parse(addressData);
        
        // Check if expired
        if (customer.expiresAt && new Date() < new Date(customer.expiresAt)) {
          console.log('Loading persistent customer data:', { customer, address });
          return {
            customerInfo: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              email: customer.email
            },
            addressInfo: {
              street: address.street,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode,
              instructions: address.instructions
            }
          };
        } else {
          console.log('Persistent customer data expired, clearing...');
          this.clearExpiredData();
        }
      }
      
      // Try cache manager backup
      const cachedCustomer = cacheManager.get<any>('customer_persistent');
      const cachedAddress = cacheManager.get<any>('address_persistent');
      
      if (cachedCustomer && cachedAddress) {
        if (cachedCustomer.expiresAt && new Date() < new Date(cachedCustomer.expiresAt)) {
          console.log('Loading cached persistent customer data');
          return {
            customerInfo: {
              firstName: cachedCustomer.firstName,
              lastName: cachedCustomer.lastName,
              phone: cachedCustomer.phone,
              email: cachedCustomer.email
            },
            addressInfo: {
              street: cachedAddress.street,
              city: cachedAddress.city,
              state: cachedAddress.state,
              zipCode: cachedAddress.zipCode,
              instructions: cachedAddress.instructions
            }
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load customer data:', error);
      return null;
    }
  }

  // Save completed order with delivery expiration logic
  saveCompletedOrder(orderInfo: CompletedOrderInfo): void {
    const now = new Date();
    const deliveryDate = new Date(orderInfo.deliveryDate);
    
    // Keep order data until delivery date + 7 days
    const expiresAt = new Date(deliveryDate);
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const completedOrder = {
      ...orderInfo,
      completedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    try {
      localStorage.setItem('partyondelivery_completed_order', JSON.stringify(completedOrder));
      cacheManager.set('completed_order', completedOrder, 24 * 60); // 24 hours cache
      
      console.log('Completed order saved until delivery + 7 days:', completedOrder);
    } catch (error) {
      console.error('Failed to save completed order:', error);
    }
  }

  // Load completed order if delivery hasn't passed
  loadCompletedOrder(): CompletedOrderInfo | null {
    try {
      const orderData = localStorage.getItem('partyondelivery_completed_order');
      if (orderData) {
        const order = JSON.parse(orderData);
        
        // Check if delivery date has passed + 7 days
        if (order.expiresAt && new Date() < new Date(order.expiresAt)) {
          console.log('Loading valid completed order:', order);
          return order;
        } else {
          console.log('Completed order expired, clearing...');
          localStorage.removeItem('partyondelivery_completed_order');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load completed order:', error);
      return null;
    }
  }

  private clearExpiredData(): void {
    try {
      localStorage.removeItem('partyondelivery_customer_persistent');
      localStorage.removeItem('partyondelivery_address_persistent');
      cacheManager.remove('customer_persistent');
      cacheManager.remove('address_persistent');
    } catch (error) {
      console.error('Failed to clear expired data:', error);
    }
  }
}

const customerDataManager = CustomerDataManager.getInstance();

// Helper to get data from multiple sources with fallback
function getStoredData<T>(primaryKey: string, backupKey: string, initialValue: T): T {
  try {
    // First try to load persistent data (30-day storage)
    const persistentData = customerDataManager.loadCustomerData();
    if (persistentData) {
      if (primaryKey === 'partyondelivery_customer') {
        return persistentData.customerInfo as T;
      }
      if (primaryKey === 'partyondelivery_address') {
        return persistentData.addressInfo as T;
      }
    }

    // Try primary localStorage
    const primary = localStorage.getItem(primaryKey);
    if (primary && primary !== 'null' && primary !== 'undefined') {
      const parsed = JSON.parse(primary);
      if (typeof parsed === 'object' && parsed && Object.values(parsed).some(v => v && v !== '')) {
        console.log(`Found data in primary storage ${primaryKey}:`, parsed);
        return parsed;
      }
    }

    // Try cache manager backup
    const backup = cacheManager.get<T>(backupKey);
    if (backup && typeof backup === 'object' && Object.values(backup).some(v => v && v !== '')) {
      console.log(`Found data in backup storage ${backupKey}:`, backup);
      localStorage.setItem(primaryKey, JSON.stringify(backup));
      return backup;
    }

    // Try to extract from completed order
    const completedOrder = customerDataManager.loadCompletedOrder();
    if (completedOrder) {
      if (primaryKey === 'partyondelivery_address' && completedOrder.address) {
        const addressParts = completedOrder.address.split(',').map(p => p.trim());
        const stateParts = addressParts[2]?.split(' ') || [];
        const extractedAddress = {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: stateParts[0] || '',
          zipCode: stateParts[1] || '',
          instructions: completedOrder.instructions || ''
        } as T;
        console.log(`Extracted address from completed order:`, extractedAddress);
        return extractedAddress;
      }
      if (primaryKey === 'partyondelivery_customer' && (completedOrder.customerName || completedOrder.customerEmail)) {
        const nameParts = completedOrder.customerName?.split(' ') || [];
        const extractedCustomer = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: completedOrder.customerEmail || '',
          phone: completedOrder.customerPhone || ''
        } as T;
        console.log(`Extracted customer from completed order:`, extractedCustomer);
        return extractedCustomer;
      }
    }

    // Try legacy last order format
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
        console.log(`Extracted address from legacy order:`, extractedAddress);
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
        console.log(`Extracted customer from legacy order:`, extractedCustomer);
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
  console.log('=== useCustomerInfo initializing ===');
  
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
      
      // Save persistent data (30 days) if we have meaningful data
      if (newInfo.firstName && newInfo.email) {
        customerDataManager.saveCustomerData(newInfo, addressInfo);
      }
      
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
      
      // Save persistent data (30 days) if we have meaningful data
      if (newInfo.street && newInfo.city) {
        customerDataManager.saveCustomerData(customerInfo, newInfo);
      }
      
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

  // Optimized debug logging with throttling
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useCustomerInfo - State updated:', { 
        customerComplete: customerInfo.firstName && customerInfo.email,
        addressComplete: addressInfo.street && addressInfo.city 
      });
    }
  }, [customerInfo.firstName, customerInfo.email, addressInfo.street, addressInfo.city]);

  return {
    customerInfo,
    setCustomerInfo,
    addressInfo,
    setAddressInfo,
    saveCompletedOrder: customerDataManager.saveCompletedOrder.bind(customerDataManager)
  };
}
