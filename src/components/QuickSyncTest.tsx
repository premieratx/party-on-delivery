import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const QuickSyncTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log('Starting sync to Google Sheets...');
      
      const { data, error } = await supabase.functions.invoke('sync-existing-data-to-sheets');
      
      console.log('Sync response:', { data, error });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`✅ Successfully synced all data to Google Sheets!`, {
          description: `${data.synced.completedOrders} completed orders, ${data.synced.abandonedOrders} abandoned orders, ${data.synced.affiliateReferrals} affiliate referrals`
        });
        console.log('Sync completed successfully:', data);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('❌ Error syncing data:', error);
      toast.error('Failed to sync data to Google Sheets', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
      <h2 className="text-lg font-semibold mb-4">🔄 Sync Data to Google Sheets</h2>
      <p className="text-sm text-gray-600 mb-4">
        This will populate your Google Sheet "POD Delivery App" with all existing order data.
        <br />
        <strong>Make sure you have these tabs in your sheet:</strong>
      </p>
      <ul className="text-sm text-gray-600 mb-4 list-disc ml-6">
        <li>"Completed Orders" - for all confirmed orders</li>
        <li>"Abandoned Orders" - for abandoned cart data</li>
        <li>"Affiliates" - for affiliate referral tracking</li>
      </ul>
      
      <Button 
        onClick={handleSync} 
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? '⏳ Syncing Data...' : '📊 Sync All Data to Google Sheets NOW'}
      </Button>
      
      <p className="text-xs text-gray-500 mt-2">
        Sheet ID: 1eWrTf1BKWlXTBWlYAIiQTfmYAE4hT1_wM27Pjiyk8xc
      </p>
    </div>
  );
};