import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Database, ShoppingCart } from 'lucide-react';

export const TriggerShopifySync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      console.log('🚀 Starting Shopify sync...');
      
      const { data, error } = await supabase.functions.invoke('trigger-shopify-sync');
      
      if (error) {
        console.error('Sync error:', error);
        throw error;
      }
      
      console.log('✅ Sync completed:', data);
      toast.success(`Sync completed! ${data.productsCount} products loaded`);
      setLastSync(new Date().toLocaleString());
      
    } catch (error: any) {
      console.error('Failed to sync:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Shopify Product Sync
        </CardTitle>
        <CardDescription>
          Fetch and cache products from Shopify to populate the delivery app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center gap-2"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync Products'}
          </Button>
          
          {lastSync && (
            <span className="text-sm text-muted-foreground">
              Last sync: {lastSync}
            </span>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>This will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Fetch all products from Shopify</li>
            <li>Populate the shopify_products_cache table</li>
            <li>Update category mappings</li>
            <li>Clear stale cache entries</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};