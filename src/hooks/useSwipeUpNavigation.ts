import { useState, useEffect, useCallback } from 'react';

interface SwipeUpNavigationOptions {
  threshold?: number;
  minSwipeDistance?: number;
}

export function useSwipeUpNavigation(options: SwipeUpNavigationOptions = {}) {
  const { threshold = 50, minSwipeDistance = 100 } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only trigger from bottom 80px of screen
    const windowHeight = window.innerHeight;
    const touchY = e.touches[0].clientY;
    
    if (touchY > windowHeight - 80) {
      setStartY(touchY);
      setCurrentY(touchY);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY === null) return;
    
    const touchY = e.touches[0].clientY;
    setCurrentY(touchY);
    
    // Show navigation if swiping up significantly
    const swipeDistance = startY - touchY;
    if (swipeDistance > threshold && !isVisible) {
      setIsVisible(true);
    }
  }, [startY, threshold, isVisible]);

  const handleTouchEnd = useCallback(() => {
    if (startY === null || currentY === null) return;
    
    const swipeDistance = startY - currentY;
    
    // Show if swiped up enough
    if (swipeDistance > minSwipeDistance) {
      setIsVisible(true);
    }
    
    setStartY(null);
    setCurrentY(null);
  }, [startY, currentY, minSwipeDistance]);

  const hideNavigation = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isVisible,
    hideNavigation,
    setIsVisible
  };
}