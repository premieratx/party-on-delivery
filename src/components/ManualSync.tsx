import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, ShoppingCart } from 'lucide-react';

export const ManualSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  
  console.log('🔧 ManualSync: Component rendering');
  
  const testCache = async () => {
    setTesting(true);
    console.log('🧪 Starting cache test...');
    
    try {
      alert('Testing cache - check console');
      console.log('📞 Calling instant-product-cache...');
      
      const result = await supabase.functions.invoke('instant-product-cache', {
        body: { forceRefresh: true }
      });
      
      console.log('📞 Cache result:', result);
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
    console.log('🚀 Starting bulk sync...');
    
    try {
      alert('Starting bulk sync - check console');
      console.log('📞 Calling shopify-bulk-sync...');
      
      const result = await supabase.functions.invoke('shopify-bulk-sync', {
        body: { forceRefresh: true }
      });
      
      console.log('📞 Sync result:', result);
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
    <div className="fixed top-4 right-4 z-[9999] space-y-2 bg-white p-4 rounded-lg shadow-lg border-4 border-red-500">
      <div className="text-red-600 font-bold text-center mb-2">
        MANUAL SYNC CONTROLS
      </div>
      
      <Button 
        onClick={testCache}
        disabled={testing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {testing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Database className="w-4 h-4 mr-2" />
            Test Cache
          </>
        )}
      </Button>
      
      <Button 
        onClick={forceBulkSync}
        disabled={syncing}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {syncing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Force Sync
          </>
        )}
      </Button>
      
      <div className="text-xs text-gray-600 text-center">
        Check browser console (F12) for logs
      </div>
    </div>
  );
};