import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { PostCheckoutStandardized } from '@/components/PostCheckoutStandardized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CustomAppPostCheckout = () => {
  const { appName, appSlug } = useParams<{ appName?: string; appSlug?: string }>();
  const location = useLocation();
  const { toast } = useToast();
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!(appName || appSlug)) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: app, error: appError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', appName || appSlug || '')
          .eq('is_active', true)
          .maybeSingle();

        if (appError || !app) {
          console.error('App not found:', appError);
          setIsLoading(false);
          return;
        }

        setAppConfig(app);

        // Load order data from URL params and session storage
        const urlParams = new URLSearchParams(location.search);
        const sessionId = urlParams.get('session_id');
        const orderNumber = urlParams.get('order_number');
        
        // Get checkout data from session storage
        const checkoutData = sessionStorage.getItem('checkout-completion-data');
        if (checkoutData) {
          const parsedData = JSON.parse(checkoutData);
          
          const orderData = {
            order_number: orderNumber || "Processing...",
            customer_name: parsedData.customerName?.split(' ')[0] || 'Customer',
            total_amount: parsedData.totalAmount || 0,
            delivery_date: parsedData.deliveryDate,
            delivery_time: parsedData.deliveryTime,
            line_items: parsedData.cartItems || [],
            subtotal: parsedData.subtotal || 0,
            delivery_address: parsedData.deliveryAddress,
            share_token: parsedData.shareToken,
            sales_tax: parsedData.salesTax,
            delivery_fee: parsedData.deliveryFee,
            tip_amount: parsedData.tipAmount,
            applied_discount: parsedData.appliedDiscount
          };
          
          setOrderData(orderData);
          
          // Clear session data
          sessionStorage.removeItem('checkout-completion-data');
          
          toast({
            title: "🎉 Order Complete!",
            description: "Payment processed successfully!",
          });
        }

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load checkout configuration",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [appName, location.search, toast]);

  // Timed redirect to app-specific URL if configured
  React.useEffect(() => {
    const redirectUrl = appConfig?.post_checkout_config?.redirect_url;
    if (!redirectUrl) return;

    const delaySec = (appConfig?.post_checkout_config as any)?.redirect_delay_seconds || 5;
    const timer = setTimeout(() => {
      if (redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = redirectUrl;
      }
    }, delaySec * 1000);

    return () => clearTimeout(timer);
  }, [appConfig]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

      {/* No app config found, fallback to standardized confirmation below */}

  // FIXED: Standardized post-checkout with minimal information
  if (appConfig?.custom_post_checkout_config) {
    const config = appConfig.custom_post_checkout_config;
    if (config.heading || config.subheading || config.title || config.message || config.cta_button_text) {
      // Custom post-checkout configuration exists
      return (
        <PostCheckoutStandardized
          orderNumber={orderData?.order_number || 'Unknown'}
          customerName={orderData?.customer_name || 'Customer'}
          deliveryDate={orderData?.delivery_date}
          deliveryTime={orderData?.delivery_time}
          lineItems={orderData?.line_items}
          customHeading={config.title || config.heading}
          customSubheading={config.message || config.subheading}
          customButtonText={config.cta_button_text}
          customButtonUrl={config.cta_button_url}
          backgroundColor={config.background_color}
          textColor={config.text_color}
        />
      );
    }
  }

  // Standard post-checkout with optional config fallback
  const pc = (appConfig as any)?.post_checkout_config || (appConfig as any)?.start_screen_config;
  return (
    <PostCheckoutStandardized
      orderNumber={orderData?.order_number || 'Unknown'}
      customerName={orderData?.customer_name || 'Customer'}
      deliveryDate={orderData?.delivery_date}
      deliveryTime={orderData?.delivery_time}
      lineItems={orderData?.line_items}
      customHeading={(appConfig as any)?.custom_post_checkout_config?.title || (appConfig as any)?.custom_post_checkout_config?.heading || pc?.heading || pc?.headline}
      customSubheading={(appConfig as any)?.custom_post_checkout_config?.message || (appConfig as any)?.custom_post_checkout_config?.subheading || pc?.subheading || pc?.subheadline}
      customButtonText={(appConfig as any)?.custom_post_checkout_config?.cta_button_text || pc?.cta_button_text}
      customButtonUrl={(appConfig as any)?.custom_post_checkout_config?.cta_button_url || pc?.cta_button_url}
      backgroundColor={(appConfig as any)?.custom_post_checkout_config?.background_color || pc?.background_color}
      textColor={(appConfig as any)?.custom_post_checkout_config?.text_color || pc?.text_color}
    />
  );
};

export default CustomAppPostCheckout;
