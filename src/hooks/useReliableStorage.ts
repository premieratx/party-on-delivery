import { useState, useEffect } from 'react';
import { cacheManager } from '@/utils/cacheManager';
import { ErrorHandler } from '@/utils/errorHandler';

/**
 * Enhanced storage hook that provides multiple fallback layers for data persistence
 */
export function useReliableStorage<T>(key: string, initialValue: T, backupKey?: string) {
  const [value, setValue] = useState<T>(() => {
    try {
      // Try primary localStorage first
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }

      // Try cache manager as fallback
      const cachedItem = cacheManager.get<T>(backupKey || `${key}_backup`);
      if (cachedItem) {
        console.log(`Restored ${key} from cache backup`);
        return cachedItem;
      }

      return initialValue;
    } catch (error) {
      ErrorHandler.logError(error, `useReliableStorage.${key}`);
      return initialValue;
    }
  });

  const setValueReliably = (newValue: T | ((prev: T) => T)) => {
    try {
      const valueToStore = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
      
      // Update state
      setValue(valueToStore);
      
      // Store in multiple places for reliability
      // Primary storage
      localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Backup in cache manager with TTL
      cacheManager.set(backupKey || `${key}_backup`, valueToStore, 24 * 60); // 24 hours
      
      return true;
    } catch (error) {
      ErrorHandler.logError(error, `useReliableStorage.set.${key}`);
      return false;
    }
  };

  const clearValue = () => {
    try {
      setValue(initialValue);
      localStorage.removeItem(key);
      cacheManager.remove(backupKey || `${key}_backup`);
    } catch (error) {
      ErrorHandler.logError(error, `useReliableStorage.clear.${key}`);
    }
  };

  // Auto-save to backup periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (value !== initialValue) {
        cacheManager.set(backupKey || `${key}_backup`, value, 24 * 60);
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [value, key, backupKey, initialValue]);

  return [value, setValueReliably, clearValue] as const;
}