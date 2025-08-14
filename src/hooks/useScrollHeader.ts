import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
  threshold?: number;
}

export const useScrollHeader = (options: UseScrollHeaderOptions = {}) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const { threshold = 50 } = options;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldShowCartHeader = currentScrollY > threshold;
      setIsScrollingDown(shouldShowCartHeader);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return {
    isScrollingDown,
    showCartInHeader: isScrollingDown
  };
};