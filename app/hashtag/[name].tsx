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
import { useThemeStore } from '../../src/stores/themeStore';
import { supabase } from '../../src/lib/supabase';
import { PostCard } from '../../src/components/feed';
import { Typography, Spacing } from '../../src/constants/theme';
import type { FeedPost } from '../../src/types/database';

export default function HashtagScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { colors } = useThemeStore();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHashtagPosts = useCallback(async () => {
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get post IDs associated with this hashtag
      const { data: hashtagData } = await supabase
        .from('hashtags')
        .select('id, posts_count')
        .eq('name', name.toLowerCase())
        .single();

      if (hashtagData) {
        setPostsCount(hashtagData.posts_count);
      }

      const { data: postHashtags } = await supabase
        .from('post_hashtags')
        .select('post_id')
        .eq('hashtag_id', hashtagData?.id || '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!postHashtags || postHashtags.length === 0) {
        setPosts([]);
        return;
      }

      const postIds = postHashtags.map(ph => ph.post_id);

      const { data: postsData, error } = await supabase
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
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const feedPosts: FeedPost[] = await Promise.all(
        (postsData || []).map(async (post: any) => {
          const { count: likesCount } = await supabase
            .from('interactions')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('type', 'like');

          const { count: commentsCount } = await supabase
            .from('interactions')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('type', 'comment');

          const { data: likeData } = user
            ? await supabase
                .from('interactions')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .eq('type', 'like')
                .single()
            : { data: null };

          const { data: saveData } = user
            ? await supabase
                .from('saved_posts')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single()
            : { data: null };

          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            image_url: post.image_url,
            is_sponsored: post.is_sponsored,
            is_edited: post.is_edited || false,
            created_at: post.created_at,
            updated_at: post.updated_at,
            full_name: post.profiles.full_name,
            username: post.profiles.username,
            avatar_url: post.profiles.avatar_url,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: !!likeData,
            is_saved: !!saveData,
          };
        })
      );

      setPosts(feedPosts);
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [name]);

  useEffect(() => {
    fetchHashtagPosts();
  }, [fetchHashtagPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHashtagPosts();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `#${name}`,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.hashtagName, { color: colors.text }]}>#{name}</Text>
              <Text style={[styles.postsCount, { color: colors.textSecondary }]}>
                {postsCount} {postsCount === 1 ? 'post' : 'posts'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No posts with this hashtag yet
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
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
  header: {
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  hashtagName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  postsCount: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
  },
});
