import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}

// Helper function to optimize Shopify image URLs for faster loading
const optimizeImageUrl = (src: string, width = 300, quality = 75): string => {
  if (!src) return src;
  
  // For Shopify CDN images, use their image transformation API
  if (src.includes('cdn.shopify.com') || src.includes('shopify.com')) {
    // Remove existing size/quality parameters
    const baseUrl = src.split('?')[0];
    return `${baseUrl}?width=${width}&quality=${quality}&format=webp`;
  }
  
  // For other CDNs or direct URLs, return as-is
  return src;
};

export const OptimizedImage = ({ src, alt, className = '', onClick, priority = false }: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src) {
      // Optimize the image URL for faster loading
      const optimizedSrc = optimizeImageUrl(src, 300, 75);
      
      // Fast preload with priority handling
      const img = new Image();
      
      // Enable faster loading for priority images
      if (priority) {
        img.loading = 'eager';
        (img as any).fetchPriority = 'high';
      }
      
      img.onload = () => {
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        console.warn('Optimized image failed, trying original:', src);
        // Try original URL if optimized fails
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setIsLoading(false);
          setHasError(false);
        };
        fallbackImg.onerror = () => {
          setIsLoading(false);
          setHasError(true);
        };
        fallbackImg.src = src;
      };
      
      // Start loading optimized image
      img.src = optimizedSrc;
      
      // Cleanup on unmount
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [src, priority]);

  if (hasError) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        ref={imgRef}
        src={optimizeImageUrl(src, 300, 75)}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        loading={priority ? "eager" : "lazy"}
        {...(priority ? { fetchPriority: "high" as any } : {})}
        decoding="async"
        sizes="(max-width: 768px) 150px, 300px"
      />
    </div>
  );
};