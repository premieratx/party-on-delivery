import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}

export const OptimizedImage = ({ src, alt, className = '', onClick, priority = false }: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src) {
      // Preload image
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      img.src = src;
    }
  }, [src]);

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
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        loading="lazy"
      />
    </div>
  );
};