import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component that automatically fixes Shopify product ordering on mount
 * Ensures products display in the same order as Shopify collections
 */
export const AutoProductOrderFix = () => {
  useEffect(() => {
    const fixProductOrdering = async () => {
      try {
        console.log('⚡ IMMEDIATE FIX: Triggering product order sync...');
        
        // Trigger immediate fix for all product ordering
        const { data, error } = await supabase.functions.invoke('immediate-product-order-fix');
        
        if (error) {
          console.warn('⚠️ Immediate fix failed:', error);
          return;
        }
        
        console.log('✅ IMMEDIATE FIX COMPLETE:', data);
        console.log(`🎯 Fixed ordering for ${data.products_synced} products across ${data.collections_synced} collections`);
      } catch (error) {
        console.warn('⚠️ Product order fix error:', error);
      }
    };

    // Fix all product ordering immediately on app load
    fixProductOrdering();
  }, []);

  return null; // This component doesn't render anything
};