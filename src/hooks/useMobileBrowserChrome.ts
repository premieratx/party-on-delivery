import { useEffect } from 'react';

export function useMobileBrowserChrome() {
  useEffect(() => {
    // Configure viewport for mobile browser chrome hiding
    const updateViewport = () => {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      
      // FIXED: Allow zoom on input fields for mobile accessibility
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover, minimal-ui'
      );
    };

    // Add theme-color meta for better mobile integration
    const updateThemeColor = () => {
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColorMeta);
      }
      
      // Use a color that matches your app theme
      themeColorMeta.setAttribute('content', '#000000');
    };

    // Add apple-mobile-web-app-capable for iOS
    const updateAppleMobileWebApp = () => {
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      
      if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
        document.head.appendChild(appleMeta);
      }
      
      appleMeta.setAttribute('content', 'yes');
      
      // Add status bar style
      let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      
      if (!statusBarMeta) {
        statusBarMeta = document.createElement('meta');
        statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(statusBarMeta);
      }
      
      statusBarMeta.setAttribute('content', 'black-translucent');
    };

    // Apply mobile browser chrome hiding styles
    const applyMobileChromeStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        /* Mobile browser chrome hiding */
        html {
          /* Hide browser chrome on scroll */
          overscroll-behavior-y: none;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          
          /* Prevent zoom on input focus */
          -webkit-text-size-adjust: 100%;
          -moz-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        
        body {
          /* Full viewport height accounting for mobile browser chrome */
          min-height: 100vh;
          min-height: 100dvh; /* Dynamic viewport height */
          
          /* Safe area support */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          
          /* Prevent overscroll */
          overscroll-behavior: none;
          
          /* Hide browser chrome on iOS */
          -webkit-appearance: none;
        }
        
        /* Root app container */
        #root {
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
        }
        
        /* Mobile-specific optimizations */
        @media screen and (max-width: 768px) {
          /* Force fullscreen behavior */
          html, body {
            height: 100%;
            overflow-x: hidden;
          }
          
          /* Hide address bar on scroll for older browsers */
          body {
            height: 100vh;
            height: calc(100vh + env(keyboard-inset-height, 0px));
          }
          
          /* Smooth scroll behavior */
          * {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Prevent pull-to-refresh on certain elements */
          .no-pull-refresh {
            overscroll-behavior-y: contain;
          }
        }
        
        /* iOS specific fixes */
        @supports (-webkit-touch-callout: none) {
          body {
            /* iOS Safari address bar hiding */
            padding-bottom: 0;
            min-height: -webkit-fill-available;
          }
          
          #root {
            min-height: -webkit-fill-available;
          }
        }
        
        /* Android specific fixes */
        @media screen and (max-width: 768px) and (orientation: portrait) {
          body {
            /* Android Chrome address bar hiding */
            min-height: calc(100vh + 1px);
          }
        }
        
        /* Fullscreen mode styles */
        @media (display-mode: fullscreen) {
          body {
            padding-top: 0;
          }
        }
        
        /* Standalone PWA mode */
        @media (display-mode: standalone) {
          body {
            padding-top: 0;
          }
        }
      `;
      
      document.head.appendChild(style);
    };

    // Scroll-based browser chrome control
    const setupScrollHandler = () => {
      let lastScrollY = window.scrollY;
      let ticking = false;

      const updateBrowserChrome = () => {
        const currentScrollY = window.scrollY;
        
        // Force browser chrome to hide on scroll down
        if (currentScrollY > lastScrollY && currentScrollY > 10) {
          // Scrolling down - try to hide browser chrome
          document.documentElement.style.setProperty('--browser-chrome-hidden', '1');
          
          // Force a small scroll to trigger browser chrome hiding
          if (window.innerHeight < screen.height * 0.85) {
            window.scrollBy(0, 1);
            setTimeout(() => window.scrollBy(0, -1), 10);
          }
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - allow browser chrome to show
          document.documentElement.style.setProperty('--browser-chrome-hidden', '0');
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
      };

      const requestUpdate = () => {
        if (!ticking) {
          requestAnimationFrame(updateBrowserChrome);
          ticking = true;
        }
      };

      // Throttled scroll handler
      window.addEventListener('scroll', requestUpdate, { passive: true });
      
      // Touch handlers for mobile
      let touchStartY = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        // FIXED: Don't interfere with input fields
        const target = e.target as Element;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea'))) {
          return;
        }
        touchStartY = e.touches[0].clientY;
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        // FIXED: Don't interfere with input fields
        const target = e.target as Element;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input, textarea'))) {
          return;
        }
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        // Hide chrome on upward swipe (scroll down)
        if (deltaY > 10 && window.scrollY > 0) {
          document.documentElement.style.setProperty('--browser-chrome-hidden', '1');
        }
      };
      
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });

      return () => {
        window.removeEventListener('scroll', requestUpdate);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    };

    // Initialize everything
    updateViewport();
    updateThemeColor();
    updateAppleMobileWebApp();
    applyMobileChromeStyles();
    const cleanup = setupScrollHandler();

    // Force initial browser chrome hide after a short delay
    setTimeout(() => {
      if (window.innerWidth <= 768) {
        window.scrollTo(0, 1);
        setTimeout(() => window.scrollTo(0, 0), 100);
      }
    }, 500);

    return cleanup;
  }, []);
}