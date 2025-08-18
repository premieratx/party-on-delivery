import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export const CriticalProductSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚨 CRITICAL: Starting immediate product sync...');
      
      const { data, error: functionError } = await supabase.functions.invoke('emergency-product-sync', {
        body: { 
          forceRefresh: true,
          immediate: true,
          clearCache: true
        }
      });
      
      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        setResult(data);
        console.log(`✅ CRITICAL SYNC SUCCESS: ${data.products_synced} products loaded`);
        
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data?.error || 'Critical sync failed');
      }
    } catch (err) {
      console.error('Critical sync error:', err);
      setError(err instanceof Error ? err.message : 'Critical sync failed');
    } finally {
      setSyncing(false);
      setAutoSyncing(false);
    }
  };

  // Auto-trigger sync on mount
  useEffect(() => {
    if (autoSyncing) {
      console.log('🔄 AUTO-TRIGGERING critical product sync...');
      executeSync();
    }
  }, [autoSyncing]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {autoSyncing ? (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            🔄 Auto-loading products from Shopify...
          </AlertDescription>
        </Alert>
      ) : null}

      {syncing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            ⚡ Syncing products from Shopify... Please wait.
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ SUCCESS: Loaded {result.products_synced} products! Refreshing page...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ❌ {error}
          </AlertDescription>
        </Alert>
      )}

      {!syncing && !autoSyncing && (
        <Button 
          onClick={executeSync}
          className="w-full"
          variant="default"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Sync
        </Button>
      )}
    </div>
  );
};