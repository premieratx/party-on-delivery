import { useCallback } from 'react';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHapticFeedback() {
  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    // Check if device supports vibration
    if (!('vibrate' in navigator)) return;

    // Haptic patterns (in milliseconds)
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
      success: [10, 50, 10],
      warning: [50, 50, 50],
      error: [100, 50, 100]
    };

    try {
      navigator.vibrate(patterns[pattern]);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }, []);

  const triggerCartFeedback = useCallback((action: 'add' | 'remove' | 'update') => {
    switch (action) {
      case 'add':
        triggerHaptic('success');
        break;
      case 'remove':
        triggerHaptic('warning');
        break;
      case 'update':
        triggerHaptic('light');
        break;
    }
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    triggerCartFeedback,
    isSupported: 'vibrate' in navigator
  };
}