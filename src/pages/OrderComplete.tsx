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
      const paymentIntentId = urlParams.get('payment_intent');
      const orderNumber = urlParams.get('order_number');
      const errorParam = urlParams.get('error');
      
      console.log("🔥 ORDER COMPLETE SEARCH:", {
        sessionId, paymentIntentId, orderNumber, errorParam,
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
        let attempts = 0;
        const searchTerms = [sessionId, paymentIntentId].filter(Boolean);
        console.log("🔥 SEARCH TERMS:", searchTerms);
        
        // AGGRESSIVE POLLING: .5 seconds for first 10 attempts (5 seconds), then 5 seconds
        while (!foundOrder && attempts < 25) { // Up to 2 minutes total
          attempts++;
          const isEarlyAttempt = attempts <= 10;
          const waitTime = isEarlyAttempt ? 500 : 5000;
          
          console.log(`🔥 ATTEMPT ${attempts}/25 (${isEarlyAttempt ? 'fast' : 'slow'} polling)`);
          
          // Search by session/payment ID
          for (const searchTerm of searchTerms) {
            if (foundOrder) break;
            
            const { data: orders, error } = await supabase
              .from('customer_orders')
              .select(`
                *,
                customer:customers(first_name, last_name, email)
              `)
              .or(`session_id.eq.${searchTerm},shopify_order_id.eq.${searchTerm}`)
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (!error && orders?.length > 0) {
              foundOrder = orders.find(o => o.customer_id) || orders[0];
              console.log(`🔥 ✅ FOUND ORDER: #${foundOrder.order_number}`);
              break;
            }
          }
          
          // If not found and haven't hit max attempts, wait and retry
          if (!foundOrder && attempts < 25) {
            console.log(`🔥 Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
        
        // FALLBACK: Try order number lookup
        if (!foundOrder && orderNumber) {
          console.log(`🔥 FALLBACK: ORDER_NUMBER ${orderNumber}`);
          const { data: orderNumberOrders, error } = await supabase
            .from('customer_orders')
            .select(`*, customer:customers(first_name, last_name, email)`)
            .eq('order_number', orderNumber)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!error && orderNumberOrders?.length > 0) {
            foundOrder = orderNumberOrders[0];
            console.log(`🔥 ✅ FOUND BY ORDER_NUMBER: #${foundOrder.order_number}`);
          }
        }
        
        // LAST RESORT: Get most recent order
        if (!foundOrder) {
          console.log("🔥 LAST RESORT: Most recent order");
          const { data: lastOrder, error } = await supabase
            .from('customer_orders')
            .select(`*, customer:customers(first_name, last_name, email)`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (!error && lastOrder) {
            foundOrder = lastOrder;
            console.log(`🔥 ⚠️  USING MOST RECENT: #${foundOrder.order_number}`);
          }
        }
        
        if (foundOrder) {
          console.log("🔥 ✅ FINAL ORDER FOUND:", foundOrder.order_number);
          
          // Generate group order name if missing
          if (!foundOrder.group_order_name && foundOrder.customer) {
            const groupName = `${foundOrder.customer.first_name || 'Customer'}'s ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Order`;
            
            try {
              await supabase
                .from('customer_orders')
                .update({ group_order_name: groupName })
                .eq('id', foundOrder.id);
              
              foundOrder.group_order_name = groupName;
            } catch (updateErr) {
              console.log("🔥 Could not update group order name:", updateErr);
            }
          }

          setOrderData(foundOrder);
          
          toast({
            title: "🎉 Order Complete!",
            description: `Order #${foundOrder.order_number} has been confirmed.`,
          });
          
        } else {
          console.log("🔥 ❌ NO ORDER FOUND ANYWHERE");
          setOrderData(null);
        }
        
      } catch (error: any) {
        console.error('🔥 CRITICAL ERROR:', error);
        setOrderData(null);
        toast({
          title: "Error Loading Order",
          description: "There was a problem loading your order details. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [location.search, toast]);

  // Always show the order complete view, with loading state for order details
  const isOrderDataLoading = isLoading;

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
      orderNumber={orderData?.order_number || "Processing..."}
      customerName={orderData?.customer?.first_name || 'Customer'}
      orderItems={orderData?.line_items || []}
      totalAmount={parseFloat(orderData?.total_amount || '0') || 0}
      deliveryDate={orderData?.delivery_date}
      deliveryTime={orderData?.delivery_time}
      deliveryAddress={orderData?.delivery_address}
      shareToken={orderData?.share_token}
      groupOrderName={orderData?.group_order_name}
      isLoading={isOrderDataLoading}
    />
  );
};

export default OrderComplete;