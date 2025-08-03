import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getActiveDeliveryInfo, isJoiningGroupOrder, clearGroupOrderData, STORAGE_KEYS } from '@/utils/deliveryInfoManager';

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
  const [showJoinFlow, setShowJoinFlow] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const shareToken = urlParams.get('share');
    const isCustomerJoining = urlParams.get('customer') === 'true';
    const checkoutParam = urlParams.get('checkout') === 'true';
    
    console.log('🔗 Group Order Handler: share =', shareToken, 'customer =', isCustomerJoining, 'checkout =', checkoutParam);
    
    // ONLY process group order parameters when all three are present
    // This prevents the error from appearing on regular app loads
    if (shareToken && isCustomerJoining && checkoutParam) {
      console.log('🔗 Valid group order invitation detected');
      
      // Check if we already have confirmed group order data
      const activeDeliveryInfo = getActiveDeliveryInfo();
      
      if (activeDeliveryInfo.source === 'group_order' && activeDeliveryInfo.data) {
        console.log('🔗 Using existing group order data');
        
        setGroupOrderData({
          shareToken,
          deliveryDate: typeof activeDeliveryInfo.data.date === 'string' ? activeDeliveryInfo.data.date : activeDeliveryInfo.data.date?.toISOString().split('T')[0] || '',
          deliveryTime: activeDeliveryInfo.data.timeSlot || '',
          deliveryAddress: activeDeliveryInfo.addressInfo || activeDeliveryInfo.data.address,
        });
        
        setIsJoiningGroup(true);
      } else {
        console.log('🔗 Need to show join flow for token:', shareToken);
        setShowJoinFlow(true);
      }
      
      // Clean up URL after processing
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (shareToken && !isCustomerJoining && !checkoutParam) {
      // This is just a regular share link visit - redirect to proper join page
      console.log('🔗 Redirecting to join page for share token:', shareToken);
      window.location.href = `/join/${shareToken}`;
      return;
    } else {
      // Regular app load - only check for existing group order state if we're actually in the main delivery app
      // Don't trigger group order logic just from navigating around the app
      const currentPath = window.location.pathname;
      const isMainDeliveryApp = currentPath === '/' || currentPath === '';
      
      if (isMainDeliveryApp) {
        const isCurrentlyJoining = isJoiningGroupOrder();
        if (isCurrentlyJoining) {
          const activeDeliveryInfo = getActiveDeliveryInfo();
          if (activeDeliveryInfo.source === 'group_order' && activeDeliveryInfo.data) {
            const groupToken = localStorage.getItem(STORAGE_KEYS.GROUP_ORDER_TOKEN);
            setGroupOrderData({
              shareToken: groupToken || '',
              deliveryDate: typeof activeDeliveryInfo.data.date === 'string' ? activeDeliveryInfo.data.date : activeDeliveryInfo.data.date?.toISOString().split('T')[0] || '',
              deliveryTime: activeDeliveryInfo.data.timeSlot || '',
              deliveryAddress: activeDeliveryInfo.addressInfo || activeDeliveryInfo.data.address,
            });
            setIsJoiningGroup(true);
          }
        }
      }
    }
    
    // Handle scroll to checkout if needed
    if (checkoutParam && !showJoinFlow) {
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
    setShowJoinFlow(false);
    clearGroupOrderData();
  };

  const handleJoinConfirmed = () => {
    setShowJoinFlow(false);
    setIsJoiningGroup(true);
    
    // Update group order data from stored info
    const activeDeliveryInfo = getActiveDeliveryInfo();
    if (activeDeliveryInfo.source === 'group_order' && activeDeliveryInfo.data) {
      const groupToken = localStorage.getItem(STORAGE_KEYS.GROUP_ORDER_TOKEN);
      setGroupOrderData({
        shareToken: groupToken || '',
        deliveryDate: typeof activeDeliveryInfo.data.date === 'string' ? activeDeliveryInfo.data.date : activeDeliveryInfo.data.date?.toISOString().split('T')[0] || '',
        deliveryTime: activeDeliveryInfo.data.timeSlot || '',
        deliveryAddress: activeDeliveryInfo.addressInfo || activeDeliveryInfo.data.address,
      });
    }
  };

  const handleJoinDeclined = () => {
    setShowJoinFlow(false);
    clearGroupOrder();
  };

  return {
    groupOrderData,
    isJoiningGroup,
    showJoinFlow,
    clearGroupOrder,
    handleJoinConfirmed,
    handleJoinDeclined
  };
};