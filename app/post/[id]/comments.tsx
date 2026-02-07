/**
 * Comments Screen
 * Displays all comments for a post and allows adding new comments
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../src/stores/themeStore';
import { supabase } from '../../../src/lib/supabase';
import { CommentItem, CommentInput } from '../../../src/components/feed';
import { Typography, Spacing } from '../../../src/constants/theme';
import { usePostInteractionSubscription } from '../../../src/hooks/useRealtimeSubscription';
import type { Comment } from '../../../src/types/database';

export default function CommentsScreen() {
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('interactions')
        .select(`
          id,
          user_id,
          post_id,
          content,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('type', 'comment')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform the data to match our Comment type
      const transformedComments: Comment[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        post_id: item.post_id,
        content: item.content,
        created_at: item.created_at,
        user: {
          id: item.profiles.id,
          username: item.profiles.username,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
        },
      }));

      setComments(transformedComments);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postId]);

  // Subscribe to real-time comment updates
  usePostInteractionSubscription(
    postId || '',
    (newInteraction) => {
      if (newInteraction.type === 'comment') {
        fetchComments();
      }
    },
    () => {}
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchComments();
  }, [fetchComments]);

  const handleCommentSubmit = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: insertError } = await supabase
      .from('interactions')
      .insert({
        user_id: user.id,
        post_id: postId,
        type: 'comment',
        content,
      })
      .select(`
        id,
        user_id,
        post_id,
        content,
        created_at,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (insertError) throw insertError;

    // Add the new comment to the list
    if (data) {
      const newComment: Comment = {
        id: data.id,
        user_id: data.user_id,
        post_id: data.post_id,
        content: data.content,
        created_at: data.created_at,
        user: {
          id: (data.profiles as any).id,
          username: (data.profiles as any).username,
          full_name: (data.profiles as any).full_name,
          avatar_url: (data.profiles as any).avatar_url,
        },
      };
      setComments(prev => [...prev, newComment]);
    }
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No comments yet
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          Be the first to share your thoughts!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          title: 'Comments',
          headerBackTitle: 'Back',
        }}
      />

      {/* Comments List */}
      <FlatList
        data={comments}
        renderItem={({ item }) => <CommentItem comment={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          comments.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Comment Input */}
      <CommentInput
        postId={postId || ''}
        onCommentSubmit={handleCommentSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyList: {
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.08)',
  },
  errorContainer: {
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: 8,
  },
  errorText: {
    color: '#FDFCFB',
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
});
