import React, { Suspense, lazy } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  minHeight?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback = <div className="animate-pulse bg-muted rounded h-32" />,
  rootMargin = '100px',
  threshold = 0.1,
  className = '',
  minHeight = 'auto'
}) => {
  const { ref: elementRef, isIntersecting } = useIntersectionObserver({
    rootMargin,
    threshold
  });

  return (
    <div 
      ref={elementRef} 
      className={className}
      style={{ minHeight }}
    >
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

// Higher-order component for lazy loading components
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return React.forwardRef<any, T & { children?: React.ReactNode }>((props, ref) => {
    const { ref: elementRef, isIntersecting } = useIntersectionObserver({
      rootMargin: '200px',
      threshold: 0.1
    });

    return (
      <div ref={elementRef}>
        {isIntersecting ? (
          <Component {...(props as T)} ref={ref} />
        ) : (
          fallback || <div className="animate-pulse bg-muted rounded h-48" />
        )}
      </div>
    );
  });
}