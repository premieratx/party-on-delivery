import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DirectSyncNow: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDirectSync = async () => {
    setIsLoading(true);
    try {
      console.log('Starting direct sync to Google Sheets...');
      
      const { data, error } = await supabase.functions.invoke('direct-sync-sheets');
      
      console.log('Direct sync response:', { data, error });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`🎉 SUCCESS! Data synced to Google Sheets!`, {
          description: `✅ ${data.synced.completedOrders} completed orders, ${data.synced.abandonedOrders} abandoned orders, ${data.synced.affiliateReferrals} affiliate referrals`
        });
        console.log('Direct sync completed successfully:', data);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('❌ Direct sync failed:', error);
      toast.error('Direct sync failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
      <h2 className="text-xl font-bold mb-4">🚀 DIRECT SYNC TO GOOGLE SHEETS</h2>
      <p className="text-sm text-gray-600 mb-4">
        This will directly populate your Google Sheet with sample order data to test the connection.
      </p>
      
      <Button 
        onClick={handleDirectSync} 
        disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="lg"
      >
        {isLoading ? '⚡ Syncing Data...' : '🎯 SYNC NOW - DIRECT METHOD'}
      </Button>
    </div>
  );
};