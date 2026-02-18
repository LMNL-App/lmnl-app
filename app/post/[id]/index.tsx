/**
 * Individual Post View Screen
 * Shows a single post with comments
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../src/stores/themeStore';
import { useUsageStore } from '../../../src/stores/usageStore';
import { useFeedStore } from '../../../src/stores/feedStore';
import { supabase } from '../../../src/lib/supabase';
import { Avatar } from '../../../src/components/ui';
import { CommentItem, CommentInput } from '../../../src/components/feed';
import { LimitReachedModal, type LimitType } from '../../../src/components/common';
import { formatTimestamp } from '../../../src/utils/dateUtils';
import { isLimitError } from '../../../src/constants/limits';
import { Typography, Spacing } from '../../../src/constants/theme';
import { usePostInteractionSubscription } from '../../../src/hooks/useRealtimeSubscription';
import type { FeedPost, Comment } from '../../../src/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PostDetailScreen() {
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { likePost, unlikePost } = useFeedStore();
  const { canLike, incrementLikes, decrementLikes, fetchUsage } = useUsageStore();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalType, setLimitModalType] = useState<LimitType>('likes');

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          is_sponsored,
          is_edited,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Get likes and comments count
      const { count: likesCount } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('type', 'like');

      const { count: commentsCount } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('type', 'comment');

      // Check if current user liked the post
      const { data: likeData } = await supabase
        .from('interactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user?.id)
        .eq('type', 'like')
        .single();

      // Check if current user saved the post
      const { data: saveData } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user?.id)
        .single();

      const feedPost: FeedPost = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        image_url: data.image_url,
        is_sponsored: data.is_sponsored,
        is_edited: (data as any).is_edited || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
        full_name: (data.profiles as any).full_name,
        username: (data.profiles as any).username,
        avatar_url: (data.profiles as any).avatar_url,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        is_liked: !!likeData,
        is_saved: !!saveData,
      };

      setPost(feedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    try {
      const { data, error } = await supabase
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

      if (error) throw error;

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
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postId]);

  // Subscribe to real-time interaction changes
  usePostInteractionSubscription(
    postId || '',
    (newInteraction) => {
      if (newInteraction.type === 'comment') {
        fetchComments();
      } else if (newInteraction.type === 'like' && post) {
        setPost({ ...post, likes_count: post.likes_count + 1 });
      }
    },
    (deletedInteraction) => {
      if (deletedInteraction.type === 'like' && post) {
        setPost({ ...post, likes_count: Math.max(0, post.likes_count - 1) });
      }
    }
  );

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPost(), fetchComments()]);
  };

  const handleLike = async () => {
    if (!post || isLiking) return;

    if (post.is_liked) {
      setIsLiking(true);
      try {
        await unlikePost(post.id);
        decrementLikes();
        setPost({ ...post, is_liked: false, likes_count: post.likes_count - 1 });
      } catch (error) {
        console.error('Error unliking:', error);
      } finally {
        setIsLiking(false);
      }
    } else {
      if (!canLike()) {
        setLimitModalType('likes');
        setLimitModalVisible(true);
        return;
      }

      setIsLiking(true);
      try {
        await likePost(post.id);
        incrementLikes();
        setPost({ ...post, is_liked: true, likes_count: post.likes_count + 1 });
      } catch (error: any) {
        if (isLimitError(error.message)) {
          setLimitModalType('likes');
          setLimitModalVisible(true);
          fetchUsage();
        } else {
          console.error('Error liking:', error);
        }
      } finally {
        setIsLiking(false);
      }
    }
  };

  const handleCommentSubmit = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
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

    if (error) throw error;

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
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    }
  };

  const handleSave = async () => {
    if (!post || isSaving) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (post.is_saved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) throw error;
        setPost({ ...post, is_saved: false });
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: post.id,
          });

        if (error) throw error;
        setPost({ ...post, is_saved: true });
      }
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePress = () => {
    if (post) {
      router.push(`/profile/${post.user_id}`);
    }
  };

  const renderHeader = () => {
    if (!post) return null;

    return (
      <View style={[styles.postContainer, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <TouchableOpacity style={styles.postHeader} onPress={handleProfilePress}>
          <Avatar uri={post.avatar_url} name={post.full_name} size="medium" />
          <View style={styles.headerInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {post.username}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
              {formatTimestamp(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Content */}
        {post.content && (
          <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>
        )}

        {/* Image */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={24}
              color={post.is_liked ? colors.like : colors.likeInactive}
            />
            {post.likes_count > 0 && (
              <Text style={[styles.actionCount, { color: post.is_liked ? colors.like : colors.textSecondary }]}>
                {post.likes_count}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
            {post.comments_count > 0 && (
              <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
                {post.comments_count}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons
              name={post.is_saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={post.is_saved ? colors.text : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Comments divider */}
        <View style={[styles.commentsDivider, { borderTopColor: colors.border }]}>
          <Text style={[styles.commentsTitle, { color: colors.textSecondary }]}>
            Comments
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No comments yet. Be the first to comment!
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Post' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Back' }} />

      <FlatList
        data={comments}
        renderItem={({ item }) => <CommentItem comment={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <CommentInput
        postId={postId || ''}
        onCommentSubmit={handleCommentSubmit}
      />

      <LimitReachedModal
        visible={limitModalVisible}
        limitType={limitModalType}
        onClose={() => setLimitModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  postContainer: {
    paddingBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  headerInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  username: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  timestamp: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  content: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#E5E2DD',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  actionCount: {
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.xs,
    fontWeight: Typography.weights.medium,
  },
  commentsDivider: {
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderTopWidth: 1,
  },
  commentsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
  },
});
