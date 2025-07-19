import { useLocalStorage } from './useLocalStorage';

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

  return {
    customerInfo,
    setCustomerInfo,
    addressInfo,
    setAddressInfo
  };
}