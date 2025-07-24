import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing loading states with automatic error handling
 */
export function useLoadingState(initialLoading = false) {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const startLoading = useCallback(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setState({ isLoading: true, error: null });
    return abortControllerRef.current;
  }, []);
  
  const setError = useCallback((error: string | Error) => {
    setState({ 
      isLoading: false, 
      error: error instanceof Error ? error.message : error 
    });
  }, []);
  
  const setSuccess = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);
  
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({ isLoading: false, error: null });
  }, []);
  
  return {
    ...state,
    startLoading,
    setError,
    setSuccess,
    reset,
    abortController: abortControllerRef.current
  };
}