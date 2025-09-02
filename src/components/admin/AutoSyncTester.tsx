import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  CheckCircle2, 
  Play,
  RefreshCw
} from 'lucide-react';

export const AutoSyncTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  // Ensure admin authentication for all operations
  const ensureAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated - please sign in');
    }
    
    // Verify admin status
    const { data: adminData } = await supabase.functions.invoke('verify-admin-google', {
      body: { email: session.user.email }
    });
    
    if (!adminData?.isAdmin) {
      throw new Error('Admin access required');
    }
    
    return session;
  };

  // Combined function for testing Google Sheets sync
  const testGoogleSheetsSync = async () => {
    setIsLoading(true);
    try {
      const session = await ensureAdminAuth();

      // Test both completed and abandoned orders sync
      const { data: completedData, error: completedError } = await supabase.functions.invoke('auto-sync-completed-orders', {
        body: { action: 'sync_completed' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

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
          title: "Google Sheets Sync Test Successful",
          description: `Synced ${completedData.synced} completed and ${abandonedData.synced} abandoned orders`,
        });
      } else {
        toast({
          title: "Sync Test Issues",
          description: "Check test results for details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error testing sync:', error);
      toast({
        title: "Test Error",
        description: error.message || "Failed to test sync",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync real orders to Google Sheets
  const syncRealOrders = async () => {
    setIsLoading(true);
    try {
      const session = await ensureAdminAuth();

      const { data, error } = await supabase.functions.invoke('sync-real-orders-test', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: "Real Orders Synced",
        description: `Synced ${data.synced.completed} completed and ${data.synced.abandoned} abandoned orders to Google Sheets`,
      });
    } catch (error: any) {
      console.error('Error syncing real orders:', error);
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Force Shopify product sync with proper ordering
  const forceShopifySync = async () => {
    setIsLoading(true);
    try {
      const session = await ensureAdminAuth();

      toast({
        title: "Starting Shopify Sync",
        description: "Forcing complete sync with proper collection ordering...",
      });

      const { data, error } = await supabase.functions.invoke('unified-shopify-sync', {
        body: { forceRefresh: true },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: "Shopify Sync Complete",
        description: `Synced ${data.products_synced} products and ${data.collections_synced} collections with proper ordering`,
      });
    } catch (error: any) {
      console.error('Error syncing Shopify:', error);
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync Shopify products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            onClick={testGoogleSheetsSync}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Test Google Sheets Sync
          </Button>
          
          <Button 
            onClick={syncRealOrders}
            disabled={isLoading}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Sync Real Orders to Sheets
          </Button>
          
          <Button 
            onClick={forceShopifySync}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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