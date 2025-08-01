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
      // Check for prefilled delivery address from custom site
      const prefilledAddress = localStorage.getItem('prefilled_delivery_address');
      
      // Try primary storage first
      const customerData = localStorage.getItem('partyondelivery_customer_persistent');
      const addressData = localStorage.getItem('partyondelivery_address_persistent');
      
      if (customerData && addressData) {
        const customer = JSON.parse(customerData);
        const address = JSON.parse(addressData);
        
        // Check if expired
        if (customer.expiresAt && new Date() < new Date(customer.expiresAt)) {
          console.log('Loading persistent customer data:', { customer, address });
          
          // Use prefilled address if available
          let finalAddress = {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            instructions: address.instructions
          };
          
          if (prefilledAddress) {
            const prefilled = JSON.parse(prefilledAddress);
            finalAddress = {
              street: prefilled.street || address.street,
              city: prefilled.city || address.city,
              state: prefilled.state || address.state,
              zipCode: prefilled.zip_code || address.zipCode,
              instructions: prefilled.instructions || address.instructions
            };
            console.log('Using prefilled delivery address from custom site:', finalAddress);
          }
          
          return {
            customerInfo: {
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              email: customer.email
            },
            addressInfo: finalAddress
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
    // HIGHEST PRIORITY: Check for group order delivery info
    if (primaryKey === 'partyondelivery_address') {
      const groupOrderInfo = localStorage.getItem('groupOrderDeliveryInfo');
      if (groupOrderInfo) {
        try {
          const parsedGroupData = JSON.parse(groupOrderInfo);
          console.log('🎯 PRIORITY: Found group order delivery info:', parsedGroupData);
          if (parsedGroupData.priority === 'group_order' && parsedGroupData.address) {
            // Parse address string into components
            const addressStr = parsedGroupData.address;
            if (typeof addressStr === 'string') {
              const parts = addressStr.split(',').map(s => s.trim());
              const stateZip = parts[2]?.split(' ') || [];
              const groupAddress = {
                street: parts[0] || '',
                city: parts[1] || '',
                state: stateZip[0] || '',
                zipCode: stateZip[1] || '',
                instructions: ''
              } as T;
              console.log('✅ Using GROUP ORDER address:', groupAddress);
              return groupAddress;
            } else if (typeof addressStr === 'object') {
              console.log('✅ Using GROUP ORDER address (object):', addressStr);
              return addressStr as T;
            }
          }
        } catch (error) {
          console.error('Error parsing group order address info:', error);
        }
      }
    }

    // Check for prefilled delivery address from custom site (second priority)
    if (primaryKey === 'partyondelivery_address') {
      const prefilledAddress = localStorage.getItem('prefilled_delivery_address');
      if (prefilledAddress) {
        try {
          const prefilled = JSON.parse(prefilledAddress);
          const addressFromPrefilled = {
            street: prefilled.street || '',
            city: prefilled.city || '',
            state: prefilled.state || '',
            zipCode: prefilled.zip_code || '',
            instructions: prefilled.instructions || ''
          } as T;
          console.log('Using prefilled delivery address from custom site:', addressFromPrefilled);
          return addressFromPrefilled;
        } catch (e) {
          console.error('Failed to parse prefilled address:', e);
        }
      }
    }
    
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
  
  // Initialize with completely empty state - no pre-loading
  const [customerInfo, setCustomerInfoState] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [addressInfo, setAddressInfoState] = useState<AddressInfo>(() => {
    // HIGHEST PRIORITY: Check for group order delivery info
    const groupOrderInfo = localStorage.getItem('groupOrderDeliveryInfo');
    if (groupOrderInfo) {
      try {
        const parsedGroupData = JSON.parse(groupOrderInfo);
        console.log('🎯 INITIALIZING with group order address:', parsedGroupData);
        if (parsedGroupData.priority === 'group_order' && parsedGroupData.address) {
          const addressStr = parsedGroupData.address;
          if (typeof addressStr === 'string') {
            const parts = addressStr.split(',').map(s => s.trim());
            const stateZip = parts[2]?.split(' ') || [];
            return {
              street: parts[0] || '',
              city: parts[1] || '',
              state: stateZip[0] || '',
              zipCode: stateZip[1] || '',
              instructions: ''
            };
          } else if (typeof addressStr === 'object') {
            return addressStr;
          }
        }
      } catch (error) {
        console.error('Error parsing group order address during init:', error);
      }
    }

    // Check for group order prefill data (fallback)
    const prefillData = localStorage.getItem('prefill_delivery_data');
    if (prefillData) {
      try {
        const parsed = JSON.parse(prefillData);
        if (parsed.address) {
          console.log('🔗 PREFILLING address from group order:', parsed.address);
          return {
            street: parsed.address.street || '',
            city: parsed.address.city || '',
            state: parsed.address.state || '',
            zipCode: parsed.address.zipCode || '',
            instructions: ''
          };
        }
      } catch (error) {
        console.error('Error parsing prefill address:', error);
      }
    }
    
    // Fallback to empty state
    return {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: ''
    };
  });

  // Only try to load stored data once if user hasn't started typing
  const [hasLoadedStoredData, setHasLoadedStoredData] = useState(false);

  useEffect(() => {
    if (!hasLoadedStoredData) {
      console.log('Attempting to load stored customer data...');
      
      try {
        // Try to load from localStorage only
        const storedCustomer = localStorage.getItem('partyondelivery_customer');
        const storedAddress = localStorage.getItem('partyondelivery_address');
        
        if (storedCustomer) {
          const customerData = JSON.parse(storedCustomer);
          if (customerData.firstName || customerData.email) {
            console.log('Loading stored customer:', customerData);
            setCustomerInfoState(customerData);
          }
        }
        
        // Check for prefilled delivery address first
        const prefilledAddress = localStorage.getItem('prefilled_delivery_address');
        if (prefilledAddress) {
          try {
            const prefilled = JSON.parse(prefilledAddress);
            const prefilledAddressData = {
              street: prefilled.street || '',
              city: prefilled.city || '',
              state: prefilled.state || '',
              zipCode: prefilled.zip_code || '',
              instructions: prefilled.instructions || ''
            };
            console.log('Loading prefilled delivery address from custom site:', prefilledAddressData);
            setAddressInfoState(prefilledAddressData);
          } catch (e) {
            console.error('Failed to parse prefilled address:', e);
          }
        } else if (storedAddress) {
          const addressData = JSON.parse(storedAddress);
          if (addressData.street || addressData.city) {
            console.log('Loading stored address:', addressData);
            setAddressInfoState(addressData);
          }
        }
      } catch (error) {
        console.warn('Error loading stored data:', error);
      }
      
      setHasLoadedStoredData(true);
    }
  }, [hasLoadedStoredData]);

  // Simple setters that just update state and localStorage
  const setCustomerInfo = (info: CustomerInfo | ((prev: CustomerInfo) => CustomerInfo)) => {
    const newInfo = typeof info === 'function' ? info(customerInfo) : info;
    console.log('💾 Setting and saving customer info:', newInfo);
    
    setCustomerInfoState(newInfo);
    
    // Enhanced localStorage save with immediate persistence
    try {
      localStorage.setItem('partyondelivery_customer', JSON.stringify(newInfo));
      cacheManager.set('customer_checkout', newInfo, 60); // 1 hour cache for checkout session
      
      // Save persistent data with 30-day expiration if data is complete enough
      if (newInfo.firstName && newInfo.email && addressInfo.street) {
        customerDataManager.saveCustomerData(newInfo, addressInfo);
      }
    } catch (error) {
      console.error('Failed to save customer info:', error);
    }
  };

  const setAddressInfo = (info: AddressInfo | ((prev: AddressInfo) => AddressInfo)) => {
    const newInfo = typeof info === 'function' ? info(addressInfo) : info;
    console.log('💾 Setting and saving address info:', newInfo);
    
    setAddressInfoState(newInfo);
    
    // Enhanced localStorage save with immediate persistence
    try {
      localStorage.setItem('partyondelivery_address', JSON.stringify(newInfo));
      cacheManager.set('address_checkout', newInfo, 60); // 1 hour cache for checkout session
      
      // Save persistent data with 30-day expiration if customer data is complete enough
      if (customerInfo.firstName && customerInfo.email && newInfo.street) {
        customerDataManager.saveCustomerData(customerInfo, newInfo);
      }
    } catch (error) {
      console.error('Failed to save address info:', error);
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
