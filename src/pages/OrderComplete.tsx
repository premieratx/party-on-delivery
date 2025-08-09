import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PostCheckoutStandardized } from '@/components/PostCheckoutStandardized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OrderComplete = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      const urlParams = new URLSearchParams(location.search);
      const sessionId = urlParams.get('session_id');
      const paymentIntentId = urlParams.get('payment_intent') || urlParams.get('session_id');
      const orderNumber = urlParams.get('order_number');
      const errorParam = urlParams.get('error');
      
      console.log("🔥 ORDER COMPLETE - INSTANT LOAD:", {
        sessionId, paymentIntentId, orderNumber, errorParam
      });
      
      if (errorParam) {
        setIsLoading(false);
        toast({
          title: "Order Processing Error",
          description: "There was an issue creating your order. Please contact support.",
          variant: "destructive",
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
          
          // Process order on server if not already processed (mobile redirect path)
          const piId = paymentIntentId || sessionId || parsedData.paymentIntentId;
          const alreadyProcessed = localStorage.getItem('processedPaymentIntent') === piId;
          if (piId && !alreadyProcessed) {
            try {
              const { data: processed, error: procError } = await supabase.functions.invoke('process-order-complete', {
                body: { paymentIntentId: piId }
              });
              if (procError) {
                console.error('❌ process-order-complete error:', procError);
              } else {
                console.log('✅ process-order-complete success:', processed);
                if (processed?.order?.order_number) {
                  setOrderData((prev: any) => ({
                    ...prev,
                    order_number: processed.order.order_number
                  }));
                  localStorage.setItem('processedPaymentIntent', piId);
                }
              }
            } catch (e) {
              console.error('❌ Failed to process order on complete page:', e);
            }
          }
          
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
          
          // Ensure server-side processing triggers if we landed here directly
          const piId = paymentIntentId || sessionId;
          if (piId) {
            try {
              const { data: processed, error: procError } = await supabase.functions.invoke('process-order-complete', {
                body: { paymentIntentId: piId }
              });
              if (procError) {
                console.error('❌ process-order-complete error:', procError);
              } else {
                console.log('✅ process-order-complete success:', processed);
                if (processed?.order?.order_number) {
                  setOrderData((prev: any) => ({
                    ...prev,
                    order_number: processed.order.order_number
                  }));
                  localStorage.setItem('processedPaymentIntent', piId);
                }
              }
            } catch (e) {
              console.error('❌ Failed to process order on complete page (no session data):', e);
            }
          }
          
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

  // Load app configuration from session context (for standardized UI)
  useEffect(() => {
    const loadConfig = async () => {
      const ctx = sessionStorage.getItem('custom-app-context');
      if (!ctx) return;
      try {
        const { appSlug } = JSON.parse(ctx);
        const { data } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', appSlug)
          .eq('is_active', true)
          .maybeSingle();
        setAppConfig(data);
      } catch (e) {
        // ignore
      }
    };
    loadConfig();
  }, []);

  const cfg: any = appConfig || {};
  const cpc = cfg.custom_post_checkout_config || {};
  const pc = cfg.post_checkout_config || cfg.start_screen_config || {};

  return (
    <PostCheckoutStandardized 
      orderNumber={orderData?.order_number || "Processing..."}
      customerName={orderData?.customer?.first_name || 'Customer'}
      deliveryDate={orderData?.delivery_date}
      deliveryTime={orderData?.delivery_time}
      lineItems={orderData?.line_items}
      subtotalAmount={orderData?.subtotal}
      deliveryFeeAmount={orderData?.delivery_fee}
      salesTaxAmount={orderData?.sales_tax}
      tipAmount={orderData?.tip_amount}
      totalAmount={orderData?.total_amount}
      customHeading={cpc.title || cpc.heading || pc.heading || pc.headline}
      customSubheading={cpc.message || cpc.subheading || pc.subheading || pc.subheadline}
      customButtonText={cpc.cta_button_text || pc.cta_button_text}
      customButtonUrl={cpc.cta_button_url || pc.cta_button_url}
      backgroundColor={cpc.background_color || pc.background_color}
      textColor={cpc.text_color || pc.text_color}
    />
  );
};

export default OrderComplete;