import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { optimizedUltraFastSearch } from '@/utils/optimizedUltraFastSearch';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export const ClearSearchCacheButton = () => {
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    console.log('🧹 Manual search cache clear initiated...');
    
    try {
      // Clear all search caches
      optimizedUltraFastSearch.clearAllCaches();
      
      // Force refresh to reload ALL 1067+ products
      await optimizedUltraFastSearch.refreshIndexBackground();
      
      const stats = optimizedUltraFastSearch.getCacheStats();
      console.log('✅ Search cache cleared and reloaded:', stats);
      
      toast.success(`Search cache cleared! Reloaded ${stats.localIndexSize} products for instant search.`);
      
    } catch (error) {
      console.error('❌ Failed to clear search cache:', error);
      toast.error('Failed to clear search cache');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50">
      <Button
        onClick={handleClearCache}
        disabled={clearing}
        variant="outline"
        size="sm"
        className="bg-background/80 backdrop-blur-sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${clearing ? 'animate-spin' : ''}`} />
        {clearing ? 'Clearing...' : 'Clear Search Cache'}
      </Button>
    </div>
  );
};