import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  delay?: number;
}

export function usePreloader() {
  const preloadCache = useRef(new Map());
  const preloadQueue = useRef<Array<() => Promise<void>>>([]);
  const isProcessing = useRef(false);

  const processQueue = async () => {
    if (isProcessing.current || preloadQueue.current.length === 0) return;
    
    isProcessing.current = true;
    
    while (preloadQueue.current.length > 0) {
      const task = preloadQueue.current.shift();
      if (task) {
        try {
          await task();
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('Preload task failed:', error);
        }
      }
    }
    
    isProcessing.current = false;
  };

  const preloadCollections = (options: PreloadOptions = {}) => {
    const cacheKey = 'collections';
    
    if (preloadCache.current.has(cacheKey)) return;
    preloadCache.current.set(cacheKey, true);

    const task = async () => {
      try {
        console.log('🚀 Preloading collections...');
        await supabase.functions.invoke('get-all-collections');
        console.log('✅ Collections preloaded');
      } catch (error) {
        console.warn('Collections preload failed:', error);
      }
    };

    if (options.delay) {
      setTimeout(() => {
        preloadQueue.current.push(task);
        processQueue();
      }, options.delay);
    } else {
      preloadQueue.current.push(task);
      processQueue();
    }
  };

  const preloadDeliveryApps = (options: PreloadOptions = {}) => {
    const cacheKey = 'delivery-apps';
    
    if (preloadCache.current.has(cacheKey)) return;
    preloadCache.current.set(cacheKey, true);

    const task = async () => {
      try {
        console.log('🚀 Preloading delivery apps...');
        const { data } = await supabase
          .from('delivery_app_variations')
          .select('*')
          .eq('is_active', true)
          .limit(10);
        
        console.log(`✅ ${data?.length || 0} delivery apps preloaded`);
      } catch (error) {
        console.warn('Delivery apps preload failed:', error);
      }
    };

    if (options.delay) {
      setTimeout(() => {
        preloadQueue.current.push(task);
        processQueue();
      }, options.delay);
    } else {
      preloadQueue.current.push(task);
      processQueue();
    }
  };

  const preloadCriticalData = () => {
    // Immediate preload of critical data
    preloadCollections({ priority: 'high' });
    
    // Delayed preload of secondary data
    preloadDeliveryApps({ priority: 'medium', delay: 500 });
  };

  return {
    preloadCollections,
    preloadDeliveryApps,
    preloadCriticalData
  };
}