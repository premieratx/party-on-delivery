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
  });
}

// Reduce memory usage for mobile
export function enableMobileMemoryOptimization() {
  // Clear unused images from memory
  const clearUnusedImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isVisible && img.src) {
        // Keep the src in data attribute for later loading
        img.dataset.originalSrc = img.src;
        img.src = '';
      }
    });
  };

  // Run cleanup periodically on mobile
  if (window.innerWidth < 768) {
    setInterval(clearUnusedImages, 30000); // Every 30 seconds
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

// Preload critical resources for faster initial load
export function preloadCriticalResources() {
  const criticalImages = [
    '/hero-party-austin.jpg'
    // Note: party-on-delivery-logo.png should be imported as ES6 module where used
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Initialize all mobile optimizations
export function initializeMobileOptimizations() {
  if (typeof window === 'undefined') return;
  
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    preventZoom();
    enableMobileMemoryOptimization();
  }
  
  optimizeScrolling();
  optimizeLayout();
  optimizeInputs();
  handleOrientationChange();
  preloadCriticalResources();
}
