import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StickyNavigationProps {
  children: React.ReactNode;
  className?: string;
  isSticky?: boolean;
  hideOnMobileScroll?: boolean;
}

export const StickyNavigation: React.FC<StickyNavigationProps> = ({
  children,
  className,
  isSticky = true,
  hideOnMobileScroll = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isStickied, setIsStickied] = useState(false);
  const lastScrollY = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSticky && !hideOnMobileScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const element = elementRef.current;
      
      if (!element) return;

      const elementTop = element.offsetTop;
      
      // Check if element should be sticky
      if (isSticky && currentScrollY >= elementTop) {
        setIsStickied(true);
      } else {
        setIsStickied(false);
      }

      // Hide on mobile scroll down
      if (hideOnMobileScroll && window.innerWidth <= 768) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current || currentScrollY <= 50) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky, hideOnMobileScroll]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-300',
        isStickied && 'sticky top-0 z-30',
        !isVisible && 'transform -translate-y-full opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};