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
        console.log('🔄 Auto-fixing Shopify product ordering...');
        
        // Trigger the auto-fix function
        const { data, error } = await supabase.functions.invoke('auto-fix-product-ordering');
        
        if (error) {
          console.warn('⚠️ Auto-fix failed:', error);
          return;
        }
        
        console.log('✅ Product ordering automatically fixed:', data);
      } catch (error) {
        console.warn('⚠️ Auto-fix error:', error);
      }
    };

    // Fix ordering on component mount
    fixProductOrdering();
  }, []);

  return null; // This component doesn't render anything
};