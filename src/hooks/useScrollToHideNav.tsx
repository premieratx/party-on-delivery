import { useState, useEffect, useRef } from 'react';

export function useScrollToHideNav(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up or at the top
      if (currentScrollY < lastScrollY.current || currentScrollY < threshold) {
        setIsVisible(true);
      }
      // Hide nav when scrolling down
      else if (currentScrollY > lastScrollY.current && currentScrollY > threshold) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isVisible;
}
