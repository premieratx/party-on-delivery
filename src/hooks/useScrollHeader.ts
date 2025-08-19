import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
  threshold?: number;
}

export const useScrollHeader = (options: UseScrollHeaderOptions = {}) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { threshold = 50 } = options;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        // Scrolling down past threshold
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= threshold) {
        // Scrolling up OR at top of page
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, lastScrollY]);

  return {
    isScrollingDown,
    showCartInHeader: isScrollingDown
  };
};