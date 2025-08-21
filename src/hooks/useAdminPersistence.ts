import { useState, useEffect } from 'react';

interface AdminState {
  activeTab?: string;
  formData?: any;
  lastAccessed?: number;
}

const STORAGE_KEY = 'admin-dashboard-state';
const STATE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export const useAdminPersistence = (componentName: string) => {
  const [state, setState] = useState<AdminState>({});

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${componentName}`);
      if (stored) {
        const parsedState = JSON.parse(stored);
        const now = Date.now();
        
        // Check if state hasn't expired
        if (parsedState.lastAccessed && (now - parsedState.lastAccessed) < STATE_EXPIRY) {
          console.log('🔄 Restoring admin state for', componentName);
          setState(parsedState);
        } else {
          console.log('⏰ Admin state expired for', componentName);
          localStorage.removeItem(`${STORAGE_KEY}-${componentName}`);
        }
      }
    } catch (error) {
      console.error('Error loading admin state:', error);
    }
  }, [componentName]);

  // Save state to localStorage
  const saveState = (newState: Partial<AdminState>) => {
    try {
      const stateToSave = {
        ...state,
        ...newState,
        lastAccessed: Date.now()
      };
      setState(stateToSave);
      localStorage.setItem(`${STORAGE_KEY}-${componentName}`, JSON.stringify(stateToSave));
      console.log('💾 Admin state saved for', componentName);
    } catch (error) {
      console.error('Error saving admin state:', error);
    }
  };

  // Clear state
  const clearState = () => {
    try {
      setState({});
      localStorage.removeItem(`${STORAGE_KEY}-${componentName}`);
      console.log('🗑️ Admin state cleared for', componentName);
    } catch (error) {
      console.error('Error clearing admin state:', error);
    }
  };

  return {
    state,
    saveState,
    clearState
  };
};