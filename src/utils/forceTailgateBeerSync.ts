import { supabase } from '@/integrations/supabase/client';

export const forceTailgateBeerSync = async () => {
  console.log('🍺 FORCING TAILGATE BEER COLLECTION ORDER SYNC');
  
  try {
    // Force sync the tailgate-beer collection to match exact Shopify order
    console.log('📦 Syncing tailgate-beer collection order...');
    const { data: orderResult, error: orderError } = await supabase.functions.invoke('shopify-collection-order', {
      body: { collection_handle: 'tailgate-beer' }
    });
    
    if (orderError) {
      console.error('❌ Failed to sync tailgate-beer:', orderError);
      throw orderError;
    }
    
    console.log('✅ tailgate-beer order synced successfully:', orderResult);
    
    // Clear browser caches to force refresh
    localStorage.removeItem('products-cache');
    localStorage.removeItem('collections-cache');
    
    // Trigger refresh events
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
    window.dispatchEvent(new CustomEvent('forceProductRefresh'));
    
    console.log('🍺 TAILGATE BEER SYNC COMPLETE - Products now in exact Shopify order');
    
    return { success: true, message: 'Tailgate beer collection order updated' };
    
  } catch (error) {
    console.error('❌ Tailgate beer sync failed:', error);
    return { success: false, error: error.message };
  }
};

// Execute immediately when imported
forceTailgateBeerSync();