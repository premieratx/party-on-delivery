import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  CheckCircle2, 
  AlertCircle,
  Play,
  RefreshCw
} from 'lucide-react';

export const AutoSyncTester: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const testAutoSync = async () => {
    setIsTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Test completed orders sync
      const { data: completedData, error: completedError } = await supabase.functions.invoke('auto-sync-completed-orders', {
        body: { action: 'sync_completed' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      // Test abandoned orders sync  
      const { data: abandonedData, error: abandonedError } = await supabase.functions.invoke('auto-sync-abandoned-orders', {
        body: { action: 'sync_abandoned' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const results = {
        completed: completedError ? { success: false, error: completedError.message } : completedData,
        abandoned: abandonedError ? { success: false, error: abandonedError.message } : abandonedData,
        timestamp: new Date().toISOString()
      };

      setTestResults(results);

      if (completedData?.success && abandonedData?.success) {
        toast({
          title: "Auto-Sync Test Successful",
          description: `Synced ${completedData.synced} completed and ${abandonedData.synced} abandoned orders`,
        });
      } else {
        toast({
          title: "Auto-Sync Test Issues",
          description: "Check test results for details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error testing auto-sync:', error);
      toast({
        title: "Test Error",
        description: error.message || "Failed to test auto-sync",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testAbandonedOrderLogic = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Test abandoned order tracking
      const { data, error } = await supabase.functions.invoke('enhanced-abandoned-order-tracking', {
        body: {
          action: 'track_abandoned',
          sessionId: 'test_session_' + Date.now(),
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          cartItems: [{ title: 'Test Product', quantity: 1, price: 25.99 }],
          subtotal: 25.99,
          totalAmount: 30.99
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: "Abandoned Order Logic Test",
        description: data.success ? "Test successful" : "Test failed",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message || "Failed to test abandoned order logic",
        variant: "destructive",
      });
    }
  };

  const syncExistingData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Sync one real order from each category
      const { data, error } = await supabase.functions.invoke('sync-real-orders-test', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: "Real Orders Synced",
        description: `Synced ${data.synced.completed} completed order and ${data.synced.abandoned} abandoned order to Google Sheets`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync sample data",
        variant: "destructive",
      });
    }
  };

  const forceShopifySync = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      toast({
        title: "Starting Shopify Sync",
        description: "Forcing a complete sync with proper collection ordering...",
      });

      // Force refresh Shopify products with proper ordering
      const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: "Shopify Sync Complete",
        description: `Synced ${data.products_synced} products and ${data.collections_synced} collections with proper ordering from Shopify`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync Shopify products",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          Auto-Sync Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={testAutoSync}
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Test Google Sheets Sync
          </Button>
          
          <Button 
            onClick={testAbandonedOrderLogic}
            variant="outline"
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Test Abandoned Logic
          </Button>
          
          <Button 
            onClick={syncExistingData}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sync 1 Real Order Each
          </Button>
          
          <Button 
            onClick={forceShopifySync}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Force Sync Shopify Products
          </Button>
        </div>

        {testResults && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="font-medium">Test Results:</div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={testResults.completed?.success ? "default" : "destructive"}>
                  {testResults.completed?.success ? "✓" : "✗"} Completed Orders
                </Badge>
                {testResults.completed?.success && (
                  <span className="text-sm text-muted-foreground">
                    {testResults.completed.synced} records synced
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={testResults.abandoned?.success ? "default" : "destructive"}>
                  {testResults.abandoned?.success ? "✓" : "✗"} Abandoned Orders
                </Badge>
                {testResults.abandoned?.success && (
                  <span className="text-sm text-muted-foreground">
                    {testResults.abandoned.synced} records synced
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Tested at: {new Date(testResults.timestamp).toLocaleString()}
            </div>

            {(testResults.completed?.error || testResults.abandoned?.error) && (
              <div className="mt-3 p-2 bg-destructive/10 rounded text-sm">
                <div className="font-medium text-destructive">Errors:</div>
                {testResults.completed?.error && (
                  <div>Completed: {testResults.completed.error}</div>
                )}
                {testResults.abandoned?.error && (
                  <div>Abandoned: {testResults.abandoned.error}</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-medium mb-2">🔄 Current Status:</div>
          <div className="space-y-1 text-muted-foreground">
            <div>• Completed orders: Real-time sync ✅</div>
            <div>• Abandoned orders: Hourly sync ✅</div>
            <div>• Deduplication: Active ✅</div>
            <div>• Product ordering: Shopify collection order preserved ✅</div>
            <div>• Google Sheet: 1P9Us5B6NMLE1I-e8XZWa9ZzgN5OAO7S9CI9DhnEtl5U</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};