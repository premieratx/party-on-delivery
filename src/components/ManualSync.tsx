import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, ShoppingCart } from 'lucide-react';

export const ManualSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  
  
  
  const testCache = async () => {
    setTesting(true);
    
    
    try {
      alert('Testing cache - check console');
      
      
      const result = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: true }
      });
      
      
      alert(`Cache result: ${JSON.stringify(result)}`);
      
    } catch (error) {
      console.error('❌ Cache test error:', error);
      alert(`Cache error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const forceBulkSync = async () => {
    setSyncing(true);
    
    
    try {
      alert('Starting bulk sync - check console');
      
      
      const result = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });
      
      
      alert(`Sync result: ${JSON.stringify(result)}`);
      
      if (result.data?.success) {
        alert('Sync completed! Reloading page...');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ Sync error:', error);
      alert(`Sync error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button 
      onClick={forceBulkSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="text-[9px] h-6 py-0 px-2 w-full"
    >
      {syncing ? 'Sync...' : 'Manual'}
    </Button>
  );
};