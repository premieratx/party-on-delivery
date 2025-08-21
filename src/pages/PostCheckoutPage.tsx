import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PremiumOrderComplete } from '@/components/enhanced-checkout/PremiumOrderComplete';
import { PostCheckoutDataFlow } from '@/components/pages/PostCheckoutDataFlow';
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

  // Extract buttons from content
  const buttons = content.buttons || [];
  const primaryButton = buttons[0] || { text: "Continue Shopping", url: "/checkout" };
  const secondaryButton = buttons[1] || { text: "Track Order", url: "/orders" };

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Main Order Complete Section */}
        <div className="lg:col-span-2">
          <PremiumOrderComplete
            title={content.title || postCheckoutPage.name}
            subtitle={content.subtitle || "Thank you for your order!"}
            logoUrl={postCheckoutPage.logo_url || content.logo_url}
            orderNumber={content.orderNumber || "ORD-2024-001"}
            orderItems={content.orderItems || [
              { name: 'Sample Product', price: 29.99, quantity: 1 }
            ]}
            subtotal={content.orderTotal?.subtotal || 29.99}
            deliveryFee={content.orderTotal?.delivery || 0.00}
            total={content.orderTotal?.total || 34.99}
            deliveryInfo={{
              address: content.deliveryAddress ? 
                `${content.deliveryAddress.street}, ${content.deliveryAddress.city}, ${content.deliveryAddress.state} ${content.deliveryAddress.zip}` :
                '123 Sample St, Austin, TX 78701',
              date: 'Today',
              time: content.estimatedDelivery || '2:00 PM - 4:00 PM'
            }}
            primaryButton={{
              text: primaryButton.text,
              url: primaryButton.url,
              color: primaryButton.color || "#d4af37",
              textColor: primaryButton.textColor || "#000000"
            }}
            secondaryButton={{
              text: secondaryButton.text,
              url: secondaryButton.url,
              color: secondaryButton.color || "#8b5cf6",
              textColor: secondaryButton.textColor || "#ffffff"
            }}
            showOrderDetails={content.show_order_details !== false}
            showDeliveryInfo={content.show_delivery_info !== false}
            showShareOptions={content.showSocialShare || false}
            theme={content.theme || "celebration"}
            variant={content.variant || "gold"}
            standalone={false}
          />
        </div>

        {/* Data Flow Verification Panel */}
        <div className="lg:col-span-1">
          <PostCheckoutDataFlow 
            orderData={{
              order_id: content.orderNumber || "ORD-2024-001",
              customer_email: content.customerEmail,
              delivery_date: content.deliveryDate,
              delivery_time: content.deliveryTime || content.estimatedDelivery,
              subtotal: content.orderTotal?.subtotal || 29.99,
              total_amount: content.orderTotal?.total || 34.99,
              line_items: content.orderItems || []
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCheckoutPage;