import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { triggerShopifySync } from '@/utils/shopifySync';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const SystemInitializer: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startTracking } = useAffiliateTracking();

  useEffect(() => {
    // Initialize system on first load
    const initializeSystem = async () => {
      try {
        // Trigger Shopify product ordering sync
        await triggerShopifySync();
        console.log('✅ System initialized successfully');
      } catch (error) {
        console.error('❌ System initialization failed:', error);
      }
    };

    initializeSystem();
  }, []);

  const handleManualSync = async () => {
    try {
      toast({
        title: "Syncing Products",
        description: "Updating product order from Shopify...",
      });
      
      await triggerShopifySync();
      
      toast({
        title: "Sync Complete",
        description: "Products are now sorted according to Shopify order.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync product order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleManualSync}
        variant="outline"
        size="sm"
        className="bg-background border shadow-md"
      >
        Sync Shopify Order
      </Button>
    </div>
  );
};