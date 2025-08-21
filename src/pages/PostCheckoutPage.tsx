import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PremiumOrderComplete } from '@/components/enhanced-checkout/PremiumOrderComplete';

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
        .maybeSingle();

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
          <p className="text-muted-foreground">The post-checkout page doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  const content = typeof postCheckoutPage.content === 'string' ? 
    JSON.parse(postCheckoutPage.content) : postCheckoutPage.content;

  return (
    <div className="min-h-screen">
      <PremiumOrderComplete
        title={postCheckoutPage.name}
        subtitle={content.subtitle || "Thank you for your order!"}
        logoUrl={postCheckoutPage.logo_url || content.logo_url}
        orderNumber="ORD-2024-001"
        orderItems={[
          { name: 'Sample Product', price: 29.99, quantity: 1 }
        ]}
        subtotal={29.99}
        deliveryFee={5.00}
        total={34.99}
        deliveryInfo={{
          address: '123 Sample St, Austin, TX 78701',
          date: 'Today',
          time: '2:00 PM - 4:00 PM'
        }}
        primaryButton={{
          text: content.primary_button_text || "Continue Shopping",
          url: content.primary_button_url || "/checkout",
          color: content.primary_button_color || "#d4af37",
          textColor: content.primary_button_text_color || "#000000"
        }}
        secondaryButton={{
          text: content.secondary_button_text || "Track Order",
          url: content.secondary_button_url || "/orders",
          color: content.secondary_button_color || "#8b5cf6",
          textColor: content.secondary_button_text_color || "#ffffff"
        }}
        showOrderDetails={content.show_order_details !== false}
        showDeliveryInfo={content.show_delivery_info !== false}
        showShareOptions={content.show_share_options || false}
        theme={content.theme || "celebration"}
        variant={content.variant || "gold"}
        standalone={true}
      />
    </div>
  );
};

export default PostCheckoutPage;