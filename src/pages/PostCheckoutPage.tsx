import React from 'react';
import { useParams } from 'react-router-dom';
import { PremiumOrderComplete } from '@/components/enhanced-checkout/PremiumOrderComplete';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const PostCheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
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

  // Mock data for demonstration
  const mockOrderItems = [
    { name: 'Premium Wine Selection', price: 89.99, quantity: 1, image: '/placeholder.svg' },
    { name: 'Artisan Cheese Board', price: 45.50, quantity: 1, image: '/placeholder.svg' }
  ];

  const mockDeliveryInfo = {
    address: '123 Main St, Austin, TX 78701',
    date: 'Today',
    time: '2:00 PM - 3:00 PM',
    instructions: 'Ring doorbell, leave at door if no answer'
  };

  return (
    <PremiumOrderComplete
      title={content.title || 'Order Confirmed!'}
      subtitle={content.subtitle || "Thank you for your order. We'll get started on it right away."}
      logoUrl={content.logo_url}
      orderNumber="ORDER-12345"
      orderItems={mockOrderItems}
      subtotal={135.49}
      deliveryFee={5.99}
      total={141.48}
      deliveryInfo={mockDeliveryInfo}
      primaryButton={{
        text: content.continue_shopping_text || 'Continue Shopping',
        url: content.continue_shopping_url || '/',
        color: content.primary_button_color,
        textColor: content.primary_button_text_color
      }}
      secondaryButton={content.manage_order_text ? {
        text: content.manage_order_text,
        url: content.manage_order_url || '/orders',
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