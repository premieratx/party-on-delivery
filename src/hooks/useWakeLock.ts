import { useEffect } from 'react';

export const useWakeLock = () => {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired');
        }
      } catch (err) {
        console.warn('Wake lock could not be acquired:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    // Request initial wake lock
    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) {
        wakeLock.release();
        console.log('Wake lock released');
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};