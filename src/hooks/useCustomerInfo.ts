import { useLocalStorage } from './useLocalStorage';
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

export function useCustomerInfo() {
  const [customerInfo, setCustomerInfo] = useLocalStorage<CustomerInfo>('partyondelivery_customer', {
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const [addressInfo, setAddressInfo] = useLocalStorage<AddressInfo>('partyondelivery_address', {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: ''
  });

  // Enhanced setters that also update cache for cross-session reliability
  const setCustomerInfoEnhanced = (info: CustomerInfo | ((prev: CustomerInfo) => CustomerInfo)) => {
    const newInfo = typeof info === 'function' ? info(customerInfo) : info;
    setCustomerInfo(newInfo);
    cacheManager.set('customer_backup', newInfo, 24 * 60); // 24 hour backup
  };

  const setAddressInfoEnhanced = (info: AddressInfo | ((prev: AddressInfo) => AddressInfo)) => {
    const newInfo = typeof info === 'function' ? info(addressInfo) : info;
    setAddressInfo(newInfo);
    cacheManager.set('address_backup', newInfo, 24 * 60); // 24 hour backup
  };

  return {
    customerInfo,
    setCustomerInfo: setCustomerInfoEnhanced,
    addressInfo,
    setAddressInfo: setAddressInfoEnhanced
  };
}