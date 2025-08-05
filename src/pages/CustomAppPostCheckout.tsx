import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomPostCheckout } from '@/components/custom-delivery/CustomPostCheckout';
import { OrderCompleteView } from '@/components/OrderCompleteView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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

  // Check if we have custom post-checkout configuration
  const postCheckoutConfig = appConfig.post_checkout_config;
  const hasCustomPostCheckout = postCheckoutConfig && (postCheckoutConfig.heading || postCheckoutConfig.subheading || postCheckoutConfig.redirect_url);

  const handleAddMore = () => {
    if (postCheckoutConfig?.redirect_url) {
      window.location.href = postCheckoutConfig.redirect_url;
    } else {
      window.location.href = `/${appName}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Post-Checkout Header */}
      {hasCustomPostCheckout && (
        <div className="text-center py-8 px-4 border-b">
          {postCheckoutConfig.heading && (
            <h1 className="text-3xl font-bold mb-2 text-primary">{postCheckoutConfig.heading}</h1>
          )}
          {postCheckoutConfig.subheading && (
            <p className="text-lg text-muted-foreground mb-6">{postCheckoutConfig.subheading}</p>
          )}
          {postCheckoutConfig.redirect_url && (
            <Button onClick={handleAddMore} className="mb-4" size="lg">
              Add More
            </Button>
          )}
        </div>
      )}
      
      {/* Default Order Complete View */}
      <OrderCompleteView 
        orderNumber={orderData?.order_number || "Processing..."}
        customerName={orderData?.customer_name || 'Customer'}
        orderItems={orderData?.line_items || []}
        totalAmount={orderData?.total_amount || 0}
        deliveryDate={orderData?.delivery_date}
        deliveryTime={orderData?.delivery_time}
        deliveryAddress={orderData?.delivery_address}
        shareToken={orderData?.share_token}
        isLoading={!orderData}
        subtotal={orderData?.subtotal || 0}
        deliveryFee={orderData?.delivery_fee || 0}
        tipAmount={orderData?.tip_amount || 0}
        salesTax={orderData?.sales_tax || 0}
        appliedDiscount={orderData?.applied_discount}
      />
    </div>
  );
};

export default CustomAppPostCheckout;
