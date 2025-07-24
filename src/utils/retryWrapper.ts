/**
 * Retry wrapper for async operations with exponential backoff
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if shouldn't retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        break;
      }
      
      console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }
  
  throw lastError;
}

export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('network') ||
    error?.name === 'TypeError'
  );
};

export const isRetryableError = (error: any): boolean => {
  // Retry network errors and 5xx server errors
  if (isNetworkError(error)) return true;
  
  const status = error?.status || error?.response?.status;
  return status >= 500 || status === 408 || status === 429;
};