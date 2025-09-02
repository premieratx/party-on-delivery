import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AutoSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const triggerSync = async () => {
      if (syncing) return;
      
      console.log('🚀 Auto-triggering Shopify sync...');
      setSyncing(true);
      setMessage('🔄 Syncing Shopify products...');
      
      try {
        const { data, error } = await supabase.functions.invoke('trigger-shopify-sync', {
          body: {}
        });
        
        if (error) throw error;
        
        console.log('✅ Sync result:', data);
        setMessage(`✅ ${data.message || 'Sync complete!'}`);
        
        // Reload page after successful sync
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } catch (error) {
        console.error('❌ Sync failed:', error);
        setMessage('❌ Sync failed - check console');
      } finally {
        setSyncing(false);
      }
    };

    // Auto-trigger sync when component mounts
    triggerSync();
  }, []);

  if (!syncing && !message) return null;

  return (
    <div className="fixed top-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        {syncing && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};