import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DeliveryWidget } from "@/components/DeliveryWidget";
import { GroupOrderConfirmationModal } from '@/components/GroupOrderConfirmationModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupOrderDetails, setGroupOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const shareToken = urlParams.get('share');
    
    console.log('🔗 Index.tsx: URL search params:', location.search);
    console.log('🔗 Index.tsx: Full URL:', window.location.href);
    console.log('🔗 Index.tsx: Checking for share token:', shareToken);
    console.log('🔗 Group order token in localStorage:', localStorage.getItem('groupOrderToken'));
    
    // Show modal for share links - always load if share token exists
    if (shareToken) {
      console.log('🔗 Loading group order details for token:', shareToken);
      loadGroupOrderDetails(shareToken);
    } else {
      console.log('🔗 No share token found in URL');
    }
  }, [location.search]);

  const loadGroupOrderDetails = async (shareToken: string) => {
    try {
      console.log('🔗 loadGroupOrderDetails START - token:', shareToken);
      setIsLoading(true);
      
      console.log('🔗 Making Supabase query...');
      const { data: orderData, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer:customers(first_name, last_name, email)
        `)
        .eq('share_token', shareToken)
        .maybeSingle();

      console.log('🔗 Group order query result:', { orderData, error });
      console.log('🔗 orderData exists?', !!orderData);
      console.log('🔗 About to set modal state...');

      if (error) {
        console.log('🔗 Error in query:', error);
        throw error;
      }
      
      if (orderData) {
        console.log('🔗 Setting group order details and showing modal');
        setGroupOrderDetails(orderData);
        setShowGroupModal(true);
        console.log('🔗 Modal should now be visible');
      } else {
        console.log('🔗 No order data found, showing toast');
        toast({
          title: "Order Not Found",
          description: "This shared order link is no longer valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('🔗 Error loading group order:', error);
      toast({
        title: "Error",
        description: "Failed to load shared order details.",
        variant: "destructive",
      });
    } finally {
      console.log('🔗 loadGroupOrderDetails END');
      setIsLoading(false);
    }
  };

  const handleJoinGroup = () => {
    if (!groupOrderDetails) return;
    
    // Store group order token for backend processing
    localStorage.setItem('groupOrderToken', groupOrderDetails.share_token);
    localStorage.setItem('partyondelivery_add_to_order', 'true');
    
    // PREFILL delivery details from original order
    const originalOrder = groupOrderDetails;
    localStorage.setItem('prefill_delivery_data', JSON.stringify({
      date: originalOrder.delivery_date,
      timeSlot: originalOrder.delivery_time,
      address: originalOrder.delivery_address
    }));
    
    // Store original group order data for completion routing
    localStorage.setItem('originalGroupOrderData', JSON.stringify({
      shareToken: groupOrderDetails.share_token,
      orderNumber: groupOrderDetails.order_number,
      customerName: groupOrderDetails.customer?.first_name || 'Customer'
    }));
    
    // Apply free shipping for group orders
    localStorage.setItem('partyondelivery_applied_discount', JSON.stringify({
      code: 'GROUP-SHIPPING-FREE',
      type: 'free_shipping',
      value: 0
    }));
    
    setShowGroupModal(false);
    
    // Clean up URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    
    toast({
      title: "Joined Group Order!",
      description: `Free delivery applied. Your items will be delivered with ${groupOrderDetails.customer?.first_name || 'the group'}.`,
    });
  };

  const handleStartNew = () => {
    setShowGroupModal(false);
    
    // Clean up URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  };

  return (
    <>
      <DeliveryWidget />
      
      <GroupOrderConfirmationModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        orderDetails={groupOrderDetails}
        onJoinGroup={handleJoinGroup}
        onStartNew={handleStartNew}
        isLoading={isLoading}
      />
    </>
  );
};

export default Index;