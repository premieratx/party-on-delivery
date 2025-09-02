import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export const ManualProductOrderFix: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const manualFixOrdering = async () => {
    setIsLoading(true);
    try {
      console.log('🚨 Emergency reload triggered - calling immediate-sync');
      const { data, error } = await supabase.functions.invoke('immediate-sync');
      
      if (error) {
        console.error('❌ Immediate sync error:', error);
        throw error;
      }
      
      console.log('✅ IMMEDIATE SYNC COMPLETE:', data);
      
      toast({
        title: "Products Reloaded Successfully",
        description: `${data?.products_synced || 0} products loaded. Refreshing page...`,
      });
      
      // Force page refresh to see the products
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Emergency sync failed:', error);
      toast({
        title: "Emergency Sync Failed", 
        description: error.message || "Failed to reload products",
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
          <RefreshCw className="h-5 w-5" />
          Manual Product Order Fix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click this button to emergency reload all products from Shopify. This will fix empty tabs.
          </p>
          <Button 
            onClick={manualFixOrdering}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Emergency Reloading...' : 'Emergency Reload All Products'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};