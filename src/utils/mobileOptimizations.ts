/**
 * Mobile-specific optimizations for better performance and UX
 */

// Prevent zoom on double tap
export function preventZoom() {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
}

// Optimize scroll performance
export function optimizeScrolling() {
  // Use passive listeners for better scroll performance
  let ticking = false;
  
  const updateScroll = () => {
    ticking = false;
    // Custom scroll handling can go here
  };

  const requestScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateScroll);
      ticking = true;
    }
  };

  document.addEventListener('scroll', requestScroll, { passive: true });
  document.addEventListener('touchmove', requestScroll, { passive: true });
}

// Reduce layout thrashing
export function optimizeLayout() {
  // Use CSS containment where possible
  const elements = document.querySelectorAll('[data-optimized="true"]');
  elements.forEach(element => {
    (element as HTMLElement).style.contain = 'layout style paint';
  });
}

// Improve input responsiveness on mobile
export function optimizeInputs() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    // Prevent zoom on focus for mobile
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    
    // Ensure minimum font size to prevent zoom
    (input as HTMLElement).style.fontSize = Math.max(16, parseInt(getComputedStyle(input).fontSize)) + 'px';
  });
}

// Reduce memory usage for mobile
export function enableMobileMemoryOptimization() {
  // Clear unused images from memory
  const clearUnusedImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100;
      
      if (!isVisible && img.src && !img.dataset.originalSrc) {
        // Keep the src in data attribute for later loading
        img.dataset.originalSrc = img.src;
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=';
      } else if (isVisible && img.dataset.originalSrc && !img.src.startsWith('http')) {
        // Restore image when it becomes visible
        img.src = img.dataset.originalSrc;
        delete img.dataset.originalSrc;
      }
    });
  };

  // Run cleanup periodically on mobile
  if (window.innerWidth < 768) {
    setInterval(clearUnusedImages, 15000); // Every 15 seconds
  }
}

// Optimize for different mobile orientations
export function handleOrientationChange() {
  const handleResize = () => {
    // Clear any cached viewport calculations
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    
    // Trigger layout recalculation
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  window.addEventListener('orientationchange', handleResize);
  window.addEventListener('resize', handleResize);
  
  // Set initial viewport height
  handleResize();
}

// Optimize touch interactions
export function optimizeTouchInteractions() {
  // Add touch-action CSS to prevent unwanted behaviors
  document.documentElement.style.touchAction = 'manipulation';
  
  // Improve button touch targets
  const buttons = document.querySelectorAll('button, [role="button"]');
  buttons.forEach(button => {
    const element = button as HTMLElement;
    const computedStyle = getComputedStyle(element);
    const minSize = 44; // Minimum touch target size in pixels
    
    if (parseInt(computedStyle.height) < minSize) {
      element.style.minHeight = `${minSize}px`;
    }
    if (parseInt(computedStyle.width) < minSize) {
      element.style.minWidth = `${minSize}px`;
    }
  });
}

// Preload critical resources for faster initial load
export function preloadCriticalResources() {
  // Note: Images should be imported as ES6 modules where used
  // The hero image is imported in ProductCategories.tsx as heroPartyAustin
  // No longer preloading images from here to avoid 404 errors
}

// Initialize all mobile optimizations
export function initializeMobileOptimizations() {
  if (typeof window === 'undefined') return;
  
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    preventZoom();
    enableMobileMemoryOptimization();
    optimizeTouchInteractions();
  }
  
  optimizeScrolling();
  optimizeLayout();
  optimizeInputs();
  handleOrientationChange();
  preloadCriticalResources();
}
