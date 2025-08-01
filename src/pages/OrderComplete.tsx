import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OrderComplete = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');
      const orderNumber = urlParams.get('order_number');
      const errorParam = urlParams.get('error');
      
      console.log("🔥 ORDER COMPLETE PAGE LOADED:", {
        currentUrl: window.location.href,
        sessionId,
        orderNumber,
        errorParam,
        allParams: Object.fromEntries(urlParams.entries())
      });
      
      if (errorParam) {
        console.log("🔥 ERROR PARAMETER DETECTED:", errorParam);
        setIsLoading(false);
        toast({
          title: "Order Processing Error",
          description: "There was an issue creating your order. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      if (!sessionId && !orderNumber) {
        console.log("🔥 NO SESSION ID OR ORDER NUMBER - MISSING PARAMS");
        setIsLoading(false);
        toast({
          title: "Order Not Found",
          description: "No order information found.",
          variant: "destructive",
        });
        return;
      }

      // Function to process found order
      const processOrder = async (foundOrder: any) => {
        try {
          console.log(`🔥 [OrderComplete] Processing order:`, foundOrder.order_number);
          
          // Get customer data using Supabase client
          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', foundOrder.customer_id)
            .maybeSingle();

          if (customerError) {
            console.error('🔥 [OrderComplete] Customer fetch error:', customerError);
          }

          // Generate group order name if not exists
          if (!foundOrder.group_order_name && customer) {
            const groupName = `${customer.first_name || 'Customer'}'s ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`;
            
            const { error: updateError } = await supabase
              .from('customer_orders')
              .update({ group_order_name: groupName })
              .eq('id', foundOrder.id);
            
            if (!updateError) {
              foundOrder.group_order_name = groupName;
            }
          }

          // Set order data
          setOrderData({ ...foundOrder, customer });
          setIsLoading(false);

          // Send confirmation email in background
          try {
            await supabase.functions.invoke('send-order-confirmation-email', {
              body: {
                orderNumber: foundOrder.order_number,
                stripeSessionId: sessionId,
                customerEmail: customer?.email,
              }
            });
          } catch (emailError) {
            console.error('🔥 Failed to send confirmation email:', emailError);
            // Don't block the order completion for email failures
          }

        } catch (error: any) {
          console.error('🔥 [OrderComplete] Error processing order:', error);
          setIsLoading(false);
          toast({
            title: "Error",
            description: "Failed to load order details.",
            variant: "destructive",
          });
        }
      };

      // Immediate search with aggressive retry logic
      let order = null;
      let retryCount = 0;
      const maxRetries = 15; // Increased retries
      
      while (retryCount < maxRetries && !order) {
        try {
          console.log(`🔥 [OrderComplete] Attempt ${retryCount + 1}/${maxRetries} - Searching for order`);
          
          // Try session_id first if available
          if (sessionId) {
            const { data: sessionOrders, error: sessionError } = await supabase
              .from('customer_orders')
              .select('*')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (!sessionError && sessionOrders && sessionOrders.length > 0) {
              console.log(`🔥 [OrderComplete] Found order by session_id:`, sessionOrders[0].order_number);
              order = sessionOrders[0];
              await processOrder(order);
              return;
            }
          }
          
          // Try order_number if available
          if (orderNumber) {
            const { data: numberOrders, error: numberError } = await supabase
              .from('customer_orders')
              .select('*')
              .eq('order_number', orderNumber)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (!numberError && numberOrders && numberOrders.length > 0) {
              console.log(`🔥 [OrderComplete] Found order by order_number:`, numberOrders[0].order_number);
              order = numberOrders[0];
              await processOrder(order);
              return;
            }
          }

          retryCount++;
          
          // Progressive wait times
          let waitTime;
          if (retryCount <= 3) waitTime = 1000;      // First 3 tries: 1 second
          else if (retryCount <= 6) waitTime = 2000; // Next 3 tries: 2 seconds  
          else if (retryCount <= 10) waitTime = 3000; // Next 4 tries: 3 seconds
          else waitTime = 5000;                       // Final tries: 5 seconds
          
          if (retryCount < maxRetries) {
            console.log(`🔥 [OrderComplete] Order not found, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
        } catch (searchError) {
          console.error(`🔥 [OrderComplete] Search error on attempt ${retryCount + 1}:`, searchError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }

      // If still no order found after all retries
      if (!order) {
        console.error(`🔥 [OrderComplete] Failed to find order after ${maxRetries} attempts`);
        setIsLoading(false);
        toast({
          title: "Order Not Found",
          description: "Could not find order details. Please check your order number or contact support.",
          variant: "destructive",
        });
      }
    };
    
    loadOrderData();
  }, [location.search, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground">We couldn't find your order details.</p>
        </div>
      </div>
    );
  }

  return (
    <OrderCompleteView
      orderNumber={orderData.order_number}
      customerName={orderData.customer?.first_name || 'Customer'}
      orderItems={orderData.line_items || []}
      totalAmount={orderData.total_amount}
      deliveryDate={orderData.delivery_date}
      deliveryTime={orderData.delivery_time}
      deliveryAddress={orderData.delivery_address}
      shareToken={orderData.share_token}
      groupOrderName={orderData.group_order_name}
    />
  );
};

export default OrderComplete;