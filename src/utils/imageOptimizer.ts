// Enhanced Image optimization utilities for ultra-fast loading
export class ImageOptimizer {
  // Convert Shopify image URLs to optimized versions with aggressive compression
  static optimizeShopifyImageUrl(url: string, width = 400, quality = 75): string {
    if (!url || !url.includes('shopify')) return url;
    
    // Remove existing size parameters
    const baseUrl = url.split('?')[0];
    
    // Add optimized parameters for sub-0.25s loading
    return `${baseUrl}?v=${Math.floor(Date.now()/60000)}&width=${width}&quality=${quality}&format=webp&crop=center`;
  }

  // Get responsive image URLs for different screen sizes with aggressive optimization
  static getResponsiveImageUrls(url: string) {
    if (!url) return { mobile: url, tablet: url, desktop: url };
    
    return {
      mobile: this.optimizeShopifyImageUrl(url, 250, 70),    // Very small, aggressive compression
      tablet: this.optimizeShopifyImageUrl(url, 400, 75),    // Medium size, good compression
      desktop: this.optimizeShopifyImageUrl(url, 600, 80)    // Desktop size, balanced quality
    };
  }

  // Preload critical images with timeout for speed
  static preloadImage(url: string, timeout = 200): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject();
      };
      img.src = this.optimizeShopifyImageUrl(url, 400, 75);
    });
  }

  // Batch preload multiple images with aggressive concurrency
  static async preloadImages(urls: string[], maxConcurrent = 6): Promise<void> {
    const batches = [];
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      batches.push(urls.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url, 150)) // Reduced timeout for speed
      );
    }
  }
}