import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';

export default function StandaloneCoverPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: coverPage, isLoading, error } = useQuery({
    queryKey: ['standalone-cover-page', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !coverPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Parse data safely
  const parsedFeatures = Array.isArray(coverPage.checklist) 
    ? coverPage.checklist 
    : (typeof coverPage.checklist === 'string' ? JSON.parse(coverPage.checklist || '[]') : []);
    
  const parsedButtons = Array.isArray(coverPage.buttons) 
    ? coverPage.buttons 
    : (typeof coverPage.buttons === 'string' ? JSON.parse(coverPage.buttons || '[]') : []);
    
  const parsedStyles = typeof coverPage.styles === 'object' && coverPage.styles !== null
    ? coverPage.styles 
    : (typeof coverPage.styles === 'string' ? JSON.parse(coverPage.styles || '{}') : {});

  // Transform features to expected format
  const features = parsedFeatures.map((item: any, index: number) => ({
    emoji: parsedStyles.features?.[index]?.emoji || item.emoji || '⭐',
    title: typeof item === 'string' ? item : item.title || item,
    description: typeof item === 'string' ? 'Premium feature' : item.description || 'Premium feature'
  }));

  // Transform buttons with direct navigation (no dependencies)
  const buttons = parsedButtons.map((button: any) => ({
    ...button,
    onClick: () => {
      if (button.url) {
        window.open(button.url, '_blank');
      } else if (button.delivery_app_id) {
        // Direct link to delivery app - no dependencies
        window.open('/delivery', '_blank');
      }
    }
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Completely hide any global navigation for cover pages */}
      <style>
        {`
          body { 
            overflow-x: hidden; 
            margin: 0;
            padding: 0;
          }
          [data-global-nav], 
          [data-bottom-nav], 
          .bottom-navigation,
          .global-cart-provider > *:not(.standalone-cover-content),
          .fixed.bottom-0,
          .fixed.top-0,
          nav:not(.cover-page-nav),
          header:not(.cover-page-header),
          .floating-cart,
          .cart-overlay,
          .navigation-menu {
            display: none !important;
          }
        `}
      </style>
      
      <div className="standalone-cover-content">
        <EditableCoverScreen
          title={coverPage.title}
          subtitle={coverPage.subtitle}
          logoUrl={coverPage.logo_url}
          logoEmoji={parsedStyles.logoEmoji}
          backgroundImageUrl={coverPage.bg_image_url}
          backgroundVideoUrl={coverPage.bg_video_url}
          features={features}
          buttons={buttons}
          variant={parsedStyles.variant || coverPage.theme || 'gold'}
          standalone={true}
          sizing={parsedStyles.sizing}
          positioning={parsedStyles.positioning}
        />
      </div>
    </div>
  );
}