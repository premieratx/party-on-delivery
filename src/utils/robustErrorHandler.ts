/**
 * Robust Error Handler - Enhanced version that logs everything to Supabase
 */

import { systemLogger } from './systemLogger';
import { ErrorHandler } from './errorHandler';

export interface RobustRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  context?: string;
  service?: string;
  operation?: string;
  logFailures?: boolean;
}

export class RobustErrorHandler extends ErrorHandler {
  /**
   * Enhanced retry with comprehensive logging
   */
  public static async withRobustRetry<T>(
    operation: () => Promise<T>,
    options: RobustRetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoffMultiplier = 1.5,
      context = 'unknown',
      service = 'application',
      operation: operationName = 'unknown',
      logFailures = true
    } = options;

    const startTime = Date.now();
    let lastError: Error;
    let currentDelay = delayMs;

    // Log operation start
    await systemLogger.log({
      eventType: 'operation_start',
      serviceName: service,
      operation: operationName,
      requestData: { context, max_attempts: maxAttempts },
      severity: 'debug'
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Log successful completion
        await systemLogger.log({
          eventType: 'operation_success',
          serviceName: service,
          operation: operationName,
          requestData: { context, attempt, total_attempts: maxAttempts },
          executionTimeMs: Date.now() - startTime,
          severity: attempt > 1 ? 'warn' : 'info'
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (logFailures) {
          await systemLogger.log({
            eventType: 'operation_failure',
            serviceName: service,
            operation: operationName,
            requestData: { context, attempt, max_attempts: maxAttempts },
            errorDetails: {
              message: lastError.message,
              stack: lastError.stack,
              name: lastError.name
            },
            severity: attempt === maxAttempts ? 'error' : 'warn',
            executionTimeMs: Date.now() - startTime
          });
        }

        if (attempt === maxAttempts) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }

    // Log final failure
    await systemLogger.log({
      eventType: 'operation_exhausted',
      serviceName: service,
      operation: operationName,
      requestData: { context, total_attempts: maxAttempts },
      errorDetails: {
        message: lastError.message,
        stack: lastError.stack,
        name: lastError.name
      },
      severity: 'critical',
      executionTimeMs: Date.now() - startTime
    });

    throw lastError;
  }

  /**
   * Log error with context and automatic categorization
   */
  public static async logRobustError(
    error: any, 
    context: string, 
    service: string = 'application',
    operation: string = 'unknown'
  ): Promise<void> {
    const severity = this.categorizeErrorSeverity(error);
    
    await systemLogger.log({
      eventType: 'error_logged',
      serviceName: service,
      operation,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        status: error.status,
        context
      },
      severity
    });

    // Also call original error handler for console logging
    this.logError(error, context);
  }

  /**
   * Categorize error severity automatically
   */
  private static categorizeErrorSeverity(error: any): 'debug' | 'info' | 'warn' | 'error' | 'critical' {
    // Network errors are usually retryable - warn level
    if (this.isNetworkError(error)) {
      return 'warn';
    }

    // Client errors (4xx) are usually user/input issues
    if (error.status >= 400 && error.status < 500) {
      return 'warn';
    }

    // Server errors (5xx) are more serious
    if (error.status >= 500) {
      return 'error';
    }

    // Payment/financial errors are critical
    if (error.message?.toLowerCase().includes('payment') || 
        error.message?.toLowerCase().includes('stripe') ||
        error.message?.toLowerCase().includes('charge')) {
      return 'critical';
    }

    // Database errors are critical
    if (error.message?.toLowerCase().includes('database') ||
        error.message?.toLowerCase().includes('supabase') ||
        error.message?.toLowerCase().includes('sql')) {
      return 'critical';
    }

    // Default to error level
    return 'error';
  }

  /**
   * Create error boundary for React components
   */
  public static createErrorBoundary(componentName: string) {
    return {
      componentDidCatch: async (error: Error, errorInfo: any) => {
        await this.logRobustError(
          error,
          `React Error Boundary: ${componentName}`,
          'react',
          'component_error'
        );
      }
    };
  }

  /**
   * Wrap async functions with automatic error handling
   */
  public static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: string,
    service: string = 'application'
  ): T {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.logRobustError(error, context, service, fn.name);
        throw error;
      }
    }) as T;
  }
}

// Global error handlers
if (typeof window !== 'undefined') {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', async (event) => {
    await RobustErrorHandler.logRobustError(
      event.reason,
      'Unhandled Promise Rejection',
      'window',
      'unhandled_rejection'
    );
  });

  // Global JavaScript errors
  window.addEventListener('error', async (event) => {
    await RobustErrorHandler.logRobustError(
      event.error || new Error(event.message),
      `Global Error: ${event.filename}:${event.lineno}`,
      'window',
      'global_error'
    );
  });
}

export { RobustErrorHandler as ErrorHandler };