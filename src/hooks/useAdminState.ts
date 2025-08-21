import { useState, useEffect, useCallback } from 'react';

interface AdminState {
  activeTab: string;
  formData: Record<string, any>;
  lastUpdated: number;
}

const STORAGE_KEY = 'admin_dashboard_state';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function useAdminState(defaultTab = 'overview') {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Load state from localStorage on mount - PREVENT TAB SWITCHING
  useEffect(() => {
    const loadStoredState = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AdminState = JSON.parse(stored);
          const now = Date.now();
          
          // Only restore form data, NOT activeTab to prevent auto-switching
          if (now - parsed.lastUpdated < STORAGE_EXPIRY) {
            setFormData(parsed.formData || {});
            // Remove excessive logging - form restoration works silently
          } else {
            localStorage.removeItem(STORAGE_KEY);
            // Remove excessive logging - expiry works silently
          }
        }
      } catch (error) {
        console.warn('Failed to load admin state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadStoredState();

    // No event listeners needed - they were blocking user interactions
  }, []); // Keep empty dependency array to prevent clearing on tab switches

  // Save state to localStorage - debounced to prevent spam
  const saveState = useCallback((tab?: string, data?: Record<string, any>) => {
    try {
      const state: AdminState = {
        activeTab: tab || activeTab,
        formData: data || formData,
        lastUpdated: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Silent save - no console logging to prevent spam
    } catch (error) {
      // Silent error handling to prevent console spam
    }
  }, [activeTab, formData]);

  // Update active tab and persist
  const updateActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    saveState(tab);
  }, [saveState]);

  // Update form data and persist
  const updateFormData = useCallback((key: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      saveState(activeTab, updated);
      return updated;
    });
  }, [activeTab, saveState]);

  // Clear form data for a specific key
  const clearFormData = useCallback((key: string) => {
    setFormData(prev => {
      const updated = { ...prev };
      delete updated[key];
      saveState(activeTab, updated);
      return updated;
    });
  }, [activeTab, saveState]);

  // Clear all state - WITH ADMIN SESSION PROTECTION
  const clearState = useCallback(() => {
    // Protect admin session from being cleared accidentally 
    const isAdminSession = sessionStorage.getItem('admin_verified') === 'true';
    if (isAdminSession) {
      console.log('🛡️ Protected admin state from being cleared');
      return;
    }
    
    setActiveTab(defaultTab);
    setFormData({});
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Admin state cleared (non-protected session)');
  }, [defaultTab]);

  return {
    activeTab,
    formData,
    updateActiveTab,
    updateFormData,
    clearFormData,
    clearState,
    getFormValue: (key: string) => formData[key],
    setFormValue: updateFormData
  };
}