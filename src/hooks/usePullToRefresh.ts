import { useEffect, useRef, useState, useCallback } from 'react';

interface PullToRefreshOptions {
  threshold?: number;
  maxPull?: number;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

export function usePullToRefresh({
  threshold = 80,
  maxPull = 120,
  onRefresh,
  enabled = true
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  
  const startYRef = useRef(0);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const isAtTop = useCallback(() => {
    return window.scrollY <= 5; // Small tolerance for scroll position
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !isAtTop()) return;
    
    setCanPull(true);
    startYRef.current = e.touches[0].clientY;
    setPullDistance(0); // Reset distance on touch start
    setIsPulling(false); // Reset pulling state
  }, [enabled, isAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !canPull || !isAtTop()) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    // Only prevent default and handle pull if it's a significant downward movement
    // This allows normal upward scrolling to work
    if (diff > 20) { // Require at least 20px downward movement before interfering
      e.preventDefault();
      const distance = Math.min(diff * 0.5, maxPull);
      setPullDistance(distance);
      setIsPulling(distance > 30); // Require more movement to trigger pulling state
    } else {
      // Allow normal touch behavior for small movements or upward movements
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [enabled, canPull, maxPull, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !canPull) return;

    setCanPull(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        await onRefresh();
      } catch (error) {
        console.error('Error during pull-to-refresh:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [enabled, canPull, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const element = elementRef.current || document.body;

    // Use passive listeners where possible to improve scroll performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false }); // Need to be able to preventDefault
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    elementRef,
    shouldTrigger: pullDistance >= threshold
  };
}