import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const DiscountCodeSync = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Starting discount code sync...');
      
      const { data, error } = await supabase.functions.invoke('fetch-shopify-discounts', {
        body: { activeOnly: true, includeExpired: false }
      });

      if (error) {
        console.error('❌ Sync error:', error);
        toast.error('Failed to sync discount codes: ' + error.message);
        return;
      }

      console.log('✅ Sync successful:', data);
      toast.success(`Successfully synced ${data?.allCodes?.length || 0} discount codes!`);
      
      // Reload the page to show updated codes
      window.location.reload();
      
    } catch (err: any) {
      console.error('🚨 Unexpected error:', err);
      toast.error('Unexpected error during sync: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sync Discount Codes</h3>
          <p className="text-sm text-muted-foreground">
            Load all active RecomSale discount codes from Shopify
          </p>
        </div>
        
        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Codes...
            </>
          ) : (
            'Sync Discount Codes from Shopify'
          )}
        </Button>
      </div>
    </Card>
  );
};