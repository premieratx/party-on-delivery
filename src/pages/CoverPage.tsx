import React from 'react';
import { useParams } from 'react-router-dom';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const CoverPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: coverPage, isLoading, error } = useQuery({
    queryKey: ['cover-page', slug],
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
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !coverPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The cover page you're looking for doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  // Parse the data from Supabase
  const parsedFeatures = typeof coverPage.checklist === 'string' ? 
    JSON.parse(coverPage.checklist || '[]') : coverPage.checklist || [];
  const parsedButtons = typeof coverPage.buttons === 'string' ? 
    JSON.parse(coverPage.buttons || '[]') : coverPage.buttons || [];
  const parsedStyles = typeof coverPage.styles === 'string' ? 
    JSON.parse(coverPage.styles || '{}') : coverPage.styles || {};

  // Transform features to the expected format
  const features = parsedFeatures.length > 0 ? 
    parsedFeatures.map((item: any, index: number) => ({
      emoji: parsedStyles.features?.[index]?.emoji || '⭐',
      title: typeof item === 'string' ? item : item.title || item,
      description: typeof item === 'string' ? 'Premium feature' : item.description || 'Premium feature'
    })) : [];

  // Transform buttons with click handlers
  const buttons = parsedButtons.map((btn: any) => ({
    ...btn,
    onClick: () => {
      if (btn.target || btn.url) {
        window.location.href = btn.target || btn.url;
      }
    }
  }));

  return (
    <EditableCoverScreen
      title={coverPage.title}
      subtitle={coverPage.subtitle}
      logoUrl={coverPage.logo_url}
      logoEmoji={parsedStyles.logoEmoji || '🎉'}
      backgroundImageUrl={coverPage.bg_image_url}
      backgroundVideoUrl={coverPage.bg_video_url}
      features={features}
      buttons={buttons}
      variant={coverPage.theme || parsedStyles.variant || 'original'}
      customColors={parsedStyles.customColors}
      typography={parsedStyles.typography}
      logoSizing={parsedStyles.logoSizing}
      positioning={parsedStyles.positioning}
      standalone={true}
    />
  );
};

export default CoverPage;