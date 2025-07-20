import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check if localStorage is available (some mobile browsers disable it in private mode)
      if (typeof window === 'undefined' || !window.localStorage) {
        return initialValue;
      }
      
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      
      // Check if localStorage is available before trying to save
      if (typeof window !== 'undefined' && window.localStorage) {
        // Save to local storage with retry logic for mobile browsers
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (storageError) {
          // Fallback: try to clear some space and retry once
          if (storageError.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, attempting to clear old data');
            // Clear old delivery data that might be stale
            const keysToCheck = ['partyondelivery_'];
            Object.keys(localStorage).forEach(k => {
              if (keysToCheck.some(prefix => k.startsWith(prefix)) && k !== key) {
                try {
                  const data = JSON.parse(localStorage.getItem(k) || '{}');
                  // Remove items older than 7 days
                  if (data.timestamp && Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(k);
                  }
                } catch {}
              }
            });
            // Retry saving
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } else {
            throw storageError;
          }
        }
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.warn(`Error saving to localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}