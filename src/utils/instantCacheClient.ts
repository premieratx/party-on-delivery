// SIMPLE CACHE CLIENT - Build: 2025_08_15_RESTORED

export const getInstantProducts = async () => {
  console.log('📦 Loading instant products...');
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('instant-product-cache');
    
    if (error) {
      console.error('Instant cache error:', error);
      return { products: [], collections: [] };
    }
    
    return data?.data || { products: [], collections: [] };
  } catch (error) {
    console.error('getInstantProducts error:', error);
    return { products: [], collections: [] };
  }
};

export const getAllCollectionsCached = async () => {
  console.log('📚 Loading collections...');
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('instant-product-cache');
    
    if (error) {
      console.error('Collections cache error:', error);
      return [];
    }
    
    return data?.data?.collections || [];
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