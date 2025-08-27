/**
 * Advanced image compression and optimization utility
 * Reduces image file sizes to max 0.5MB with WebP fallbacks
 */

interface CompressionOptions {
  maxSizeKB?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'auto';
  width?: number;
  height?: number;
}

export class ImageCompressor {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  private static getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
    }
    return { canvas: this.canvas, ctx: this.ctx! };
  }

  static async compressImage(
    imageUrl: string, 
    options: CompressionOptions = {}
  ): Promise<string> {
    const {
      maxSizeKB = 512, // 0.5MB default
      quality = 0.8,
      format = 'auto',
      width = 400,
      height = 400
    } = options;

    try {
      // Check if already compressed (cached)
      const cacheKey = `compressed_${btoa(imageUrl)}_${maxSizeKB}_${quality}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return cached;
      }

      // Load image
      const img = await this.loadImage(imageUrl);
      const { canvas, ctx } = this.getCanvas();

      // Calculate optimal dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let targetWidth = width;
      let targetHeight = height;

      if (aspectRatio > 1) {
        targetHeight = width / aspectRatio;
      } else {
        targetWidth = height * aspectRatio;
      }

      // Set canvas size
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Clear and draw optimized image
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Try different formats and qualities to hit size target
      let compressedUrl = await this.tryCompression(canvas, format, quality, maxSizeKB);

      // Cache the result
      try {
        localStorage.setItem(cacheKey, compressedUrl);
      } catch (e) {
        // Storage full, clear old entries
        this.clearOldCache();
      }

      return compressedUrl;
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      return imageUrl;
    }
  }

  private static async tryCompression(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number,
    maxSizeKB: number
  ): Promise<string> {
    // Try WebP first (best compression)
    if (format === 'auto' || format === 'webp') {
      const webpUrl = canvas.toDataURL('image/webp', quality);
      if (this.getImageSizeKB(webpUrl) <= maxSizeKB) {
        return webpUrl;
      }
    }

    // Try JPEG with progressive quality reduction
    let currentQuality = quality;
    while (currentQuality > 0.1) {
      const jpegUrl = canvas.toDataURL('image/jpeg', currentQuality);
      if (this.getImageSizeKB(jpegUrl) <= maxSizeKB) {
        return jpegUrl;
      }
      currentQuality -= 0.1;
    }

    // Return best effort
    return canvas.toDataURL('image/jpeg', 0.1);
  }

  private static getImageSizeKB(dataUrl: string): number {
    // Remove data:image/xxx;base64, prefix and calculate size
    const base64 = dataUrl.split(',')[1];
    const bytes = (base64.length * 3) / 4;
    return bytes / 1024;
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private static clearOldCache(): void {
    const keys = Object.keys(localStorage);
    const compressedKeys = keys.filter(key => key.startsWith('compressed_'));
    
    // Remove oldest 50% of compressed images
    compressedKeys
      .slice(0, Math.floor(compressedKeys.length / 2))
      .forEach(key => localStorage.removeItem(key));
  }

  // Generate responsive image URLs
  static generateResponsiveUrls(baseUrl: string): {
    thumbnail: string;
    medium: string;
    large: string;
  } {
    const baseParams = new URLSearchParams();
    
    return {
      thumbnail: `${baseUrl}?${new URLSearchParams({...Object.fromEntries(baseParams), w: '150', h: '150', q: '60'}).toString()}`,
      medium: `${baseUrl}?${new URLSearchParams({...Object.fromEntries(baseParams), w: '400', h: '400', q: '80'}).toString()}`,
      large: `${baseUrl}?${new URLSearchParams({...Object.fromEntries(baseParams), w: '800', h: '800', q: '85'}).toString()}`
    };
  }
}

// React hook for easy image compression
export function useImageCompression() {
  const compressImage = async (url: string, options?: CompressionOptions) => {
    return ImageCompressor.compressImage(url, options);
  };

  const getResponsiveUrls = (url: string) => {
    return ImageCompressor.generateResponsiveUrls(url);
  };

  return { compressImage, getResponsiveUrls };
}