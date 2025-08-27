import React, { useState, useEffect, useRef } from 'react';
import { ImageCompressor } from '@/utils/imageCompression';

interface OptimizedProductImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export const OptimizedProductImage: React.FC<OptimizedProductImageProps> = ({
  src,
  alt,
  className = '',
  width = 400,
  height = 400,
  priority = false,
  sizes = '(max-width: 768px) 150px, 400px'
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Compress and optimize image when visible
  useEffect(() => {
    if (!isVisible || !src) return;

    const optimizeImage = async () => {
      try {
        setIsLoading(true);
        const compressed = await ImageCompressor.compressImage(src, {
          maxSizeKB: 512, // 0.5MB max
          width,
          height,
          quality: 0.85
        });
        setOptimizedSrc(compressed);
        setError(false);
      } catch (err) {
        console.warn('Image optimization failed:', err);
        setOptimizedSrc(src); // Fallback to original
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    optimizeImage();
  }, [isVisible, src, width, height]);

  if (!isVisible) {
    return (
      <div 
        ref={imgRef}
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={alt}
      />
    );
  }

  if (isLoading) {
    return (
      <div 
        className={`bg-muted animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      alt={alt}
      className={`object-cover transition-opacity duration-300 ${error ? 'opacity-75' : 'opacity-100'} ${className}`}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setError(true)}
      style={{ 
        aspectRatio: `${width}/${height}`,
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
};