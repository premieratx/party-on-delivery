import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a cover page has free shipping enabled and apply it to the user's session
 */
export const checkAndApplyFreeShipping = async (coverPageSlug: string): Promise<boolean> => {
  try {
    console.log('🎁 Checking free shipping for cover page:', coverPageSlug);
    
    const { data: coverPage, error } = await supabase
      .from('cover_pages')
      .select('free_shipping_enabled, slug, title')
      .eq('slug', coverPageSlug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn('Failed to check cover page free shipping:', error);
      return false;
    }

    if (coverPage?.free_shipping_enabled) {
      console.log('✅ Free shipping enabled for cover page:', coverPage.title);
      
      // Store free shipping status in session
      sessionStorage.setItem('shipping.free', '1');
      sessionStorage.setItem('shipping.free_source', 'cover_page');
      sessionStorage.setItem('shipping.free_cover_slug', coverPageSlug);
      
      // Apply PREMIERE2025 discount code automatically
      const freeShippingDiscount = {
        code: 'PREMIERE2025',
        type: 'free_shipping' as const,
        value: 0
      };
      
      localStorage.setItem('partyondelivery_applied_discount', JSON.stringify(freeShippingDiscount));
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking cover page free shipping:', error);
    return false;
  }
};

/**
 * Check if the current user has free shipping applied from a cover page
 */
export const hasCoverPageFreeShipping = (): boolean => {
  const freeShipping = sessionStorage.getItem('shipping.free');
  const source = sessionStorage.getItem('shipping.free_source');
  
  return freeShipping === '1' && source === 'cover_page';
};

/**
 * Clear free shipping session data
 */
export const clearFreeShipping = (): void => {
  sessionStorage.removeItem('shipping.free');
  sessionStorage.removeItem('shipping.free_source');
  sessionStorage.removeItem('shipping.free_cover_slug');
  localStorage.removeItem('partyondelivery_applied_discount');
};