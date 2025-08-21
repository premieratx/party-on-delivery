/**
 * Comprehensive System Logger - Logs everything to Supabase
 * This ensures complete audit trail and prevents data loss
 */

import { supabase } from '@/integrations/supabase/client';

export interface SystemLogEntry {
  eventType: string;
  serviceName: string;
  operation: string;
  userEmail?: string;
  sessionId?: string;
  requestData?: any;
  responseData?: any;
  errorDetails?: any;
  executionTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
}

export class SystemLogger {
  private static instance: SystemLogger;
  private queue: SystemLogEntry[] = [];
  private isProcessing = false;

  private constructor() {
    // Auto-flush queue every 5 seconds
    setInterval(() => {
      this.flush();
    }, 5000);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  public static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  /**
   * Log system event with automatic retry and queuing
   */
  public async log(entry: SystemLogEntry): Promise<void> {
    // Add browser context
    const enrichedEntry: SystemLogEntry = {
      ...entry,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ipAddress: entry.ipAddress || 'unknown'
    };

    // Add to queue for batch processing
    this.queue.push(enrichedEntry);

    // Also log to console for immediate visibility
    const logLevel = entry.severity || 'info';
    const message = `[${entry.serviceName}:${entry.operation}] ${entry.eventType}`;
    
    switch (logLevel) {
      case 'debug':
        console.debug(message, enrichedEntry);
        break;
      case 'info':
        console.info(message, enrichedEntry);
        break;
      case 'warn':
        console.warn(message, enrichedEntry);
        break;
      case 'error':
      case 'critical':
        console.error(message, enrichedEntry);
        break;
      default:
        console.log(message, enrichedEntry);
    }

    // If queue is getting large, flush immediately
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  /**
   * Flush the queue to Supabase
   */
  public async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const entries = [...this.queue];
    this.queue = [];

    try {
      // Use the Supabase function to log events
      for (const entry of entries) {
        await supabase.rpc('log_system_event', {
          p_event_type: entry.eventType,
          p_service_name: entry.serviceName,
          p_operation: entry.operation,
          p_user_email: entry.userEmail,
          p_session_id: entry.sessionId,
          p_request_data: entry.requestData,
          p_response_data: entry.responseData,
          p_error_details: entry.errorDetails,
          p_execution_time_ms: entry.executionTimeMs,
          p_ip_address: entry.ipAddress,
          p_user_agent: entry.userAgent,
          p_severity: entry.severity || 'info'
        });
      }
    } catch (error) {
      console.error('Failed to flush system logs:', error);
      // Re-add failed entries to front of queue
      this.queue.unshift(...entries);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Log payment processing events
   */
  public async logPayment(operation: string, data: any, error?: any): Promise<void> {
    await this.log({
      eventType: 'payment_processing',
      serviceName: 'stripe',
      operation,
      requestData: data,
      errorDetails: error,
      severity: error ? 'error' : 'info'
    });
  }

  /**
   * Log order creation events
   */
  public async logOrder(operation: string, data: any, error?: any): Promise<void> {
    await this.log({
      eventType: 'order_management',
      serviceName: 'shopify',
      operation,
      requestData: data,
      errorDetails: error,
      severity: error ? 'error' : 'info'
    });
  }

  /**
   * Log dashboard operations
   */
  public async logDashboard(operation: string, data: any, error?: any): Promise<void> {
    await this.log({
      eventType: 'dashboard_operation',
      serviceName: 'dashboard',
      operation,
      requestData: data,
      errorDetails: error,
      severity: error ? 'error' : 'info'
    });
  }

  /**
   * Log integration events
   */
  public async logIntegration(service: string, operation: string, data: any, error?: any): Promise<void> {
    await this.log({
      eventType: 'integration_event',
      serviceName: service,
      operation,
      requestData: data,
      errorDetails: error,
      severity: error ? 'error' : 'info'
    });
  }

  /**
   * Log delivery app operations
   */
  public async logDeliveryApp(operation: string, data: any, error?: any): Promise<void> {
    await this.log({
      eventType: 'delivery_app_operation',
      serviceName: 'delivery_app',
      operation,
      requestData: data,
      errorDetails: error,
      severity: error ? 'error' : 'info'
    });
  }

  /**
   * Log cover page operations
   */
  public async logCoverPage(operation: string, data: any, error?: any): Promise<void> {
    await this.log({
      eventType: 'cover_page_operation',
      serviceName: 'cover_page',
      operation,
      requestData: data,
      errorDetails: error,
      severity: error ? 'error' : 'info'
    });
  }
}

// Export singleton instance
export const systemLogger = SystemLogger.getInstance();

// Helper functions for common operations
export const logPaymentEvent = (operation: string, data: any, error?: any) => 
  systemLogger.logPayment(operation, data, error);

export const logOrderEvent = (operation: string, data: any, error?: any) => 
  systemLogger.logOrder(operation, data, error);

export const logDashboardEvent = (operation: string, data: any, error?: any) => 
  systemLogger.logDashboard(operation, data, error);

export const logIntegrationEvent = (service: string, operation: string, data: any, error?: any) => 
  systemLogger.logIntegration(service, operation, data, error);

export const logDeliveryAppEvent = (operation: string, data: any, error?: any) => 
  systemLogger.logDeliveryApp(operation, data, error);

export const logCoverPageEvent = (operation: string, data: any, error?: any) => 
  systemLogger.logCoverPage(operation, data, error);