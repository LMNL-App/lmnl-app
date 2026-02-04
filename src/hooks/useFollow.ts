/**
 * Follow/unfollow hook
 * Manages follow state and actions for a target user
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkFollowStatus = useCallback(async () => {
    if (!targetUserId || !user?.id) {
      setIsChecking(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
    } catch {
      setIsFollowing(false);
    } finally {
      setIsChecking(false);
    }
  }, [targetUserId, user?.id]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const toggleFollow = useCallback(async () => {
    if (!targetUserId || !user?.id || isLoading) return;

    setIsLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(wasFollowing);
      console.error('Error toggling follow:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, user?.id, isFollowing, isLoading]);

  return {
    isFollowing,
    isLoading,
    isChecking,
    toggleFollow,
    refresh: checkFollowStatus,
  };
}
