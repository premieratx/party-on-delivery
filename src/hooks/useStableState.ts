import { useState, useCallback, useRef } from 'react';

/**
 * A stable state hook that prevents unnecessary re-renders
 * and provides better performance for complex state updates
 */
export function useStableState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const stateRef = useRef(state);
  
  // Update ref when state changes
  stateRef.current = state;
  
  const setStableState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(currentState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(currentState)
        : newState;
      
      // Only update if the state actually changed
      if (JSON.stringify(nextState) !== JSON.stringify(currentState)) {
        return nextState;
      }
      return currentState;
    });
  }, []);
  
  const getCurrentState = useCallback(() => stateRef.current, []);
  
  return [state, setStableState, getCurrentState] as const;
}