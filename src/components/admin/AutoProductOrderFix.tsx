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
        console.log('💥 EMERGENCY FIX: Clearing caches and forcing product order refresh...');
        
        // Use emergency cache clear to fix ordering immediately
        const { data, error } = await supabase.functions.invoke('emergency-cache-clear');
        
        if (error) {
          console.warn('⚠️ Emergency fix failed:', error);
          return;
        }
        
        console.log('✅ EMERGENCY FIX COMPLETE:', data);
        console.log('🎯 All product ordering has been reset - products will load with correct Shopify order');
      } catch (error) {
        console.warn('⚠️ Product order emergency fix error:', error);
      }
    };

    // Apply emergency fix immediately on app load
    fixProductOrdering();
  }, []);

  return null; // This component doesn't render anything
};