export class MobileOptimizer {
  private static isMobileDevice(): boolean {
    return window.innerWidth <= 768;
  }

  private static isTabletDevice(): boolean {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  // Optimize animations for mobile
  static getOptimizedStyles() {
    const isMobile = this.isMobileDevice();
    
    return {
      // Reduce animations on mobile
      transitions: isMobile 
        ? 'transform 0.2s ease-out' 
        : 'all 0.3s ease-out',
      
      // Simpler shadows on mobile
      boxShadow: isMobile 
        ? '0 2px 4px rgba(0,0,0,0.1)' 
        : '0 4px 12px rgba(0,0,0,0.15)',
      
      // Reduce blur effects on mobile
      backdropFilter: isMobile 
        ? 'blur(4px)' 
        : 'blur(8px)'
    };
  }

  // Get responsive grid configuration
  static getGridConfig() {
    const isMobile = this.isMobileDevice();
    const isTablet = this.isTabletDevice();

    if (isMobile) {
      return {
        columns: 2,
        gap: '0.5rem',
        cardPadding: '0.5rem',
        fontSize: 'text-sm',
        initialProducts: 10
      };
    }

    if (isTablet) {
      return {
        columns: 3,
        gap: '1rem',
        cardPadding: '0.75rem',
        fontSize: 'text-base',
        initialProducts: 15
      };
    }

    return {
      columns: 4,
      gap: '1.5rem',
      cardPadding: '1rem',
      fontSize: 'text-base',
      initialProducts: 20
    };
  }

  // Debounce function for search
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Optimize touch interactions
  static optimizeTouchInteractions() {
    // Prevent double-tap zoom on buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).click();
      });
    });
  }

  // Reduce motion for users who prefer it
  static respectReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Get optimized image dimensions for mobile
  static getOptimizedImageSize() {
    const isMobile = this.isMobileDevice();
    
    return {
      width: isMobile ? 200 : 300,
      height: isMobile ? 200 : 300,
      quality: isMobile ? 80 : 90
    };
  }
}

// CSS-in-JS helper for mobile-optimized styles
export const mobileStyles = {
  card: {
    base: 'transition-transform duration-200',
    mobile: 'hover:scale-[1.02] active:scale-[0.98]',
    desktop: 'hover:scale-105 hover:shadow-lg'
  },
  
  button: {
    base: 'transition-all duration-200',
    mobile: 'active:scale-95 touch-manipulation',
    desktop: 'hover:scale-105'
  },
  
  grid: {
    mobile: 'grid-cols-2 gap-2 p-2',
    tablet: 'grid-cols-3 gap-4 p-4',
    desktop: 'grid-cols-4 gap-6 p-6'
  }
};

// Initialize mobile optimizations
export function initializeMobileOptimizations() {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  // Optimize touch interactions
  MobileOptimizer.optimizeTouchInteractions();
  
  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
    document.head.appendChild(viewport);
  }
}