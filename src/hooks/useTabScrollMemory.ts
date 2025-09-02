import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollPosition {
  scrollY: number;
  timestamp: number;
}

/**
 * Hook to manage scroll position memory for delivery app tabs
 * Each tab (delivery app) remembers its scroll position independently
 */
export function useTabScrollMemory() {
  const location = useLocation();
  const scrollPositions = useRef<Map<string, ScrollPosition>>(new Map());
  const currentTab = useRef<string>('');
  const isNewTab = useRef<boolean>(false);
  const hasScrolledOnNewTab = useRef<boolean>(false);

  // Get current tab from URL
  const getCurrentTab = useCallback(() => {
    const pathSegments = location.pathname.split('/');
    if (pathSegments[1] === 'app' && pathSegments[2]) {
      return pathSegments[2];
    }
    return 'default';
  }, [location.pathname]);

  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    if (currentTab.current) {
      const scrollY = window.scrollY;
      scrollPositions.current.set(currentTab.current, {
        scrollY,
        timestamp: Date.now()
      });
      console.log(`📍 Saved scroll position for tab "${currentTab.current}": ${scrollY}px`);
    }
  }, []);

  // Restore scroll position for a tab
  const restoreScrollPosition = useCallback((tabName: string) => {
    const savedPosition = scrollPositions.current.get(tabName);
    
    if (savedPosition) {
      // Tab has been visited before - restore position
      console.log(`🔄 Restoring scroll position for tab "${tabName}": ${savedPosition.scrollY}px`);
      setTimeout(() => {
        window.scrollTo({ top: savedPosition.scrollY, behavior: 'instant' });
      }, 100);
      isNewTab.current = false;
      hasScrolledOnNewTab.current = true;
    } else {
      // New tab - scroll to top
      console.log(`🆕 New tab "${tabName}" - scrolling to top`);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 100);
      isNewTab.current = true;
      hasScrolledOnNewTab.current = false;
    }
  }, []);

  // Handle tab changes
  useEffect(() => {
    const newTab = getCurrentTab();
    
    // If switching tabs, save current position first
    if (currentTab.current && currentTab.current !== newTab) {
      saveScrollPosition();
    }
    
    // If this is a different tab, restore its position
    if (newTab !== currentTab.current) {
      currentTab.current = newTab;
      restoreScrollPosition(newTab);
    }
  }, [location.pathname, getCurrentTab, saveScrollPosition, restoreScrollPosition]);

  // Save scroll position periodically while user scrolls
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set new timeout to save position after scrolling stops
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      // Save position when component unmounts
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  // Save position when page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveScrollPosition]);

  return {
    currentTab: currentTab.current,
    isNewTab: isNewTab.current,
    hasScrolledOnNewTab: hasScrolledOnNewTab.current,
    saveScrollPosition,
    restoreScrollPosition,
    // Force scroll to top (for checkout, etc.)
    scrollToTop: () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };
}