/**
 * Refresh control hook
 * Manages pull-to-refresh state for lists
 */
import { useState, useCallback } from 'react';

export function useRefreshControl(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return {
    isRefreshing,
    onRefresh: handleRefresh,
  };
}
