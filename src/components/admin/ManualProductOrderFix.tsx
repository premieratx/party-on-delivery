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
      console.log('🔧 MANUAL FIX: Clearing caches and forcing product order refresh...');
      
      const { data, error } = await supabase.functions.invoke('emergency-cache-clear');
      
      if (error) {
        throw error;
      }
      
      console.log('✅ MANUAL FIX COMPLETE:', data);
      
      toast({
        title: "Product Order Fixed",
        description: "All product caches cleared. Products will load with correct Shopify ordering.",
      });
      
      // Refresh the page to see the changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Manual fix failed:', error);
      toast({
        title: "Fix Failed",
        description: error.message || "Failed to fix product ordering",
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
            Click this button to manually clear all product caches and force products to reload with correct Shopify collection ordering.
          </p>
          <Button 
            onClick={manualFixOrdering}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Fixing Order...' : 'Fix Product Ordering Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};