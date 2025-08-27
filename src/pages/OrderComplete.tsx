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
          // console.log("🔥 ✅ USING SESSION DATA:", parsedData);
          
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
              const affiliateCode = sessionStorage.getItem('affiliate.code') || sessionStorage.getItem('affiliate_code') || localStorage.getItem('affiliate_code') || '';
              const commissionPercentStr = sessionStorage.getItem('commission.percent') || '';
              const commissionPercent = commissionPercentStr ? parseFloat(commissionPercentStr) : undefined;
              
          // FIXED: Send ALL the cart data directly to create-shopify-order
          console.log('💰 Creating Shopify order with FULL DATA:', piId);
          
          try {
            const { data: shopifyResult, error: shopifyError } = await supabase.functions.invoke('create-shopify-order', {
              body: { 
                paymentIntentId: piId,
                // 🔥 SEND THE ACTUAL DATA INSTEAD OF RELYING ON STRIPE METADATA
                cartItems: parsedData.cartItems || [],
                customerInfo: {
                  firstName: parsedData.customerName?.split(' ')[0] || 'Customer',
                  lastName: parsedData.customerName?.split(' ').slice(1).join(' ') || '',
                  email: parsedData.customerEmail,
                  phone: parsedData.customerPhone || ''
                },
                deliveryInfo: {
                  date: parsedData.deliveryDate,
                  time: parsedData.deliveryTime,
                  address: parsedData.deliveryAddress,
                  instructions: parsedData.deliveryInstructions || ''
                },
                amounts: {
                  subtotal: parsedData.subtotal || 0,
                  deliveryFee: parsedData.deliveryFee || 0,
                  salesTax: parsedData.salesTax || 0,
                  tipAmount: parsedData.tipAmount || 0,
                  totalAmount: parsedData.totalAmount || 0
                },
                affiliateCode: affiliateCode
              }
            });
            
            if (shopifyError) {
              console.error('❌ Shopify order creation failed:', shopifyError);
            } else {
              console.log('✅ Shopify order created successfully:', shopifyResult);
              // Store the order number if we got one
              if (shopifyResult?.order_number) {
                localStorage.setItem('orderNumber', shopifyResult.order_number);
              }
            }
          } catch (error) {
            console.error('❌ Error calling create-shopify-order:', error);
          }
            } catch (e) {
              console.error('❌ Failed to process order on complete page:', e);
            }
          }
          
          // ✅ FIXED: Direct Shopify order creation (no webhook dependency)
          console.log('🎉 Order Complete: Shopify order creation handled directly');
          
        } else {
          // No session data available - show basic confirmation
          // console.log("🔥 NO SESSION DATA - SHOWING BASIC CONFIRMATION");
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
              const affiliateCode = sessionStorage.getItem('affiliate.code') || sessionStorage.getItem('affiliate_code') || localStorage.getItem('affiliate_code') || '';
              const commissionPercentStr = sessionStorage.getItem('commission.percent') || '';
              const commissionPercent = commissionPercentStr ? parseFloat(commissionPercentStr) : undefined;
              
          // FIXED: Directly create Shopify order instead of relying on webhook (fallback)
          console.log('💰 Creating Shopify order directly (fallback) with PaymentIntent:', piId);
          
          try {
            const { data: shopifyResult, error: shopifyError } = await supabase.functions.invoke('create-shopify-order', {
              body: { paymentIntentId: piId }
            });
            
            if (shopifyError) {
              console.error('❌ Shopify order creation failed (fallback):', shopifyError);
            } else {
              console.log('✅ Shopify order created successfully (fallback):', shopifyResult);
              if (shopifyResult?.order_number) {
                localStorage.setItem('orderNumber', shopifyResult.order_number);
              }
            }
          } catch (error) {
            console.error('❌ Error calling create-shopify-order (fallback):', error);
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