import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getInstantProducts } from '@/utils/instantCacheClient';

interface SpeedContextValue {
  warmed: boolean;
  productsCount: number;
  collectionsCount: number;
}

const SpeedContext = createContext<SpeedContextValue>({ warmed: false, productsCount: 0, collectionsCount: 0 });

export const useSpeed = () => useContext(SpeedContext);

export const SpeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SpeedContextValue>({ warmed: false, productsCount: 0, collectionsCount: 0 });

  useEffect(() => {
    let mounted = true;

    // Warm instant product cache immediately
    getInstantProducts({ forceRefresh: false, timeoutMs: 350 })
      .then((payload) => {
        if (!mounted) return;
        setState({ warmed: true, productsCount: payload.products?.length || 0, collectionsCount: payload.collections?.length || 0 });
      })
      .catch(() => {
        if (!mounted) return;
        setState((s) => ({ ...s, warmed: true }));
      });

    // Prefetch critical routes/modules on idle
    const idle = (cb: () => void) => {
      // @ts-ignore
      const ric = window.requestIdleCallback || ((fn: any) => setTimeout(fn, 200));
      ric(cb);
    };

    idle(() => {
      Promise.allSettled([
        import('@/pages/Checkout'),
        import('@/pages/OrderComplete'),
        import('@/pages/CustomAppView'),
        import('@/components/delivery/ProductCategories'),
        import('@/components/delivery/UltraFastProductGrid'),
        import('@/components/custom-delivery/CustomProductCategories'),
      ]).catch(() => {});
    });

    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => state, [state]);
  return <SpeedContext.Provider value={value}>{children}</SpeedContext.Provider>;
};
