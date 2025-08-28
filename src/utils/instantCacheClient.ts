// OPTIMIZED SMART CACHE CLIENT - Build: 2025_08_18_SMART_CACHE

export const getInstantProducts = async (category?: string, forceRefresh = false) => {
  console.log('🚀 Loading products via smart cache...', { category, forceRefresh });
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { getProductsWithFallback } = await import('./emergencyFallback');
    
    // Use new smart cache manager
    const { data, error } = await supabase.functions.invoke('smart-cache-manager', {
      body: { 
        action: 'get', 
        category,
        forceRefresh 
      }
    });
    
    if (error) {
      console.error('Smart cache error, using fallback:', error);
      
      // Use emergency fallback when edge function fails
      try {
        const fallbackProducts = await getProductsWithFallback(category, 30);
        return { 
          products: fallbackProducts, 
          collections: [], 
          categories: [] 
        };
      } catch (fallbackError) {
        console.error('Emergency fallback also failed:', fallbackError);
        return { products: [], collections: [], categories: [] };
      }
    }
    
    if (data?.success && data?.data) {
      console.log('✅ Smart cache loaded:', {
        products: data.data.products?.length || 0,
        collections: data.data.collections?.length || 0,
        categories: data.data.categories?.length || 0
      });
      return data.data;
    }
    
    return { products: [], collections: [], categories: [] };
  } catch (error) {
    console.error('getInstantProducts error:', error);
    return { products: [], collections: [], categories: [] };
  }
};

export const getAllCollectionsCached = async () => {
  console.log('📚 Loading collections via smart cache...');
  const result = await getInstantProducts();
  return result.collections || [];
};

export const refreshProductCache = async () => {
  console.log('🔄 Triggering cache refresh...');
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('smart-cache-manager', {
      body: { action: 'refresh' }
    });
    
    if (error) {
      console.error('Cache refresh error:', error);
      return false;
    }
    
    console.log('✅ Cache refresh triggered');
    return true;
  } catch (error) {
    console.error('refreshProductCache error:', error);
    return false;
  }
};

export const getCacheStats = async () => {
  console.log('📊 Getting cache stats...');
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('smart-cache-manager', {
      body: { action: 'stats' }
    });
    
    if (error) {
      console.error('Cache stats error:', error);
      return null;
    }
    
    return data?.stats || null;
  } catch (error) {
    console.error('getCacheStats error:', error);
    return null;
  }
};

export const getCachedCollections = () => getAllCollectionsCached();
export const setCachedCollections = (collections: any[]) => {
  console.log('Setting collections cache:', collections.length);
};
export const clearCachedCollections = () => {
  console.log('Clearing collections cache');
};

export const BUILD_VERSION = '2025_08_18_SMART_CACHE';