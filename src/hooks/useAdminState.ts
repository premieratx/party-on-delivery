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

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AdminState = JSON.parse(stored);
        const now = Date.now();
        
        // Check if state hasn't expired
        if (now - parsed.lastUpdated < STORAGE_EXPIRY) {
          setActiveTab(parsed.activeTab || defaultTab);
          setFormData(parsed.formData || {});
        } else {
          // Clear expired state
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load admin state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [defaultTab]);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((tab?: string, data?: Record<string, any>) => {
    try {
      const state: AdminState = {
        activeTab: tab || activeTab,
        formData: data || formData,
        lastUpdated: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save admin state:', error);
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

  // Clear all state
  const clearState = useCallback(() => {
    setActiveTab(defaultTab);
    setFormData({});
    localStorage.removeItem(STORAGE_KEY);
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