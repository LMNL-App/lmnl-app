/**
 * useDailyUsage hook
 * Convenience hook for accessing daily usage state and showing limit modals
 */
import { useState, useCallback, useEffect } from 'react';
import { useUsageStore } from '../stores/usageStore';
import { useAuthStore } from '../stores/authStore';
import type { LimitType } from '../components/common/LimitReachedModal';

export function useDailyUsage() {
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalType, setLimitModalType] = useState<LimitType>('posts');

  const {
    usage,
    isLoading,
    postsRemaining,
    likesRemaining,
    commentsRemaining,
    feedPostsRemaining,
    fetchUsage,
    incrementPosts,
    incrementLikes,
    incrementComments,
    incrementPostsViewed,
    decrementLikes,
    canPost,
    canLike,
    canComment,
    canViewMorePosts,
  } = useUsageStore();

  const { profile } = useAuthStore();

  // Fetch usage on mount
  useEffect(() => {
    fetchUsage();
  }, []);

  // Show limit modal
  const showLimitModal = useCallback((type: LimitType) => {
    setLimitModalType(type);
    setLimitModalVisible(true);
  }, []);

  // Hide limit modal
  const hideLimitModal = useCallback(() => {
    setLimitModalVisible(false);
  }, []);

  // Check if user can post (uses profile role and verification)
  const checkCanPost = useCallback(() => {
    if (!profile) return true;
    return canPost(profile.role, profile.is_verified);
  }, [profile, canPost]);

  // Try to perform action, show modal if limit reached
  const tryPost = useCallback(async (action: () => Promise<void>) => {
    if (!checkCanPost()) {
      showLimitModal('posts');
      return false;
    }
    try {
      await action();
      incrementPosts();
      return true;
    } catch (error: any) {
      if (error.message?.includes('Daily post limit')) {
        showLimitModal('posts');
        fetchUsage(); // Refresh to get server state
      }
      throw error;
    }
  }, [checkCanPost, showLimitModal, incrementPosts, fetchUsage]);

  const tryLike = useCallback(async (action: () => Promise<void>) => {
    if (!canLike()) {
      showLimitModal('likes');
      return false;
    }
    try {
      await action();
      incrementLikes();
      return true;
    } catch (error: any) {
      if (error.message?.includes('Daily like limit')) {
        showLimitModal('likes');
        fetchUsage();
      }
      throw error;
    }
  }, [canLike, showLimitModal, incrementLikes, fetchUsage]);

  const tryComment = useCallback(async (action: () => Promise<void>) => {
    if (!canComment()) {
      showLimitModal('comments');
      return false;
    }
    try {
      await action();
      incrementComments();
      return true;
    } catch (error: any) {
      if (error.message?.includes('Daily comment limit')) {
        showLimitModal('comments');
        fetchUsage();
      }
      throw error;
    }
  }, [canComment, showLimitModal, incrementComments, fetchUsage]);

  return {
    // State
    usage,
    isLoading,

    // Remaining counts
    postsRemaining,
    likesRemaining,
    commentsRemaining,
    feedPostsRemaining,

    // Permission checks
    canPost: checkCanPost,
    canLike,
    canComment,
    canViewMorePosts,

    // Actions
    fetchUsage,
    incrementPosts,
    incrementLikes,
    incrementComments,
    incrementPostsViewed,
    decrementLikes,

    // Try actions with automatic limit handling
    tryPost,
    tryLike,
    tryComment,

    // Modal state and controls
    limitModalVisible,
    limitModalType,
    showLimitModal,
    hideLimitModal,
  };
}
