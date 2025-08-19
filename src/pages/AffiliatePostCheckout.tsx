import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PostCheckoutScreen {
  id: string;
  title: string;
  subtitle: string;
  logo_url?: string;
  button_1_text: string;
  button_1_url: string;
  button_2_text: string;
  button_2_url: string;
  background_color: string;
  text_color: string;
  styles: any;
}

export default function AffiliatePostCheckout() {
  const { affiliateSlug } = useParams<{ affiliateSlug: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [postCheckoutScreen, setPostCheckoutScreen] = useState<PostCheckoutScreen | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    loadPostCheckoutScreen();
    loadOrderInfo();
  }, [affiliateSlug]);

  const loadPostCheckoutScreen = async () => {
    if (!affiliateSlug) return;

    try {
      // Find post-checkout screen by affiliate slug
      const { data: coverPageData, error: coverError } = await supabase
        .from('cover_pages')
        .select('id')
        .eq('affiliate_slug', affiliateSlug)
        .single();

      if (coverError) throw coverError;

      const { data: screenData, error: screenError } = await supabase
        .from('post_checkout_screens')
        .select('*')
        .eq('cover_page_id', coverPageData.id)
        .single();

      if (screenError) throw screenError;

      setPostCheckoutScreen(screenData);

    } catch (error) {
      console.error('Error loading post-checkout screen:', error);
      
      // Fallback to default post-checkout if no custom screen found
      setPostCheckoutScreen({
        id: 'default',
        title: 'Thank You for Your Order!',
        subtitle: 'Your order has been confirmed and will be delivered soon.',
        button_1_text: 'Continue Shopping',
        button_1_url: '/',
        button_2_text: 'Track Order',
        button_2_url: '/orders',
        background_color: '#ffffff',
        text_color: '#000000',
        styles: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrderInfo = () => {
    // Load order information from session storage
    try {
      const completionInfo = sessionStorage.getItem('affiliate_order_completion');
      if (completionInfo) {
        setOrderInfo(JSON.parse(completionInfo));
      }
    } catch (error) {
      console.error('Error loading order info:', error);
    }
  };

  // SEO and meta tags
  useEffect(() => {
    if (postCheckoutScreen) {
      document.title = `${postCheckoutScreen.title} | Order Complete`;
      
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = postCheckoutScreen.subtitle || 'Your order has been completed successfully.';
    }
  }, [postCheckoutScreen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!postCheckoutScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested post-checkout page could not be found.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const isPreview = searchParams.get('preview') === 'true';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: postCheckoutScreen.background_color,
        color: postCheckoutScreen.text_color 
      }}
    >
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Logo */}
          {postCheckoutScreen.logo_url && (
            <div className="flex justify-center">
              <img 
                src={postCheckoutScreen.logo_url} 
                alt="Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold" style={{ color: postCheckoutScreen.text_color }}>
            {postCheckoutScreen.title}
          </h1>

          {/* Subtitle */}
          {postCheckoutScreen.subtitle && (
            <p className="text-lg opacity-80" style={{ color: postCheckoutScreen.text_color }}>
              {postCheckoutScreen.subtitle}
            </p>
          )}

          {/* Order Info */}
          {orderInfo && !isPreview && (
            <div className="bg-background/10 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Order Details</h3>
              {orderInfo.orderId && (
                <p className="text-sm">Order ID: {orderInfo.orderId}</p>
              )}
              <p className="text-sm opacity-80">
                A confirmation email will be sent to you shortly.
              </p>
            </div>
          )}

          {/* Preview Notice */}
          {isPreview && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                🔍 Preview Mode - This is how your post-checkout screen will look
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {postCheckoutScreen.button_1_text && postCheckoutScreen.button_1_url && (
              <Button 
                size="lg"
                onClick={() => window.location.href = postCheckoutScreen.button_1_url}
                className="min-w-[150px]"
              >
                {postCheckoutScreen.button_1_text}
              </Button>
            )}
            
            {postCheckoutScreen.button_2_text && postCheckoutScreen.button_2_url && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = postCheckoutScreen.button_2_url}
                className="min-w-[150px]"
              >
                {postCheckoutScreen.button_2_text}
              </Button>
            )}
          </div>

          {/* Affiliate Credit (Hidden) */}
          {affiliateSlug && !isPreview && (
            <div className="text-xs opacity-50 pt-4">
              Powered by {affiliateSlug}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}