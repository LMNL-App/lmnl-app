/**
 * Feed state management
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DAILY_LIMITS } from '../constants/limits';
import type { FeedPost, SponsoredPost, PostWithAuthor } from '../types/database';

interface FeedState {
  posts: FeedPost[];
  sponsoredPost: SponsoredPost | null;
  isLoading: boolean;
  isRefreshing: boolean;
  hasReachedLimit: boolean;
  error: string | null;

  // Actions
  fetchFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  fetchSponsoredPost: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  savePost: (postId: string) => Promise<void>;
  unsavePost: (postId: string) => Promise<void>;
  addPost: (post: FeedPost) => void;
  removePost: (postId: string) => void;
  updatePostContent: (postId: string, content: string | null) => void;
  clearFeed: () => void;
  invalidateCache: () => void;
  updatePostsForUser: (userId: string, updates: { username?: string; full_name?: string; avatar_url?: string | null }) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  sponsoredPost: null,
  isLoading: false,
  isRefreshing: false,
  hasReachedLimit: false,
  error: null,

  fetchFeed: async () => {
    const { isLoading, posts } = get();
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      // Check remaining feed count
      const { data: remainingCount } = await supabase
        .rpc('get_remaining_feed_count', { p_user_id: user.id });

      if (remainingCount <= 0) {
        set({ hasReachedLimit: true, isLoading: false });
        return;
      }

      // Use the get_feed_posts function for limit-aware fetching
      const { data, error } = await supabase
        .rpc('get_feed_posts', {
          p_user_id: user.id,
          p_limit: Math.min(DAILY_LIMITS.FEED_POSTS - posts.length, remainingCount),
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        set({ hasReachedLimit: true, isLoading: false });
        return;
      }

      // Mark posts as viewed
      const postIds = data.map((p: FeedPost) => p.id);
      await supabase.rpc('mark_posts_viewed', {
        p_user_id: user.id,
        p_post_ids: postIds,
      });

      // Append new posts
      set((state) => ({
        posts: [...state.posts, ...data],
        hasReachedLimit: state.posts.length + data.length >= DAILY_LIMITS.FEED_POSTS,
      }));

      // Fetch sponsored post if we haven't yet
      if (!get().sponsoredPost) {
        await get().fetchSponsoredPost();
      }
    } catch (error: any) {
      console.error('Error fetching feed:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshFeed: async () => {
    const { isRefreshing } = get();
    if (isRefreshing) return;

    set({ isRefreshing: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isRefreshing: false });
        return;
      }

      // Check remaining feed count
      const { data: remainingCount } = await supabase
        .rpc('get_remaining_feed_count', { p_user_id: user.id });

      if (remainingCount <= 0) {
        set({ hasReachedLimit: true, isRefreshing: false });
        return;
      }

      // Fetch fresh posts (only unviewed ones)
      const { data, error } = await supabase
        .rpc('get_feed_posts', {
          p_user_id: user.id,
          p_limit: remainingCount,
        });

      if (error) throw error;

      if (data && data.length > 0) {
        // Mark new posts as viewed
        const postIds = data.map((p: FeedPost) => p.id);
        await supabase.rpc('mark_posts_viewed', {
          p_user_id: user.id,
          p_post_ids: postIds,
        });
      }

      set({
        posts: data || [],
        hasReachedLimit: (data?.length || 0) >= remainingCount,
      });
    } catch (error: any) {
      console.error('Error refreshing feed:', error);
      set({ error: error.message });
    } finally {
      set({ isRefreshing: false });
    }
  },

  fetchSponsoredPost: async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_sponsored_post');

      if (error) throw error;

      if (data && data.length > 0) {
        set({ sponsoredPost: data[0] });

        // Track impression
        await supabase.rpc('increment_ad_impression', { ad_id: data[0].id });
      }
    } catch (error) {
      console.error('Error fetching sponsored post:', error);
    }
  },

  likePost: async (postId) => {
    const { posts } = get();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    // Optimistic update
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = {
      ...updatedPosts[postIndex],
      is_liked: true,
      likes_count: updatedPosts[postIndex].likes_count + 1,
    };
    set({ posts: updatedPosts });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'like',
        });

      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      const revertedPosts = [...posts];
      set({ posts: revertedPosts });
      throw error;
    }
  },

  unlikePost: async (postId) => {
    const { posts } = get();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    // Optimistic update
    const updatedPosts = [...posts];
    updatedPosts[postIndex] = {
      ...updatedPosts[postIndex],
      is_liked: false,
      likes_count: Math.max(0, updatedPosts[postIndex].likes_count - 1),
    };
    set({ posts: updatedPosts });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('type', 'like');

      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      const revertedPosts = [...posts];
      set({ posts: revertedPosts });
      throw error;
    }
  },

  savePost: async (postId) => {
    const { posts } = get();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex !== -1) {
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = {
        ...updatedPosts[postIndex],
        is_saved: true,
      };
      set({ posts: updatedPosts });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .insert({
          user_id: user.id,
          post_id: postId,
        });

      if (error) throw error;
    } catch (error: any) {
      if (postIndex !== -1) {
        const revertedPosts = [...posts];
        set({ posts: revertedPosts });
      }
      throw error;
    }
  },

  unsavePost: async (postId) => {
    const { posts } = get();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex !== -1) {
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = {
        ...updatedPosts[postIndex],
        is_saved: false,
      };
      set({ posts: updatedPosts });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;
    } catch (error: any) {
      if (postIndex !== -1) {
        const revertedPosts = [...posts];
        set({ posts: revertedPosts });
      }
      throw error;
    }
  },

  addPost: (post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  removePost: (postId) => {
    set((state) => ({
      posts: state.posts.filter(p => p.id !== postId),
    }));
  },

  updatePostContent: (postId, content) => {
    set((state) => ({
      posts: state.posts.map(p =>
        p.id === postId ? { ...p, content, is_edited: true } as FeedPost : p
      ),
    }));
  },

  clearFeed: () => {
    set({
      posts: [],
      sponsoredPost: null,
      hasReachedLimit: false,
      error: null,
    });
  },

  invalidateCache: () => {
    // Clear feed and trigger a refetch
    set({
      posts: [],
      sponsoredPost: null,
      hasReachedLimit: false,
      error: null,
    });
    // Refetch feed
    get().fetchFeed();
  },

  updatePostsForUser: (userId, updates) => {
    // Update all posts by this user with new profile info
    const { posts } = get();
    const updatedPosts = posts.map(post => {
      if (post.user_id === userId) {
        return {
          ...post,
          ...(updates.username !== undefined && { username: updates.username }),
          ...(updates.full_name !== undefined && { full_name: updates.full_name }),
          ...(updates.avatar_url !== undefined && { avatar_url: updates.avatar_url }),
        };
      }
      return post;
    });
    set({ posts: updatedPosts });
  },
}));
