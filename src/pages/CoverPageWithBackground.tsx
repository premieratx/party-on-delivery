import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';

export default function CoverPageWithBackground() {
  const { slug } = useParams<{ slug: string }>();

  const { data: coverPage, isLoading, error } = useQuery({
    queryKey: ['cover-page', slug],
    queryFn: async () => {
      console.log('🔍 Loading cover page with slug:', slug);
      
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading cover page:', error);
        throw error;
      }

      return data;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cover page...</p>
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
            The cover page you're looking for doesn't exist or has been disabled.
          </p>
        </div>
      </div>
    );
  }

  // Parse the data
  const parsedFeatures = typeof coverPage.checklist === 'string' 
    ? JSON.parse(coverPage.checklist || '[]') 
    : coverPage.checklist || [];
    
  const parsedButtons = typeof coverPage.buttons === 'string' 
    ? JSON.parse(coverPage.buttons || '[]') 
    : coverPage.buttons || [];
    
  const parsedStyles = typeof coverPage.styles === 'string' 
    ? JSON.parse(coverPage.styles || '{}') 
    : coverPage.styles || {};

  // Transform features to expected format
  const features = parsedFeatures.map((item: any, index: number) => ({
    emoji: parsedStyles.features?.[index]?.emoji || item.emoji || '⭐',
    title: typeof item === 'string' ? item : item.title || item,
    description: typeof item === 'string' ? 'Premium feature' : item.description || 'Premium feature'
  }));

  // Transform buttons with navigation
  const buttons = parsedButtons.map((button: any) => ({
    ...button,
    onClick: () => {
      if (button.url) {
        window.open(button.url, '_blank');
      }
    }
  }));

  return (
    <div className="min-h-screen bg-background">
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
  );
}