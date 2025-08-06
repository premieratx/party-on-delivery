import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CustomPartyOnDeliveryPostCheckout = () => {
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
      
      console.log("🔥 CUSTOM ORDER COMPLETE - INSTANT LOAD:", {
        sessionId, paymentIntentId, orderNumber, errorParam
      });
      
        if (errorParam) {
        console.log("🔥 ERROR PARAM DETECTED:", errorParam);
        setIsLoading(false);
        
        // Show specific error message based on error type
        let errorTitle = "Order Processing Issue";
        let errorDescription = "Your payment was processed but there was an issue creating your order.";
        
        if (errorParam.includes('processed') || errorParam.includes('payment')) {
          errorTitle = "Payment Processed Successfully";
          errorDescription = "Your payment went through! We're still processing your order. Please check your email for confirmation or contact support if needed.";
          
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "default", // Use default variant for payment success
          });
        } else {
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
          });
        }
        
        // Still try to show order data if available
        const orderNumber = urlParams.get('order_number') || "Your order is being processed";
        setOrderData({
          order_number: orderNumber,
          line_items: [],
          total_amount: 0,
          customer: { first_name: 'Customer' },
          payment_intent_id: paymentIntentId
        });
        return;
      }
      
      // INSTANT LOAD: Get checkout data from session storage
      try {
        const checkoutData = sessionStorage.getItem('checkout-completion-data');
        if (checkoutData) {
          const parsedData = JSON.parse(checkoutData);
          console.log("🔥 ✅ USING SESSION DATA:", parsedData);
          
          // Create order data from checkout session - INSTANT DISPLAY
          const instantOrderData = {
            order_number: orderNumber || "Processing...",
            line_items: parsedData.cartItems || [],
            total_amount: parsedData.totalAmount || 0,
            subtotal: parsedData.subtotal || 0,
            delivery_date: parsedData.deliveryDate,
            delivery_time: parsedData.deliveryTime,
            delivery_address: parsedData.deliveryAddress,
            share_token: parsedData.shareToken || null, // Get share token from checkout
            group_order_name: null,
            customer: {
              first_name: parsedData.customerName?.split(' ')[0] || 'Customer',
              last_name: parsedData.customerName?.split(' ').slice(1).join(' ') || '',
              email: parsedData.customerEmail
            },
            payment_intent_id: parsedData.paymentIntentId,
            sales_tax: parsedData.salesTax,
            delivery_fee: parsedData.deliveryFee,
            tip_amount: parsedData.tipAmount,
            applied_discount: parsedData.appliedDiscount
          };
          
          setOrderData(instantOrderData);
          setIsLoading(false);
          
          toast({
            title: "🎉 Order Complete!",
            description: "Payment processed successfully!",
          });
          
          // Clear the session data so it doesn't persist
          sessionStorage.removeItem('checkout-completion-data');
          
          // Background sync to get real order data with share token (optional)
          setTimeout(async () => {
            let foundOrder = null;
            let attempts = 0;
            const searchTerms = [sessionId, paymentIntentId].filter(Boolean);
            
            while (!foundOrder && attempts < 5) { // Quick background check
              attempts++;
              
              for (const searchTerm of searchTerms) {
                if (foundOrder) break;
                
                const { data: orders, error } = await supabase
                  .from('customer_orders')
                  .select(`*, customer:customers(first_name, last_name, email)`)
                  .or(`session_id.eq.${searchTerm},shopify_order_id.eq.${searchTerm},payment_intent_id.eq.${searchTerm}`)
                  .order('created_at', { ascending: false })
                  .limit(3);
                
                if (!error && orders?.length > 0) {
                  foundOrder = orders.find(o => o.customer_id) || orders[0];
                  break;
                }
              }
              
              if (!foundOrder && attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
            
            // Update with real order data if found (for share token, etc.)
            if (foundOrder) {
              console.log("🔥 ✅ BACKGROUND SYNC COMPLETE:", foundOrder.order_number);
              
              // Check if this was a group order join - route to group dashboard
              const groupOrderJoinDecision = localStorage.getItem('groupOrderJoinDecision');
              const originalGroupOrderData = localStorage.getItem('originalGroupOrderData');
              
              const updatedOrderData = {
                ...instantOrderData,
                ...foundOrder,
                order_number: foundOrder.order_number || instantOrderData.order_number
              };
              
              // If user joined a group order, mark it for group dashboard routing
              if (groupOrderJoinDecision === 'yes' && originalGroupOrderData) {
                updatedOrderData.isGroupOrderJoin = true;
                updatedOrderData.originalGroupData = JSON.parse(originalGroupOrderData);
              }
              
              setOrderData(updatedOrderData);
            }
          }, 1000); // Start background sync after 1 second
          
        } else {
          // No session data available - show basic confirmation
          console.log("🔥 NO SESSION DATA - SHOWING BASIC CONFIRMATION");
          setOrderData({
            order_number: orderNumber || "Processing...",
            line_items: [],
            total_amount: 0,
            customer: { first_name: 'Customer' },
            payment_intent_id: paymentIntentId
          });
          setIsLoading(false);
          
          toast({
            title: "🎉 Order Complete!",
            description: "Your payment was processed successfully.",
          });
        }
        
      } catch (error: any) {
        console.error('🔥 ERROR LOADING ORDER:', error);
        setIsLoading(false);
        toast({
          title: "Order Confirmed",
          description: "Your payment was processed successfully.",
        });
      }
    };

    loadOrderData();
  }, [location.search, toast]);

  // Show confirmation page immediately, order details will load in background
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
      isLoading={!orderData}
      subtotal={parseFloat(orderData?.subtotal || '0') || 0}
      deliveryFee={parseFloat(orderData?.delivery_fee || '0') || 0}
      tipAmount={parseFloat(orderData?.tip_amount || '0') || 0}
      salesTax={parseFloat(orderData?.sales_tax || '0') || 0}
      appliedDiscount={orderData?.appliedDiscount}
    />
  );
};

export default CustomPartyOnDeliveryPostCheckout;