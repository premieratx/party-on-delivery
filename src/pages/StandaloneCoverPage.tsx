import React from 'react';
import { useParams } from 'react-router-dom';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const StandaloneCoverPage = () => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = urlSlug || window.location.pathname.replace('/', '') || 'premier-concierge';
  
  const { data: coverPage, isLoading, error } = useQuery({
    queryKey: ['standalone-cover-page', slug],
    queryFn: async () => {
      console.log('🚀 Fetching cover page for slug:', slug);
      
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Cover page data:', data);
      return data;
    }
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
          <p className="text-sm text-muted-foreground mt-2">Slug: {slug}</p>
          {error && <p className="text-sm text-red-500 mt-1">Error: {error.message}</p>}
        </div>
      </div>
    );
  }

  // Parse the data from Supabase exactly as you designed it
  const parsedFeatures = Array.isArray(coverPage.checklist) ? coverPage.checklist : [];
  const parsedButtons = Array.isArray(coverPage.buttons) ? coverPage.buttons : [];
  const parsedStyles = typeof coverPage.styles === 'object' && coverPage.styles ? coverPage.styles as any : {};

  console.log('📊 Parsed data:', { parsedFeatures, parsedButtons, parsedStyles });

  // Transform features to the expected format for EditableCoverScreen
  const features = parsedFeatures.map((item: any) => ({
    emoji: item.emoji || '⭐',
    title: item.title || item,
    description: item.description || 'Premium feature'
  }));

  // Transform buttons with click handlers
  const buttons = parsedButtons.map((btn: any) => ({
    ...btn,
    onClick: () => {
      console.log('Button clicked:', btn);
      if (btn.url) {
        window.open(btn.url, '_blank');
      } else if (btn.assignment_type === 'delivery_app') {
        window.location.href = '/delivery';
      }
    }
  }));

  console.log('🎯 Final props:', {
    title: coverPage.title,
    features,
    buttons,
    variant: coverPage.theme || parsedStyles.variant
  });

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
      variant={coverPage.theme || parsedStyles.variant || 'gold'}
      customColors={parsedStyles.customColors}
      typography={parsedStyles.typography}
      logoSizing={parsedStyles.logoSizing}
      positioning={parsedStyles.positioning}
      standalone={true}
    />
  );
};

export default StandaloneCoverPage;