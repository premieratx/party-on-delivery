import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const DirectBulkSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runBulkSync = async () => {
    setSyncing(true);
    setResult(null);
    
    try {
      console.log('🚀 Starting direct bulk sync...');
      
      // Call the bulk sync function directly
      const { data, error } = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });
      
      if (error) {
        console.error('Bulk sync error:', error);
        setResult({ success: false, error: error.message });
      } else {
        console.log('✅ Bulk sync completed:', data);
        setResult(data);
      }
      
    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      setResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm">Direct Bulk Sync</h3>
        
        <Button 
          onClick={runBulkSync} 
          disabled={syncing}
          variant="outline"
          size="sm"
        >
          {syncing ? 'Syncing...' : 'Run Bulk Sync'}
        </Button>
        
        {result && (
          <div className="text-xs">
            <div className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </div>
            {result.productCount && (
              <div className="text-muted-foreground">
                Products: {result.productCount}
              </div>
            )}
            {result.error && (
              <div className="text-red-600 text-wrap break-all">
                {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};