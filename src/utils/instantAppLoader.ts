// Instant app-to-app switching optimization
export class InstantAppLoader {
  private static instance: InstantAppLoader;
  private cache = new Map<string, any>();
  private preloadedApps = new Set<string>();

  static getInstance(): InstantAppLoader {
    if (!InstantAppLoader.instance) {
      InstantAppLoader.instance = new InstantAppLoader();
    }
    return InstantAppLoader.instance;
  }

  // Preload critical apps data
  async preloadApp(appSlug: string): Promise<void> {
    if (this.preloadedApps.has(appSlug)) return;

    console.log('⚡ Preloading app:', appSlug);
    
    try {
      // Preload app configuration and products in parallel
      const promises = [
        this.loadAppConfig(appSlug),
        this.loadAppProducts(appSlug)
      ];

      await Promise.all(promises);
      this.preloadedApps.add(appSlug);
      console.log('✅ App preloaded:', appSlug);
    } catch (error) {
      console.error('❌ Failed to preload app:', appSlug, error);
    }
  }

  // Get cached app data instantly
  getAppData(appSlug: string): any {
    return this.cache.get(`app_${appSlug}`);
  }

  getProductData(appSlug: string): any {
    return this.cache.get(`products_${appSlug}`);
  }

  private async loadAppConfig(appSlug: string): Promise<void> {
    const cacheKey = `app_${appSlug}`;
    
    if (!this.cache.has(cacheKey)) {
      try {
        // Import supabase client dynamically to avoid circular dependencies
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Load app config from Supabase
        const { data, error } = await supabase
          .from('delivery_apps')
          .select('*')
          .eq('slug', appSlug)
          .single();

        if (error) {
          console.warn(`Failed to load app config for ${appSlug}:`, error);
          this.cache.set(cacheKey, null);
          return;
        }

        this.cache.set(cacheKey, data);
        console.log(`✅ Cached app config for ${appSlug}`);
      } catch (error) {
        console.error(`Failed to load app config for ${appSlug}:`, error);
        this.cache.set(cacheKey, null);
      }
    }
  }

  private async loadAppProducts(appSlug: string): Promise<void> {
    const cacheKey = `products_${appSlug}`;
    
    if (!this.cache.has(cacheKey)) {
      try {
        // Import instant cache client
        const { getInstantProducts } = await import('./instantCacheClient');
        
        // Load products and filter by app if needed
        const productData = await getInstantProducts({ forceRefresh: false });
        
        // For now, cache all products - in the future we can filter by app-specific collections
        this.cache.set(cacheKey, productData);
        console.log(`✅ Cached products for ${appSlug}`);
      } catch (error) {
        console.error(`Failed to load products for ${appSlug}:`, error);
        this.cache.set(cacheKey, null);
      }
    }
  }

  // Initialize preloading for common apps - DISABLED
  async initializePreloading(): Promise<void> {
    // Completely disabled to prevent loading animations
    return;
  }

  // Clear cache when needed
  clearCache(): void {
    this.cache.clear();
    this.preloadedApps.clear();
    console.log('🧹 App cache cleared');
  }
}

// Initialize on app load
export const instantAppLoader = InstantAppLoader.getInstance();

// Don't auto-initialize to prevent loading errors
// Only load apps when actually needed