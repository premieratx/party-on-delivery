import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const QuickSync = () => {
  const [syncing, setSyncing] = useState(false);
  
  const syncProducts = async () => {
    setSyncing(true);
    try {
      console.log('🚀 Starting product sync...');
      
      // First try the bulk sync for comprehensive update
      const { data: bulkData, error: bulkError } = await supabase.functions.invoke('shopify-bulk-sync', {});
      
      if (bulkError) {
        console.warn('Bulk sync failed, trying trigger sync:', bulkError);
        
        // Fallback to trigger sync
        const { data, error } = await supabase.functions.invoke('trigger-shopify-sync', {});
        if (error) {
          console.error('Sync error:', error);
          throw error;
        }
        console.log('✅ Trigger sync completed:', data);
      } else {
        console.log('✅ Bulk sync initiated:', bulkData);
      }
      
      // Force refresh the instant cache
      console.log('🔄 Refreshing instant cache...');
      await supabase.functions.invoke('instant-product-cache', { 
        body: { forceRefresh: true } 
      });
      
      // Reload page after successful sync
      setTimeout(() => {
        console.log('🔄 Reloading page to show new products...');
        window.location.reload();
      }, 5000);
      
    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button 
        onClick={syncProducts} 
        disabled={syncing}
        variant="outline"
        size="sm"
      >
        {syncing ? 'Syncing...' : 'Sync Products'}
      </Button>
    </div>
  );
};