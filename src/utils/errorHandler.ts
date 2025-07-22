/**
 * Centralized error handling and retry logic
 */

interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export class ErrorHandler {
  private static defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 1.5
  };

  public static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const { maxAttempts, delayMs, backoffMultiplier } = {
      ...this.defaultRetryOptions,
      ...options
    };

    let lastError: Error;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        if (attempt === maxAttempts) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  public static isNetworkError(error: any): boolean {
    return (
      error.name === 'NetworkError' ||
      error.message?.includes('network') ||
      error.message?.includes('fetch') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  public static isRetryableError(error: any): boolean {
    // Don't retry client errors (400-499) except 408, 429
    if (error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429;
    }
    
    // Retry server errors (500+) and network errors
    return error.status >= 500 || this.isNetworkError(error);
  }

  public static logError(error: any, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    console.error('Application Error:', errorInfo);
    
    // In production, you might want to send this to an error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToErrorTracking(errorInfo);
    // }
  }
}