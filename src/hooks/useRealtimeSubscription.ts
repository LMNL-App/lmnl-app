/**
 * Real-time subscription hook
 * Subscribes to Supabase real-time channels for live updates
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE';

type SubscriptionConfig = {
  table: string;
  event?: SubscriptionEvent | '*';
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
};

export function useRealtimeSubscription(
  channelName: string,
  config: SubscriptionConfig,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!enabled || !user) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === 'INSERT' && config.onInsert) {
            config.onInsert(payload.new);
          } else if (eventType === 'UPDATE' && config.onUpdate) {
            config.onUpdate(payload.new);
          } else if (eventType === 'DELETE' && config.onDelete) {
            config.onDelete(payload.old);
          }

          if (config.onChange) {
            config.onChange(payload);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, config.table, config.filter, enabled, user?.id]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

/**
 * Subscribe to new notifications for the current user
 */
export function useNotificationSubscription(
  onNewNotification: (notification: any) => void
) {
  const { user } = useAuthStore();

  return useRealtimeSubscription(
    `notifications:${user?.id}`,
    {
      table: 'notifications',
      event: 'INSERT',
      filter: user ? `user_id=eq.${user.id}` : undefined,
      onInsert: onNewNotification,
    },
    !!user
  );
}

/**
 * Subscribe to interactions (likes/comments) on a specific post
 */
export function usePostInteractionSubscription(
  postId: string,
  onNewInteraction: (interaction: any) => void,
  onDeletedInteraction: (interaction: any) => void
) {
  return useRealtimeSubscription(
    `post_interactions:${postId}`,
    {
      table: 'interactions',
      filter: `post_id=eq.${postId}`,
      onInsert: onNewInteraction,
      onDelete: onDeletedInteraction,
    },
    !!postId
  );
}

/**
 * Subscribe to new posts from followed users
 */
export function useFeedSubscription(
  onNewPost: (post: any) => void
) {
  const { user } = useAuthStore();

  return useRealtimeSubscription(
    `feed:${user?.id}`,
    {
      table: 'posts',
      event: 'INSERT',
      onInsert: onNewPost,
    },
    !!user
  );
}

/**
 * Subscribe to follow changes for a specific user
 */
export function useFollowSubscription(
  userId: string,
  onFollowChange: (payload: any) => void
) {
  return useRealtimeSubscription(
    `follows:${userId}`,
    {
      table: 'follows',
      filter: `following_id=eq.${userId}`,
      onChange: onFollowChange,
    },
    !!userId
  );
}
