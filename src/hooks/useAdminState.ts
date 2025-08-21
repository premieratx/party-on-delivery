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
            console.log('🔄 Restored admin form data only:', { formDataKeys: Object.keys(parsed.formData || {}) });
          } else {
            localStorage.removeItem(STORAGE_KEY);
            console.log('⏰ Cleared expired admin state');
          }
        }
      } catch (error) {
        console.warn('Failed to load admin state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadStoredState();

    // Prevent reload on browser tab focus/blur events
    const preventReload = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners to prevent unnecessary reloads
    window.addEventListener('beforeunload', preventReload);
    document.addEventListener('visibilitychange', preventReload);

    return () => {
      window.removeEventListener('beforeunload', preventReload);
      document.removeEventListener('visibilitychange', preventReload);
    };
  }, []); // Keep empty dependency array to prevent clearing on tab switches

  // Save state to localStorage whenever it changes - with success logging
  const saveState = useCallback((tab?: string, data?: Record<string, any>) => {
    try {
      const state: AdminState = {
        activeTab: tab || activeTab,
        formData: data || formData,
        lastUpdated: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // console.log('💾 Admin state saved successfully:', { tab: tab || activeTab, dataKeys: Object.keys(data || formData) });
    } catch (error) {
      console.error('❌ Failed to save admin state:', error);
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