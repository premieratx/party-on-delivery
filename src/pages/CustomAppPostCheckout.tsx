import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { PostCheckoutStandardized } from '@/components/PostCheckoutStandardized';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CustomAppPostCheckout = () => {
  const { appName } = useParams<{ appName: string }>();
  const location = useLocation();
  const { toast } = useToast();
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!appName) {
        setIsLoading(false);
        return;
      }

      try {
        // Load app configuration
        const { data: app, error: appError } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('app_slug', appName)
          .eq('is_active', true)
          .single();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!appConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">App Not Found</h1>
          <p className="text-muted-foreground">The delivery app could not be found.</p>
        </div>
      </div>
    );
  }

  // FIXED: Standardized post-checkout with minimal information
  if (appConfig?.custom_post_checkout_config) {
    const config = appConfig.custom_post_checkout_config;
    if (config.heading || config.subheading || config.cta_button_text) {
      // Custom post-checkout configuration exists
      return (
        <PostCheckoutStandardized
          orderNumber={orderData?.order_number || 'Unknown'}
          customerName={orderData?.customer_name || 'Customer'}
          customHeading={config.heading}
          customSubheading={config.subheading}
          customButtonText={config.cta_button_text}
          customButtonUrl={config.cta_button_url}
          backgroundColor={config.background_color}
          textColor={config.text_color}
        />
      );
    }
  }

  // Standard post-checkout for apps without custom config
  return (
    <PostCheckoutStandardized
      orderNumber={orderData?.order_number || 'Unknown'}
      customerName={orderData?.customer_name || 'Customer'}
    />
  );
};

export default CustomAppPostCheckout;
