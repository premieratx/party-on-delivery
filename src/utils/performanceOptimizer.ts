/**
 * Performance optimization utilities for mobile and desktop platforms
 */

// Image lazy loading with intersection observer
export class ImageOptimizer {
  private static observer: IntersectionObserver | null = null;
  private static imageCache = new Map<string, HTMLImageElement>();

  static initLazyLoading() {
    if (typeof window === 'undefined' || this.observer) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              this.loadImage(src).then((loadedImg) => {
                img.src = loadedImg.src;
                img.classList.remove('opacity-0');
                img.classList.add('opacity-100');
              });
              this.observer?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px 0px' }
    );
  }

  static observeImage(img: HTMLImageElement) {
    this.observer?.observe(img);
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static preloadCriticalImages(urls: string[]) {
    urls.forEach(url => this.loadImage(url));
  }
}

// Bundle splitting and dynamic imports
export class CodeSplitter {
  private static componentCache = new Map<string, Promise<any>>();

  static async loadComponent<T = any>(
    importFn: () => Promise<{ default: T }>,
    componentName: string
  ): Promise<T> {
    if (this.componentCache.has(componentName)) {
      const cached = await this.componentCache.get(componentName);
      return cached.default;
    }

    const promise = importFn();
    this.componentCache.set(componentName, promise);
    const module = await promise;
    return module.default;
  }
}

// Memory management
export class MemoryManager {
  private static cleanup: (() => void)[] = [];

  static addCleanup(fn: () => void) {
    this.cleanup.push(fn);
  }

  static performCleanup() {
    this.cleanup.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    this.cleanup = [];
  }

  static scheduleMemoryCleanup() {
    // Clean up every 5 minutes
    setInterval(() => {
      if (this.cleanup.length > 0) {
        console.log('Performing scheduled memory cleanup...');
        this.performCleanup();
      }
    }, 5 * 60 * 1000);
  }
}

// Touch and gesture optimizations for mobile
export class TouchOptimizer {
  static optimizeTouch(element: HTMLElement) {
    // Improve touch responsiveness
    element.style.touchAction = 'manipulation';
    (element.style as any).webkitTouchCallout = 'none';
    (element.style as any).webkitUserSelect = 'none';
    
    // Add touch feedback
    element.addEventListener('touchstart', () => {
      element.style.transform = 'scale(0.98)';
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
      element.style.transform = 'scale(1)';
    }, { passive: true });
  }

  static addSwipeGesture(
    element: HTMLElement,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    threshold = 50
  ) {
    let startX = 0;
    let startY = 0;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = Math.abs(endY - startY);
      
      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > threshold && deltaY < threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    }, { passive: true });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    return fn().then(result => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return result;
    });
  }

  static measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordMetric(label, duration);
    return result;
  }

  private static recordMetric(label: string, duration: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const metrics = this.metrics.get(label)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  static getMetrics(label: string) {
    const metrics = this.metrics.get(label) || [];
    if (metrics.length === 0) return null;

    const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);
    
    return { avg, min, max, count: metrics.length };
  }

  static logPerformanceReport() {
    console.group('Performance Report');
    this.metrics.forEach((_, label) => {
      const stats = this.getMetrics(label);
      if (stats) {
        console.log(`${label}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms (${stats.count} samples)`);
      }
    });
    console.groupEnd();
  }
}

// Network optimization
export class NetworkOptimizer {
  private static connectionType: string = 'unknown';
  
  static init() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.connectionType = connection.effectiveType || 'unknown';
      
      connection.addEventListener('change', () => {
        this.connectionType = connection.effectiveType || 'unknown';
        console.log('Network type changed:', this.connectionType);
      });
    }
  }

  static isSlowConnection(): boolean {
    return this.connectionType === 'slow-2g' || this.connectionType === '2g';
  }

  static isFastConnection(): boolean {
    return this.connectionType === '4g' || this.connectionType === '5g';
  }

  static getOptimalImageQuality(): 'low' | 'medium' | 'high' {
    if (this.isSlowConnection()) return 'low';
    if (this.isFastConnection()) return 'high';
    return 'medium';
  }

  static shouldPreload(): boolean {
    return this.isFastConnection();
  }
}

// Viewport optimization
export class ViewportOptimizer {
  static isInViewport(element: HTMLElement, threshold = 0): boolean {
    const rect = element.getBoundingClientRect();
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= viewHeight + threshold &&
      rect.right <= viewWidth + threshold
    );
  }

  static getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  static isMobile(): boolean {
    return this.getViewportSize().width < 768;
  }

  static isTablet(): boolean {
    const { width } = this.getViewportSize();
    return width >= 768 && width < 1024;
  }

  static isDesktop(): boolean {
    return this.getViewportSize().width >= 1024;
  }
}

// Initialize optimizations
export function initializePerformanceOptimizations() {
  ImageOptimizer.initLazyLoading();
  NetworkOptimizer.init();
  MemoryManager.scheduleMemoryCleanup();
  
  // Log performance metrics every minute in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      PerformanceMonitor.logPerformanceReport();
    }, 60000);
  }
}
