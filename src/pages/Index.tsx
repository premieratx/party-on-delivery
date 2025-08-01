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
    
    console.log('🔗 Index.tsx: Checking for share token:', shareToken);
    console.log('🔗 Group order token in localStorage:', localStorage.getItem('groupOrderToken'));
    
    // Show modal for share links - always load if share token exists
    if (shareToken) {
      console.log('🔗 Loading group order details for token:', shareToken);
      loadGroupOrderDetails(shareToken);
    }
  }, [location.search]);

  const loadGroupOrderDetails = async (shareToken: string) => {
    try {
      setIsLoading(true);
      
      const { data: orderData, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          customer:customers(first_name, last_name, email)
        `)
        .eq('share_token', shareToken)
        .maybeSingle();

      console.log('🔗 Group order query result:', { orderData, error });

      if (error) throw error;
      
      if (orderData) {
        setGroupOrderDetails(orderData);
        setShowGroupModal(true);
      } else {
        toast({
          title: "Order Not Found",
          description: "This shared order link is no longer valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading group order:', error);
      toast({
        title: "Error",
        description: "Failed to load shared order details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = () => {
    if (!groupOrderDetails) return;
    
    // Store group order token and set up for group ordering
    localStorage.setItem('groupOrderToken', groupOrderDetails.share_token);
    localStorage.setItem('partyondelivery_add_to_order', 'true');
    
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
      description: "Free delivery applied. Your items will be delivered together.",
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