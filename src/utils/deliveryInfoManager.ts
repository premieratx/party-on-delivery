/**
 * Single source of truth for delivery information across the app
 * Handles timezone-safe date parsing and consistent delivery info storage
 */

import { format } from 'date-fns';

export interface DeliveryInfo {
  date: Date | null;
  timeSlot: string;
  address: string;
  instructions?: string;
}

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
}

export interface GroupOrderInfo {
  shareToken: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: AddressInfo;
  customerName: string;
  orderNumber: string;
  priority: 'group_order';
}

// Timezone-safe date parsing - always use noon to avoid timezone offset issues
export const parseDeliveryDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // If already has time component, use as-is
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Add noon time to avoid timezone issues
  return new Date(dateString + 'T12:00:00');
};

// Format delivery date consistently across the app
export const formatDeliveryDate = (dateString: string, formatString: string = 'EEEE, MMMM do, yyyy'): string => {
  const date = parseDeliveryDate(dateString);
  return format(date, formatString);
};

// Storage keys for delivery information
export const STORAGE_KEYS = {
  DELIVERY_INFO: 'partyondelivery_delivery_info',
  LAST_ORDER: 'partyondelivery_last_order',
  GROUP_ORDER_DATA: 'groupOrderDeliveryInfo',
  ORIGINAL_GROUP_DATA: 'originalGroupOrderData',
  GROUP_ORDER_TOKEN: 'groupOrderToken',
  ADD_TO_ORDER: 'partyondelivery_add_to_order',
  GROUP_JOIN_DECISION: 'groupOrderJoinDecision',
  APPLIED_DISCOUNT: 'partyondelivery_applied_discount'
} as const;

// Get delivery info with priority: Group Order > Last Order > Default
export const getActiveDeliveryInfo = (): {
  source: 'group_order' | 'last_order' | 'none';
  data: Partial<DeliveryInfo> | null;
  addressInfo?: AddressInfo;
} => {
  // Priority 1: Group order data (when joining a group)
  const groupOrderData = localStorage.getItem(STORAGE_KEYS.GROUP_ORDER_DATA);
  if (groupOrderData) {
    try {
      const parsed = JSON.parse(groupOrderData);
      if (parsed.priority === 'group_order') {
        return {
          source: 'group_order',
          data: {
            date: parseDeliveryDate(parsed.date),
            timeSlot: parsed.timeSlot,
            address: typeof parsed.address === 'string' ? parsed.address : parsed.address?.street || '',
            instructions: parsed.address?.instructions || ''
          },
          addressInfo: typeof parsed.address === 'object' ? parsed.address : undefined
        };
      }
    } catch (error) {
      console.error('Error parsing group order data:', error);
    }
  }

  // Priority 2: Last order data
  const lastOrderData = localStorage.getItem(STORAGE_KEYS.LAST_ORDER);
  if (lastOrderData) {
    try {
      const parsed = JSON.parse(lastOrderData);
      if (parsed.deliveryDate && parsed.deliveryTime) {
        return {
          source: 'last_order',
          data: {
            date: parseDeliveryDate(parsed.deliveryDate),
            timeSlot: parsed.deliveryTime,
            address: parsed.address || '',
            instructions: parsed.instructions || ''
          }
        };
      }
    } catch (error) {
      console.error('Error parsing last order data:', error);
    }
  }

  return {
    source: 'none',
    data: null
  };
};

// Store group order info with proper structure
export const storeGroupOrderInfo = (orderData: any, shareToken: string) => {
  const groupOrderInfo: GroupOrderInfo = {
    shareToken,
    deliveryDate: orderData.delivery_date,
    deliveryTime: orderData.delivery_time,
    deliveryAddress: orderData.delivery_address,
    customerName: orderData.customers 
      ? `${orderData.customers.first_name || ''} ${orderData.customers.last_name || ''}`.trim()
      : 'Unknown Customer',
    orderNumber: orderData.order_number,
    priority: 'group_order'
  };

  // Store with highest priority flag
  localStorage.setItem(STORAGE_KEYS.GROUP_ORDER_DATA, JSON.stringify({
    date: groupOrderInfo.deliveryDate,
    timeSlot: groupOrderInfo.deliveryTime,
    address: groupOrderInfo.deliveryAddress,
    priority: 'group_order'
  }));

  // Store original data for dashboard access
  localStorage.setItem(STORAGE_KEYS.ORIGINAL_GROUP_DATA, JSON.stringify(groupOrderInfo));

  // Set group order flags
  localStorage.setItem(STORAGE_KEYS.GROUP_ORDER_TOKEN, shareToken);
  localStorage.setItem(STORAGE_KEYS.ADD_TO_ORDER, 'true');
  localStorage.setItem(STORAGE_KEYS.GROUP_JOIN_DECISION, 'yes');

  // Apply group discount
  localStorage.setItem(STORAGE_KEYS.APPLIED_DISCOUNT, JSON.stringify({
    code: 'GROUP-SHIPPING-FREE',
    type: 'free_shipping',
    value: 0
  }));

  return groupOrderInfo;
};

// Clear all group order data
export const clearGroupOrderData = () => {
  localStorage.removeItem(STORAGE_KEYS.GROUP_ORDER_DATA);
  localStorage.removeItem(STORAGE_KEYS.ORIGINAL_GROUP_DATA);
  localStorage.removeItem(STORAGE_KEYS.GROUP_ORDER_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADD_TO_ORDER);
  localStorage.removeItem(STORAGE_KEYS.GROUP_JOIN_DECISION);
};

// Check if currently joining a group order
export const isJoiningGroupOrder = (): boolean => {
  const joinDecision = localStorage.getItem(STORAGE_KEYS.GROUP_JOIN_DECISION);
  const addToOrder = localStorage.getItem(STORAGE_KEYS.ADD_TO_ORDER);
  return joinDecision === 'yes' || addToOrder === 'true';
};

// Check if delivery date/time has expired
export const isDeliveryExpired = (deliveryDate: string, deliveryTime: string): boolean => {
  if (!deliveryDate || !deliveryTime) return true;
  
  try {
    const date = parseDeliveryDate(deliveryDate);
    const [timeSlot] = deliveryTime.split(' - '); // Get start time from "10:00 AM - 11:00 AM"
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    let deliveryHours = hours;
    if (period === 'PM' && hours !== 12) deliveryHours += 12;
    if (period === 'AM' && hours === 12) deliveryHours = 0;
    
    date.setHours(deliveryHours, minutes, 0, 0);
    
    return new Date() > date;
  } catch (error) {
    console.error('Error parsing delivery date/time:', error);
    return true;
  }
};