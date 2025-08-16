// SIMPLE CACHE CLIENT - Build: 2025_08_15_RESTORED

export const getInstantProducts = async () => {
  console.log('📦 Loading instant products...');
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('instant-product-cache', {
      body: { forceRefresh: false }
    });
    
    if (error) {
      console.error('Instant cache error:', error);
      return { products: [], collections: [] };
    }
    
    if (data?.success && data?.data) {
      console.log('✅ Loaded products:', data.data.products?.length || 0);
      console.log('✅ Loaded collections:', data.data.collections?.length || 0);
      return data.data;
    }
    
    return { products: [], collections: [] };
  } catch (error) {
    console.error('getInstantProducts error:', error);
    return { products: [], collections: [] };
  }
};

export const getAllCollectionsCached = async () => {
  console.log('📚 Loading collections...');
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('instant-product-cache', {
      body: { forceRefresh: false }
    });
    
    if (error) {
      console.error('Collections cache error:', error);
      return [];
    }
    
    if (data?.success && data?.data) {
      return data.data.collections || [];
    }
    
    return [];
  } catch (error) {
    console.error('getAllCollectionsCached error:', error);
    return [];
  }
};

export const getCachedCollections = () => getAllCollectionsCached();
export const setCachedCollections = (collections: any[]) => {
  console.log('Setting collections cache:', collections.length);
};
export const clearCachedCollections = () => {
  console.log('Clearing collections cache');
};

export const BUILD_VERSION = '2025_08_15_RESTORED';