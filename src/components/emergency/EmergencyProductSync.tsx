import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

export const EmergencyProductSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmergencySync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚨 Starting emergency product sync...');
      
      const { data, error: functionError } = await supabase.functions.invoke('emergency-product-sync');
      
      if (functionError) {
        throw functionError;
      }

      if (data?.success) {
        setResult(data);
        console.log('✅ Emergency sync completed:', data);
      } else {
        throw new Error(data?.error || 'Emergency sync failed');
      }
    } catch (err) {
      console.error('Emergency sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Emergency Product Sync
        </CardTitle>
        <CardDescription>
          Use this to immediately sync products from Shopify if the cache is empty.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleEmergencySync}
          disabled={syncing}
          className="w-full"
          variant="outline"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing Products...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Sync Now
            </>
          )}
        </Button>

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Synced {result.products_synced} products successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};