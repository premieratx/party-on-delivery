// Image optimization utilities for faster loading

export class ImageOptimizer {
  // Convert Shopify image URLs to optimized versions
  static optimizeShopifyImageUrl(url: string, width = 400, quality = 80): string {
    if (!url || !url.includes('shopify')) return url;
    
    // Remove existing size parameters
    const baseUrl = url.split('?')[0];
    
    // Add optimized parameters for faster loading
    return `${baseUrl}?v=${Date.now()}&width=${width}&quality=${quality}&format=webp`;
  }

  // Get responsive image URLs for different screen sizes
  static getResponsiveImageUrls(url: string) {
    if (!url) return { mobile: url, tablet: url, desktop: url };
    
    return {
      mobile: this.optimizeShopifyImageUrl(url, 300, 75),    // Small, lower quality
      tablet: this.optimizeShopifyImageUrl(url, 500, 80),    // Medium size
      desktop: this.optimizeShopifyImageUrl(url, 800, 85)    // Higher quality for desktop
    };
  }

  // Preload critical images
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = this.optimizeShopifyImageUrl(url, 400, 80);
    });
  }

  // Batch preload multiple images
  static async preloadImages(urls: string[], maxConcurrent = 3): Promise<void> {
    const batches = [];
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      batches.push(urls.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url))
      );
    }
  }
}