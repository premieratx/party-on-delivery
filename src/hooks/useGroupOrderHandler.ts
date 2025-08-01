import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface GroupOrderData {
  shareToken: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: any;
  customerName?: string;
  orderNumber?: string;
}

export const useGroupOrderHandler = () => {
  const location = useLocation();
  const { toast } = useToast();
  
  const [groupOrderData, setGroupOrderData] = useState<GroupOrderData | null>(null);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const shareToken = urlParams.get('share');
    const isCustomerJoining = urlParams.get('customer') === 'true';
    const checkoutParam = urlParams.get('checkout') === 'true';
    
    console.log('🔗 Group Order Handler: share =', shareToken, 'customer =', isCustomerJoining, 'checkout =', checkoutParam);
    
    // Handle group order invitation flow
    if (shareToken && isCustomerJoining && checkoutParam) {
      console.log('🔗 Processing group order join...');
      
      // Check if group order data is already stored
      const storedGroupData = localStorage.getItem('groupOrderDeliveryInfo');
      if (storedGroupData) {
        try {
          const groupData = JSON.parse(storedGroupData);
          console.log('🔗 Found stored group order data:', groupData);
          
          setGroupOrderData({
            shareToken,
            deliveryDate: groupData.date,
            deliveryTime: groupData.timeSlot,
            deliveryAddress: groupData.address,
          });
          
          setIsJoiningGroup(true);
          
          // Apply group order discount
          localStorage.setItem('partyondelivery_applied_discount', JSON.stringify({
            code: 'GROUP-SHIPPING-FREE',
            type: 'free_shipping',
            value: 0
          }));
          
          // Set flags for checkout flow
          localStorage.setItem('groupOrderToken', shareToken);
          localStorage.setItem('partyondelivery_add_to_order', 'true');
          localStorage.setItem('groupOrderJoinDecision', 'yes');
          
          console.log('🔗 Group order setup complete');
          
        } catch (error) {
          console.error('🔗 Error parsing group order data:', error);
        }
      }
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    // Handle scroll to checkout if needed
    if (checkoutParam) {
      setTimeout(() => {
        const checkoutElement = document.querySelector('[data-checkout-section]');
        if (checkoutElement) {
          checkoutElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [location.search]);

  const clearGroupOrder = () => {
    setGroupOrderData(null);
    setIsJoiningGroup(false);
    localStorage.removeItem('groupOrderToken');
    localStorage.removeItem('partyondelivery_add_to_order');
    localStorage.removeItem('groupOrderJoinDecision');
    localStorage.removeItem('groupOrderDeliveryInfo');
  };

  return {
    groupOrderData,
    isJoiningGroup,
    clearGroupOrder
  };
};