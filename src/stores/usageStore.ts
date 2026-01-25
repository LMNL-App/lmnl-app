/**
 * Daily usage tracking state management
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DAILY_LIMITS, getPostLimit } from '../constants/limits';
import { getCurrentDateString } from '../utils/dateUtils';
import type { DailyUsage } from '../types/database';

interface UsageState {
  usage: DailyUsage | null;
  isLoading: boolean;
  lastFetched: Date | null;

  // Computed limits
  postsRemaining: number;
  likesRemaining: number;
  commentsRemaining: number;
  feedPostsRemaining: number;

  // Actions
  fetchUsage: () => Promise<void>;
  incrementPosts: () => void;
  incrementLikes: () => void;
  incrementComments: () => void;
  incrementPostsViewed: (count?: number) => void;
  decrementLikes: () => void;
  resetForNewDay: () => void;

  // Checks
  canPost: (role: string, isVerified: boolean) => boolean;
  canLike: () => boolean;
  canComment: () => boolean;
  canViewMorePosts: () => boolean;
}

const DEFAULT_USAGE: Omit<DailyUsage, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  date: getCurrentDateString(),
  posts_count: 0,
  likes_count: 0,
  comments_count: 0,
  posts_viewed: 0,
};

export const useUsageStore = create<UsageState>((set, get) => ({
  usage: null,
  isLoading: false,
  lastFetched: null,

  // Default computed values
  postsRemaining: DAILY_LIMITS.POSTS_STANDARD,
  likesRemaining: DAILY_LIMITS.LIKES,
  commentsRemaining: DAILY_LIMITS.COMMENTS,
  feedPostsRemaining: DAILY_LIMITS.FEED_POSTS,

  fetchUsage: async () => {
    set({ isLoading: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const today = getCurrentDateString();

      // Get or create today's usage record
      let { data, error } = await supabase
        .from('daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code === 'PGRST116') {
        // Record doesn't exist, create it
        const { data: newData, error: insertError } = await supabase
          .from('daily_usage')
          .insert({
            user_id: user.id,
            date: today,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      if (data) {
        set({
          usage: data,
          postsRemaining: DAILY_LIMITS.POSTS_STANDARD - data.posts_count,
          likesRemaining: DAILY_LIMITS.LIKES - data.likes_count,
          commentsRemaining: DAILY_LIMITS.COMMENTS - data.comments_count,
          feedPostsRemaining: DAILY_LIMITS.FEED_POSTS - data.posts_viewed,
          lastFetched: new Date(),
        });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  incrementPosts: () => {
    const { usage } = get();
    if (!usage) return;

    const newCount = usage.posts_count + 1;
    set({
      usage: { ...usage, posts_count: newCount },
      postsRemaining: DAILY_LIMITS.POSTS_STANDARD - newCount,
    });
  },

  incrementLikes: () => {
    const { usage } = get();
    if (!usage) return;

    const newCount = usage.likes_count + 1;
    set({
      usage: { ...usage, likes_count: newCount },
      likesRemaining: DAILY_LIMITS.LIKES - newCount,
    });
  },

  incrementComments: () => {
    const { usage } = get();
    if (!usage) return;

    const newCount = usage.comments_count + 1;
    set({
      usage: { ...usage, comments_count: newCount },
      commentsRemaining: DAILY_LIMITS.COMMENTS - newCount,
    });
  },

  incrementPostsViewed: (count = 1) => {
    const { usage } = get();
    if (!usage) return;

    const newCount = usage.posts_viewed + count;
    set({
      usage: { ...usage, posts_viewed: newCount },
      feedPostsRemaining: DAILY_LIMITS.FEED_POSTS - newCount,
    });
  },

  decrementLikes: () => {
    const { usage } = get();
    if (!usage) return;

    const newCount = Math.max(0, usage.likes_count - 1);
    set({
      usage: { ...usage, likes_count: newCount },
      likesRemaining: DAILY_LIMITS.LIKES - newCount,
    });
  },

  resetForNewDay: () => {
    set({
      usage: null,
      postsRemaining: DAILY_LIMITS.POSTS_STANDARD,
      likesRemaining: DAILY_LIMITS.LIKES,
      commentsRemaining: DAILY_LIMITS.COMMENTS,
      feedPostsRemaining: DAILY_LIMITS.FEED_POSTS,
    });
    get().fetchUsage();
  },

  canPost: (role, isVerified) => {
    const { usage } = get();
    if (!usage) return true;

    const limit = getPostLimit(role, isVerified);
    return usage.posts_count < limit;
  },

  canLike: () => {
    const { usage } = get();
    if (!usage) return true;
    return usage.likes_count < DAILY_LIMITS.LIKES;
  },

  canComment: () => {
    const { usage } = get();
    if (!usage) return true;
    return usage.comments_count < DAILY_LIMITS.COMMENTS;
  },

  canViewMorePosts: () => {
    const { usage } = get();
    if (!usage) return true;
    return usage.posts_viewed < DAILY_LIMITS.FEED_POSTS;
  },
}));
