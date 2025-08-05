import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AbandonedOrderTrackerProps {
  cartItems: any[];
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  subtotal: number;
  sessionId: string;
}

export function AbandonedOrderTracker({ 
  cartItems, 
  customerInfo, 
  subtotal, 
  sessionId 
}: AbandonedOrderTrackerProps) {
  
  useEffect(() => {
    // Only track if we have meaningful customer data and cart items
    if (cartItems.length > 0 && (customerInfo.email || customerInfo.phone)) {
      const trackAbandonedOrder = async () => {
        try {
          await supabase.functions.invoke('track-abandoned-order', {
            body: {
              session_id: sessionId,
              customer_name: customerInfo.name || 'Unknown',
              customer_email: customerInfo.email,
              customer_phone: customerInfo.phone,
              delivery_address: customerInfo.address,
              cart_items: cartItems,
              subtotal: subtotal
            }
          });
        } catch (error) {
          console.error('Error tracking abandoned order:', error);
        }
      };

      // Track when user leaves without completing
      const handleBeforeUnload = () => {
        trackAbandonedOrder();
      };

      // Track after a delay (user seems to have abandoned)
      const abandonTimer = setTimeout(trackAbandonedOrder, 5 * 60 * 1000); // 5 minutes

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        clearTimeout(abandonTimer);
      };
    }
  }, [cartItems, customerInfo, subtotal, sessionId]);

  return null; // This is a tracking component, no UI
}