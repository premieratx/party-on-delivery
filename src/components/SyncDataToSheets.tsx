import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, CheckCircle } from 'lucide-react';

export const SyncDataToSheets: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-existing-data-to-sheets');
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`Successfully synced all data to Google Sheets!`, {
          description: `${data.synced.completedOrders} completed orders, ${data.synced.abandonedOrders} abandoned orders, ${data.synced.affiliateReferrals} affiliate referrals`
        });
        setSynced(true);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Error syncing data:', error);
      toast.error('Failed to sync data to Google Sheets', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Sync Existing Data to Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will populate your Google Sheet with all existing order data from the database.
        </p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Will sync:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All completed orders → "Completed Orders" tab</li>
            <li>• All abandoned orders → "Abandoned Orders" tab</li>
            <li>• All affiliate referrals → "Affiliates" tab</li>
          </ul>
        </div>

        {synced && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Data successfully synced!</span>
          </div>
        )}

        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Syncing...' : 'Sync All Data to Google Sheets'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Google Sheet: POD Delivery App
        </p>
      </CardContent>
    </Card>
  );
};