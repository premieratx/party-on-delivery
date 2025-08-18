import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MultiCTACoverModal from '@/components/custom-delivery/MultiCTACoverModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CoverPageLoaderProps {
  appSlug?: string;
  affiliateCode?: string;
  forceShow?: boolean;
  onClose?: () => void;
}

export const CoverPageLoader: React.FC<CoverPageLoaderProps> = ({
  appSlug,
  affiliateCode,
  forceShow = false,
  onClose
}) => {
  const [coverPage, setCoverPage] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCoverPage();
  }, [appSlug, affiliateCode]);

  const loadCoverPage = async () => {
    try {
      setLoading(true);
      
      // First check if there's a specific cover page for this app slug
      let coverPageData = null;
      
      if (appSlug) {
        console.log('🎨 Looking for cover page for app:', appSlug);
        
        // Check if there's a direct assignment
        const { data: assignment, error: assignmentError } = await supabase
          .from('cover_page_affiliate_assignments')
          .select(`
            *, 
            cover_pages (*)
          `)
          .eq('share_slug', appSlug)
          .eq('cover_pages.is_active', true)
          .maybeSingle();
          
        if (!assignmentError && assignment?.cover_pages) {
          coverPageData = assignment.cover_pages;
        }
      }
      
      // If no specific assignment, check for affiliate code
      if (!coverPageData && affiliateCode) {
        console.log('🎨 Looking for cover page for affiliate:', affiliateCode);
        
        const { data: affiliateAssignment, error: affiliateError } = await supabase
          .from('cover_page_affiliate_assignments')
          .select(`
            *, 
            cover_pages (*),
            affiliates!inner (affiliate_code)
          `)
          .eq('affiliates.affiliate_code', affiliateCode)
          .eq('cover_pages.is_active', true)
          .maybeSingle();
          
        if (!affiliateError && affiliateAssignment?.cover_pages) {
          coverPageData = affiliateAssignment.cover_pages;
        }
      }
      
      // If still no cover page and this is the main app, look for a default with 2 buttons
      if (!coverPageData && (!appSlug || appSlug === 'main-delivery-app')) {
        console.log('🎨 Looking for default cover page with multiple buttons');
        
        const { data: defaultCoverPages, error: pagesError } = await supabase
          .from('cover_pages')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (!pagesError && defaultCoverPages) {
          // Find one with 2 buttons pointing to different delivery apps
          const multiButtonPage = defaultCoverPages.find(page => 
            page.buttons && 
            Array.isArray(page.buttons) && 
            page.buttons.length >= 2 &&
            page.buttons.some((btn: any) => btn.type === 'delivery_app')
          );
          
          if (multiButtonPage) {
            coverPageData = multiButtonPage;
            console.log('🎨 Found multi-button cover page:', multiButtonPage.title);
          }
        }
      }
      
      // Cover pages are now disabled by default - check localStorage setting
      const coverPagesEnabled = localStorage.getItem('admin-cover-pages-enabled') === 'true';
      
      if (!coverPagesEnabled && !forceShow) {
        console.log('🎨 Cover pages disabled by admin setting');
        onClose?.();
        return;
      }

      if (coverPageData && !forceShow) {
        // Check if user has seen this cover page recently (reduced to 4 hours for testing)
        const lastSeen = localStorage.getItem(`cover-page-${coverPageData.id}-seen`);
        const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
        
        if (lastSeen && parseInt(lastSeen) > fourHoursAgo) {
          console.log('🎨 Cover page seen recently, skipping');
          onClose?.();
          return;
        }
      }
      
      if (coverPageData) {
        setCoverPage(coverPageData);
        setShowModal(true);
        console.log('🎨 Loaded cover page:', coverPageData.title);
        
        // Mark as seen
        localStorage.setItem(`cover-page-${coverPageData.id}-seen`, Date.now().toString());
      } else {
        console.log('🎨 No cover page found');
      }
      
    } catch (error) {
      console.error('Error loading cover page:', error);
      toast({
        title: 'Failed to load cover page',
        description: 'Using default experience',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (button: any) => {
    console.log('🎨 Cover page button clicked:', button);
    
    if (button.type === 'delivery_app' && button.app_slug) {
      let targetUrl = `/app/${button.app_slug}`;
      
      // Add affiliate code if present
      const urlAffiliate = button.affiliate_code || affiliateCode;
      if (urlAffiliate) {
        targetUrl += `?ref=${urlAffiliate}`;
      }
      
      // Add other parameters
      const params = new URLSearchParams();
      if (button.free_shipping) params.set('free_shipping', 'true');
      if (button.markup_percent) params.set('markup', button.markup_percent.toString());
      
      if (params.toString()) {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + params.toString();
      }
      
      console.log('🎨 Navigating to:', targetUrl);
      navigate(targetUrl);
      
    } else if (button.type === 'checkout') {
      navigate('/checkout');
    } else if (button.type === 'url' && button.url) {
      window.open(button.url, '_blank');
    }
    
    setShowModal(false);
    onClose?.();
  };

  const createModalButtons = () => {
    if (!coverPage?.buttons) return [];
    
    return coverPage.buttons.map((button: any, index: number) => ({
      text: button.text || `Button ${index + 1}`,
      onClick: () => handleButtonClick(button),
      bgColor: button.bg_color,
      textColor: button.text_color,
      offsetY: button.offset_y,
      spacingBelow: button.spacing_below,
      appSlug: button.app_slug,
      collectionHandle: button.collection_handle
    }));
  };

  if (loading || !coverPage) {
    return null;
  }

  return (
    <MultiCTACoverModal
      open={showModal || forceShow}
      onOpenChange={(open) => {
        setShowModal(open);
        if (!open) onClose?.();
      }}
      title={coverPage.title}
      subtitle={coverPage.subtitle}
      logoUrl={coverPage.logo_url}
      logoHeight={coverPage.logo_height}
      checklistItems={coverPage.checklist || []}
      backgroundImageUrl={coverPage.bg_image_url}
      backgroundVideoUrl={coverPage.bg_video_url}
      buttons={createModalButtons()}
      titleSize={coverPage.styles?.title_size}
      subtitleSize={coverPage.styles?.subtitle_size}
      checklistSize={coverPage.styles?.checklist_size}
      backgroundColor={coverPage.styles?.background_color}
      titleOffsetY={coverPage.styles?.title_offset_y}
      subtitleOffsetY={coverPage.styles?.subtitle_offset_y}
      checklistOffsetY={coverPage.styles?.checklist_offset_y}
      buttonsOffsetY={coverPage.styles?.buttons_offset_y}
      buttonsBottomOffset={coverPage.styles?.buttons_bottom_offset}
      buttonsSpacing={coverPage.styles?.buttons_spacing}
      checklistToButtonsOffset={coverPage.styles?.checklist_to_buttons_offset}
      dotSpacing={coverPage.styles?.dot_spacing}
      dotSize={coverPage.styles?.dot_size}
      logoBgColor={coverPage.styles?.logo_bg_color}
      logoBgMode={coverPage.styles?.logo_bg_mode}
    />
  );
};