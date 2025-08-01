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
      
      console.log("🔥 ORDER COMPLETE - STARTING SEARCH:", {
        sessionId,
        orderNumber,
        errorParam,
        fullUrl: window.location.href
      });
      
      if (errorParam) {
        console.log("🔥 ERROR IN URL - ABORTING");
        setIsLoading(false);
        toast({
          title: "Order Processing Error",
          description: "There was an issue creating your order. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      try {
        let foundOrder = null;
        
        // STRATEGY 1: Direct lookup by session_id (most reliable)
        if (sessionId) {
          console.log(`🔥 SEARCHING BY SESSION_ID: ${sessionId}`);
          const { data: sessionOrders, error: sessionError } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!sessionError && sessionOrders?.length > 0) {
            foundOrder = sessionOrders[0];
            console.log(`🔥 ✅ FOUND BY SESSION_ID: Order #${foundOrder.order_number}`);
          } else {
            console.log("🔥 ❌ NO ORDER FOUND BY SESSION_ID");
          }
        }
        
        // STRATEGY 2: Direct lookup by order_number
        if (!foundOrder && orderNumber) {
          console.log(`🔥 SEARCHING BY ORDER_NUMBER: ${orderNumber}`);
          const { data: orderNumberOrders, error: orderError } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .eq('order_number', orderNumber)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!orderError && orderNumberOrders?.length > 0) {
            foundOrder = orderNumberOrders[0];
            console.log(`🔥 ✅ FOUND BY ORDER_NUMBER: Order #${foundOrder.order_number}`);
          } else {
            console.log("🔥 ❌ NO ORDER FOUND BY ORDER_NUMBER");
          }
        }
        
        // STRATEGY 3: Recent orders search (last 10 minutes)
        if (!foundOrder) {
          console.log("🔥 SEARCHING RECENT ORDERS (last 10 minutes)");
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
          
          const { data: recentOrders, error: recentError } = await supabase
            .from('customer_orders')
            .select(`
              *,
              customer:customers(first_name, last_name, email)
            `)
            .gte('created_at', tenMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (!recentError && recentOrders?.length > 0) {
            console.log(`🔥 FOUND ${recentOrders.length} RECENT ORDERS`);
            
            // Try to match with localStorage if available
            const storedOrder = localStorage.getItem('partyondelivery_last_order');
            if (storedOrder) {
              try {
                const parsed = JSON.parse(storedOrder);
                console.log("🔥 COMPARING WITH STORED ORDER:", parsed);
                
                // Match by total amount or customer email
                const matchedOrder = recentOrders.find(order => 
                  Math.abs(parseFloat(order.total_amount.toString()) - parseFloat(parsed.totalAmount || 0)) < 0.01 ||
                  order.customer?.email === parsed.customerEmail
                );
                
                if (matchedOrder) {
                  foundOrder = matchedOrder;
                  console.log(`🔥 ✅ MATCHED WITH STORED ORDER: Order #${foundOrder.order_number}`);
                }
              } catch (e) {
                console.log("🔥 Could not parse stored order data:", e);
              }
            }
            
            // If no match found, use the most recent order
            if (!foundOrder) {
              foundOrder = recentOrders[0];
              console.log(`🔥 ✅ USING MOST RECENT ORDER: Order #${foundOrder.order_number}`);
            }
          } else {
            console.log("🔥 ❌ NO RECENT ORDERS FOUND");
          }
        }
        
        if (foundOrder) {
          console.log(`🔥 🎉 SUCCESS! PROCESSING ORDER #${foundOrder.order_number}`);
          
          // Generate group order name if missing
          if (!foundOrder.group_order_name && foundOrder.customer) {
            const groupName = `${foundOrder.customer.first_name || 'Customer'}'s ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`;
            
            try {
              await supabase
                .from('customer_orders')
                .update({ group_order_name: groupName })
                .eq('id', foundOrder.id);
              
              foundOrder.group_order_name = groupName;
              console.log(`🔥 UPDATED GROUP ORDER NAME: ${groupName}`);
            } catch (updateErr) {
              console.log("🔥 Could not update group order name:", updateErr);
            }
          }

          // Set the order data
          setOrderData(foundOrder);
          setIsLoading(false);

          // Cache for future reference
          localStorage.setItem('lastCompletedOrder', JSON.stringify({
            orderNumber: foundOrder.order_number,
            sessionId: foundOrder.session_id,
            customerName: foundOrder.customer?.first_name || 'Customer',
            customerEmail: foundOrder.customer?.email,
            line_items: foundOrder.line_items,
            total_amount: foundOrder.total_amount,
            delivery_date: foundOrder.delivery_date,
            delivery_time: foundOrder.delivery_time,
            delivery_address: foundOrder.delivery_address,
            share_token: foundOrder.share_token,
            group_order_name: foundOrder.group_order_name
          }));

          // Send confirmation email (don't wait for this)
          supabase.functions.invoke('send-order-confirmation-email', {
            body: {
              orderNumber: foundOrder.order_number,
              stripeSessionId: sessionId,
              customerEmail: foundOrder.customer?.email,
            }
          }).catch(emailError => {
            console.log('🔥 Email send failed (non-blocking):', emailError);
          });
          
          toast({
            title: "🎉 Order Complete!",
            description: `Order #${foundOrder.order_number} has been confirmed.`,
          });
          
        } else {
          console.log("🔥 💀 CRITICAL FAILURE - NO ORDER FOUND ANYWHERE");
          setIsLoading(false);
          toast({
            title: "Order Not Found",
            description: "We couldn't locate your order. Your payment was processed - please contact support.",
            variant: "destructive",
          });
        }
        
      } catch (error: any) {
        console.error('🔥 CRITICAL ERROR in loadOrderData:', error);
        setIsLoading(false);
        toast({
          title: "Error Loading Order",
          description: "There was a problem loading your order details. Please contact support.",
          variant: "destructive",
        });
      }
    };

    loadOrderData();
  }, [location.search, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't locate your order details. If you just placed an order, 
            your payment was likely processed successfully.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact support with your payment confirmation for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <OrderCompleteView 
      orderNumber={orderData.order_number}
      customerName={orderData.customer?.first_name || 'Customer'}
      orderItems={orderData.line_items || []}
      totalAmount={parseFloat(orderData.total_amount) || 0}
      deliveryDate={orderData.delivery_date}
      deliveryTime={orderData.delivery_time}
      deliveryAddress={orderData.delivery_address}
      shareToken={orderData.share_token}
      groupOrderName={orderData.group_order_name}
    />
  );
};

export default OrderComplete;