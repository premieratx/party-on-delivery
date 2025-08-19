import { useState, useEffect } from 'react';

interface AppConfig {
  googleMapsEnabled: boolean;
  abandonedOrderTrackingEnabled: boolean;
  // Add more features as needed
}

const DEFAULT_CONFIG: AppConfig = {
  googleMapsEnabled: false, // Disabled by default
  abandonedOrderTrackingEnabled: false, // Disabled by default
};

const CONFIG_STORAGE_KEY = 'app_config';

export const useAppConfig = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      }
    } catch (error) {
      console.warn('Failed to load app config:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save app config:', error);
    }
  };

  return {
    config,
    updateConfig,
    isLoading
  };
};