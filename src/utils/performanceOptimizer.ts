import React from 'react';

// Image lazy loading with intersection observer - moved first
export class ImageOptimizer {
  private static observer: IntersectionObserver;
  private static deviceInfo = {
    isMobile: false,
    isTablet: false,
    isDesktop: true
  };

  static {
    if (typeof window !== 'undefined') {
      this.deviceInfo.isMobile = window.innerWidth <= 768;
      this.deviceInfo.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
      this.deviceInfo.isDesktop = window.innerWidth > 1024;
    }
  }

  static get isMobile() { return this.deviceInfo.isMobile; }
  static get isTablet() { return this.deviceInfo.isTablet; }
  static get isDesktop() { return this.deviceInfo.isDesktop; }

  static createObserver(): IntersectionObserver {
    if (!this.observer && typeof window !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                this.observer.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
    return this.observer;
  }

  static observeImage(img: HTMLImageElement): void {
    if (!this.observer) {
      this.createObserver();
    }
    this.observer.observe(img);
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private requestQueue = new Map<string, Promise<any>>();
  private abortControllers = new Map<string, AbortController>();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Prevent duplicate API calls
  async dedupe<T>(key: string, apiCall: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    const promise = apiCall()
      .finally(() => {
        this.requestQueue.delete(key);
        this.abortControllers.delete(key);
      });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // Cancel all pending requests
  cancelAll(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.requestQueue.clear();
  }

  // Cancel specific request
  cancel(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
      this.requestQueue.delete(key);
    }
  }

  // Batch multiple operations
  async batch<T>(operations: Array<() => Promise<T>>, batchSize = 3): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(op => op())
      );
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
      
      // Small delay between batches to prevent overwhelming
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Resource cleanup
  cleanup(): void {
    this.cancelAll();
  }

  // Additional static methods for compatibility
  static get isSlowConnection(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    }
    return false;
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  static optimizeTouch(): void {
    if (typeof window !== 'undefined') {
      // Add touch optimization
      document.addEventListener('touchstart', () => {}, { passive: true });
    }
  }

  static addCleanup(cleanupFn: () => void): void {
    // Add to cleanup queue - simple implementation
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', cleanupFn);
    }
  }
}

// Service Worker utilities for caching
export class ServiceWorkerManager {
  static async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
      return registration;
    } catch (error) {
      console.warn('SW registration failed:', error);
      return null;
    }
  }

  static async updateCache(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;

    const cache = await caches.open('app-cache-v1');
    await cache.addAll(urls);
  }
}

// React performance utilities  
export function memo<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: any, nextProps: any) => boolean
): React.MemoExoticComponent<T> {
  return React.memo(Component, propsAreEqual);
}

// Legacy exports for compatibility
export const ViewportOptimizer = ImageOptimizer;
export const NetworkOptimizer = PerformanceOptimizer;
export const PerformanceMonitor = PerformanceOptimizer;
export const MemoryManager = PerformanceOptimizer;
export const TouchOptimizer = PerformanceOptimizer;

export function initializePerformanceOptimizations(): void {
  console.log('🚀 Performance optimizations initialized');
  
  // Register service worker
  ServiceWorkerManager.register();
  
  // Initialize image observer
  if (typeof window !== 'undefined') {
    ImageOptimizer.createObserver();
  }
}

export const perf = PerformanceOptimizer.getInstance();