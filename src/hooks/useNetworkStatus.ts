/**
 * Network status hook
 * Monitors connectivity and provides online/offline state
 */
import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnectivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Periodic check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  return {
    isOnline,
    isChecking,
    refresh: checkConnectivity,
  };
}
