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
      
      // Enhanced viewport configuration for mobile chrome hiding
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui'
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

    // Minimal scroll handler - no forced scroll manipulation
    const setupScrollHandler = () => {
      // Just return empty cleanup - let other hooks handle scroll behavior
      return () => {};
    };

    // Initialize everything
    updateViewport();
    updateThemeColor();
    updateAppleMobileWebApp();
    applyMobileChromeStyles();
    const cleanup = setupScrollHandler();

    // Remove forced scroll positioning that conflicts with other scroll hooks

    return cleanup;
  }, []);
}