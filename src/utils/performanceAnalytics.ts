import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  metric_name: string;
  value: number;
  timestamp: Date;
  user_agent?: string;
  page_url?: string;
  session_id?: string;
}

interface UserInteractionEvent {
  event_type: 'cart_add' | 'cart_remove' | 'search' | 'tab_switch' | 'product_view';
  product_id?: string;
  search_term?: string;
  tab_name?: string;
  timestamp: Date;
  session_id?: string;
}

class PerformanceAnalytics {
  private sessionId: string;
  private observer?: PerformanceObserver;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.initializeObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration);
        }
      });

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  async recordMetric(name: string, value: number, additionalData?: any): Promise<void> {
    const metric: PerformanceMetric = {
      metric_name: name,
      value,
      timestamp: new Date(),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      session_id: this.sessionId
    };

    try {
      // Store locally first for immediate availability
      this.storeLocalMetric(metric);

      // Then send to Supabase (non-blocking)
      this.sendToSupabase(metric, additionalData);
    } catch (error) {
      console.warn('Failed to record metric:', error);
    }
  }

  private storeLocalMetric(metric: PerformanceMetric): void {
    const stored = localStorage.getItem('performance_metrics');
    const metrics = stored ? JSON.parse(stored) : [];
    metrics.push(metric);
    
    // Keep only last 100 metrics to avoid storage bloat
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(metrics));
  }

  private async sendToSupabase(metric: PerformanceMetric, additionalData?: any): Promise<void> {
    try {
      await supabase.from('system_audit_log').insert({
        event_type: 'performance_metric',
        service_name: 'delivery_app',
        operation: 'performance_tracking',
        request_data: {
          ...metric,
          timestamp: metric.timestamp.toISOString(),
          ...additionalData
        },
        created_at: metric.timestamp.toISOString()
      });
    } catch (error) {
      // Silent fail - don't impact user experience
      console.debug('Performance metric storage failed:', error);
    }
  }

  async recordUserInteraction(event: UserInteractionEvent): Promise<void> {
    const interaction = {
      ...event,
      timestamp: new Date(),
      session_id: this.sessionId
    };

    try {
      await supabase.from('system_audit_log').insert({
        event_type: 'user_interaction',
        service_name: 'delivery_app',
        operation: 'user_tracking',
        request_data: {
          ...interaction,
          timestamp: interaction.timestamp.toISOString()
        },
        created_at: interaction.timestamp.toISOString()
      });
    } catch (error) {
      console.debug('User interaction storage failed:', error);
    }
  }

  measurePageLoad(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.recordMetric('first_byte', navigation.responseStart - navigation.fetchStart);
      }

      // Core Web Vitals
      this.measureCoreWebVitals();
    });
  }

  private measureCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.debug('LCP measurement not supported');
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.debug('FID measurement not supported');
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric('cls', clsValue);
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.debug('CLS measurement not supported');
      }
    }
  }

  async measureApiCall<T>(
    apiCall: () => Promise<T>,
    callName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${callName}`, duration, {
        success: true,
        result_size: JSON.stringify(result).length
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${callName}`, duration, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  getLocalMetrics(): PerformanceMetric[] {
    const stored = localStorage.getItem('performance_metrics');
    return stored ? JSON.parse(stored) : [];
  }

  async generatePerformanceReport(): Promise<any> {
    const metrics = this.getLocalMetrics();
    const sessionTime = performance.now() - this.startTime;

    const report = {
      session_id: this.sessionId,
      session_duration: sessionTime,
      total_metrics: metrics.length,
      average_page_load: this.calculateAverage(metrics, 'page_load_time'),
      average_api_response: this.calculateAverage(metrics, 'api_'),
      core_web_vitals: {
        lcp: this.getLatestMetric(metrics, 'lcp'),
        fid: this.getLatestMetric(metrics, 'fid'),
        cls: this.getLatestMetric(metrics, 'cls')
      },
      timestamp: new Date().toISOString()
    };

    // Store report
    try {
      await supabase.from('system_audit_log').insert({
        event_type: 'performance_report',
        service_name: 'delivery_app',
        operation: 'performance_summary',
        request_data: report,
        created_at: report.timestamp
      });
    } catch (error) {
      console.debug('Performance report storage failed:', error);
    }

    return report;
  }

  private calculateAverage(metrics: PerformanceMetric[], metricPrefix: string): number {
    const filtered = metrics.filter(m => m.metric_name.includes(metricPrefix));
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }

  private getLatestMetric(metrics: PerformanceMetric[], metricName: string): number | null {
    const filtered = metrics.filter(m => m.metric_name === metricName);
    return filtered.length > 0 ? filtered[filtered.length - 1].value : null;
  }

  destroy(): void {
    this.observer?.disconnect();
  }
}

// Export singleton instance
export const performanceAnalytics = new PerformanceAnalytics();

// Initialize page load measurement
performanceAnalytics.measurePageLoad();

// Export for manual usage
export { PerformanceAnalytics };
