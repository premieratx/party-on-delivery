import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PremiumOrderComplete } from '@/components/enhanced-checkout/PremiumOrderComplete';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const PostCheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  
  // Central Time Zone handling
  const CENTRAL_TIMEZONE = 'America/Chicago'; // Handles CST/CDT automatically
  
  // Get order data from URL parameters or session storage with proper timezone handling
  const getOrderData = () => {
    const orderNumber = searchParams.get('order') || 'ORDER-12345';
    const sessionId = searchParams.get('session_id');
    
    // Parse delivery date/time with Central Time Zone precision
    const rawDeliveryDate = searchParams.get('delivery_date');
    const rawDeliveryTime = searchParams.get('delivery_time');
    
    let deliveryDate = 'Today';
    let deliveryTime = '2:00 PM - 3:00 PM';
    
    if (rawDeliveryDate && rawDeliveryTime) {
      try {
        // Create a date object in Central Time
        const deliveryDateTime = new Date(`${rawDeliveryDate}T${rawDeliveryTime}`);
        
        // Convert to Central Time zone
        const centralDateTime = toZonedTime(deliveryDateTime, CENTRAL_TIMEZONE);
        
        // Format for display (keeping it in Central Time)
        deliveryDate = format(centralDateTime, 'EEEE, MMMM do, yyyy');
        deliveryTime = format(centralDateTime, 'h:mm a') + ' CT';
        
        // If it's today, show "Today" instead
        const today = toZonedTime(new Date(), CENTRAL_TIMEZONE);
        if (format(centralDateTime, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          deliveryDate = 'Today';
        }
      } catch (error) {
        console.warn('Failed to parse delivery date/time:', error);
        // Fallback to raw values if parsing fails
        deliveryDate = rawDeliveryDate;
        deliveryTime = rawDeliveryTime;
      }
    }
    
    return {
      orderNumber,
      sessionId,
      subtotal: parseFloat(searchParams.get('subtotal') || '135.49'),
      deliveryFee: parseFloat(searchParams.get('delivery_fee') || '5.99'),
      total: parseFloat(searchParams.get('total') || '141.48'),
      customerEmail: searchParams.get('customer_email'),
      deliveryAddress: searchParams.get('delivery_address'),
      deliveryDate,
      deliveryTime,
      deliveryInstructions: searchParams.get('delivery_instructions'),
      orderItems: [],
      deliveryInfo: null
    };
  };

  const orderData = getOrderData();
  
  const { data: postCheckoutPage, isLoading, error } = useQuery({
    queryKey: ['post-checkout-page', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('post_checkout_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !postCheckoutPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The post-checkout page you're looking for doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  const content = postCheckoutPage.content as any || {};

  // Use real order data when available, fallback to mock data for design purposes
  const orderItems = orderData.orderItems || [
    { 
      name: 'Premium Wine Selection', 
      price: 89.99, 
      quantity: 1, 
      image: '/placeholder.svg' 
    },
    { 
      name: 'Artisan Cheese Board', 
      price: 45.50, 
      quantity: 1, 
      image: '/placeholder.svg' 
    }
  ];

  const deliveryInfo = orderData.deliveryInfo || {
    address: orderData.deliveryAddress || '123 Main St, Austin, TX 78701',
    date: orderData.deliveryDate,
    time: orderData.deliveryTime,
    instructions: orderData.deliveryInstructions || 'Ring doorbell, leave at door if no answer'
  };

  // Enhanced button linking system
  const getPrimaryButtonUrl = () => {
    const baseUrl = content.continue_shopping_url || '/';
    
    // Add tracking parameters for analytics
    const params = new URLSearchParams();
    if (orderData.sessionId) params.set('session_id', orderData.sessionId);
    if (orderData.orderNumber) params.set('ref_order', orderData.orderNumber);
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  const getSecondaryButtonUrl = () => {
    const baseUrl = content.manage_order_url || '/orders';
    
    // Add order number for direct tracking
    if (orderData.orderNumber && !baseUrl.includes('?')) {
      return `${baseUrl}?order=${orderData.orderNumber}`;
    }
    
    return baseUrl;
  };

  return (
    <PremiumOrderComplete
      title={content.title || 'Order Confirmed!'}
      subtitle={content.subtitle || "Thank you for your order. We'll get started on it right away."}
      logoUrl={content.logo_url}
      orderNumber={orderData.orderNumber}
      orderItems={orderItems}
      subtotal={orderData.subtotal}
      deliveryFee={orderData.deliveryFee}
      total={orderData.total}
      deliveryInfo={deliveryInfo}
      primaryButton={{
        text: content.continue_shopping_text || 'Continue Shopping',
        url: getPrimaryButtonUrl(),
        color: content.primary_button_color,
        textColor: content.primary_button_text_color
      }}
      secondaryButton={content.manage_order_text ? {
        text: content.manage_order_text,
        url: getSecondaryButtonUrl(),
        color: content.secondary_button_color,
        textColor: content.secondary_button_text_color
      } : undefined}
      showOrderDetails={content.show_order_details ?? true}
      showDeliveryInfo={content.show_delivery_info ?? true}
      showShareOptions={content.show_share_options ?? false}
      theme={content.theme || 'success'}
      variant={content.variant || 'original'}
      standalone={true}
    />
  );
};

export default PostCheckoutPage;