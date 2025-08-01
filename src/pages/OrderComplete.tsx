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

      // First try to find order in localStorage with proper key
      const recentOrderData = localStorage.getItem('partyondelivery_last_order');
      if (recentOrderData) {
        try {
          const orderData = JSON.parse(recentOrderData);
          console.log("🔥 Found order in localStorage:", orderData);
          
          // Check if this matches our search criteria
          if ((sessionId && orderData.sessionId === sessionId) || 
              (orderNumber && orderData.orderNumber === orderNumber)) {
            console.log("🔥 Using localStorage order data:", orderData.orderNumber);
            
            // Store this for OrderCompleteView with proper structure
            localStorage.setItem('lastCompletedOrder', JSON.stringify({
              ...orderData,
              customer: { 
                first_name: orderData.customerName?.split(' ')[0] || 'Customer',
                email: orderData.customerEmail 
              }
            }));
            
            setOrderData({
              ...orderData,
              customer: { 
                first_name: orderData.customerName?.split(' ')[0] || 'Customer',
                email: orderData.customerEmail 
              }
            });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log("🔥 Error parsing localStorage order data:", e);
        }
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

          // Set order data and cache it
          const orderDataWithCustomer = { ...foundOrder, customer };
          setOrderData(orderDataWithCustomer);
          setIsLoading(false);

          // Cache the order data for future reference
          localStorage.setItem('lastCompletedOrder', JSON.stringify({
            orderNumber: foundOrder.order_number,
            sessionId: foundOrder.session_id,
            customerName: customer?.first_name || 'Customer',
            customerEmail: customer?.email,
            line_items: foundOrder.line_items,
            total_amount: foundOrder.total_amount,
            delivery_date: foundOrder.delivery_date,
            delivery_time: foundOrder.delivery_time,
            delivery_address: foundOrder.delivery_address,
            share_token: foundOrder.share_token,
            group_order_name: foundOrder.group_order_name
          }));

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

      // Search for order with broader criteria and immediate response
      let order = null;
      let retryCount = 0;
      const maxRetries = 10;
      
      while (retryCount < maxRetries && !order) {
        try {
          console.log(`🔥 [OrderComplete] Attempt ${retryCount + 1}/${maxRetries} - Searching for order`);
          
          // Search by multiple criteria at once
          let query = supabase.from('customer_orders').select('*');
          
          if (sessionId && orderNumber) {
            // Search by both session_id OR order_number
            query = query.or(`session_id.eq.${sessionId},order_number.eq.${orderNumber}`);
          } else if (sessionId) {
            query = query.eq('session_id', sessionId);
          } else if (orderNumber) {
            query = query.eq('order_number', orderNumber);
          }
          
          const { data: orders, error } = await query
            .order('created_at', { ascending: false })
            .limit(5); // Get multiple orders in case of duplicates
          
          if (!error && orders && orders.length > 0) {
            console.log(`🔥 [OrderComplete] Found ${orders.length} matching orders`);
            // Take the most recent order
            order = orders[0];
            console.log(`🔥 [OrderComplete] Using order:`, order.order_number);
            await processOrder(order);
            return;
          }
          
          // If first few attempts fail, also try recent orders without filters
          if (retryCount >= 3) {
            console.log(`🔥 [OrderComplete] Trying recent orders search...`);
            const { data: recentOrders, error: recentError } = await supabase
              .from('customer_orders')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (!recentError && recentOrders) {
              console.log(`🔥 [OrderComplete] Found ${recentOrders.length} recent orders`);
              // Try to match by partial session_id or order_number
              const matchedOrder = recentOrders.find(o => 
                (sessionId && o.session_id && o.session_id.includes(sessionId.slice(-8))) ||
                (orderNumber && o.order_number === orderNumber)
              );
              
              if (matchedOrder) {
                console.log(`🔥 [OrderComplete] Found matching recent order:`, matchedOrder.order_number);
                order = matchedOrder;
                await processOrder(order);
                return;
              }
            }
          }

          retryCount++;
          
          if (retryCount < maxRetries) {
            const waitTime = Math.min(1000 + (retryCount * 500), 3000); // Progressive wait up to 3 seconds
            console.log(`🔥 [OrderComplete] Order not found, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
        } catch (searchError) {
          console.error(`🔥 [OrderComplete] Search error on attempt ${retryCount + 1}:`, searchError);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
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