/**
 * Enhanced error handler for Supabase function calls and API requests
 * Provides consistent error handling across the entire application
 */

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

/**
 * Handles Supabase function invoke responses with proper error checking
 */
export async function handleSupabaseFunction<T>(
  functionCall: Promise<{ data: T; error: any }>
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await functionCall;
    
    if (error) {
      console.error('Supabase function error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Request failed',
          code: error.code,
          details: error.details,
          statusCode: error.status
        }
      };
    }

    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Function call exception:', err);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        details: err
      }
    };
  }
}

/**
 * Handles payment-specific errors with user-friendly messages
 */
export function handlePaymentError(error: any): string {
  if (!error) return 'Payment failed';
  
  const message = error.message || error.toString();
  
  // Common payment error scenarios
  if (message.includes('card_declined')) {
    return 'Your card was declined. Please check your card details or try a different payment method.';
  }
  
  if (message.includes('insufficient_funds')) {
    return 'Insufficient funds. Please check your account balance or try a different payment method.';
  }
  
  if (message.includes('expired_card')) {
    return 'Your card has expired. Please update your payment information.';
  }
  
  if (message.includes('invalid_cvc')) {
    return 'Invalid security code. Please check your card\'s CVC.';
  }
  
  if (message.includes('invalid_number')) {
    return 'Invalid card number. Please check and try again.';
  }
  
  if (message.includes('processing_error')) {
    return 'Payment processing error. Please try again in a moment.';
  }
  
  if (message.includes('rate_limit')) {
    return 'Too many payment attempts. Please wait a moment and try again.';
  }
  
  if (message.includes('non2xx') || message.includes('status')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Generic fallback for unhandled errors
  return `Payment failed: ${message}`;
}

/**
 * Retry function for failed API calls
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`API call attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('All retry attempts failed');
}

/**
 * Safe Supabase function invoke with automatic retries for network errors
 */
export async function safeSupabaseInvoke<T>(
  supabase: any,
  functionName: string,
  options?: any,
  maxRetries: number = 2
): Promise<ApiResponse<T>> {
  return retryApiCall(async () => {
    const result = await supabase.functions.invoke(functionName, options);
    return handleSupabaseFunction(Promise.resolve(result));
  }, maxRetries);
}