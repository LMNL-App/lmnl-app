/**
 * User Profile Screen
 * Displays another user's profile
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar, Button } from '../../src/components/ui';
import { APP_CONFIG } from '../../src/constants/config';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import type { Profile, Post, UserStats } from '../../src/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;
const NUM_COLUMNS = 3;
// Calculate grid size: available width minus gaps, divided by columns
const GRID_SIZE = (SCREEN_WIDTH - Spacing.base * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // If viewing own profile, redirect to tabs/profile
  useEffect(() => {
    if (userId && currentUser?.id === userId) {
      router.replace('/(tabs)/profile');
    }
  }, [userId, currentUser?.id]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sponsored', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userId]);

  const checkFollowStatus = useCallback(async () => {
    if (!userId || !currentUser?.id) return;

    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // Not following
      setIsFollowing(false);
    }
  }, [userId, currentUser?.id]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProfile(), fetchPosts(), fetchStats(), checkFollowStatus()]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchProfile, fetchPosts, fetchStats, checkFollowStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleFollow = async () => {
    if (!userId || !currentUser?.id || isFollowLoading) return;

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        if (stats) {
          setStats({ ...stats, followers_count: Math.max(0, (stats.followers_count || 0) - 1) });
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
          });

        if (error) throw error;
        setIsFollowing(true);
        if (stats) {
          setStats({ ...stats, followers_count: (stats.followers_count || 0) + 1 });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    try {
      await Share.share({
        message: `Check out @${profile.username} on LMNL - Quality over Quantity\n${APP_CONFIG.webBaseUrl}/u/${profile.username}`,
        title: `${profile.full_name} on LMNL`,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stats?.posts_count || 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Posts
        </Text>
      </View>
      <TouchableOpacity
        style={styles.statItem}
        onPress={() => router.push(`/profile/followers?userId=${userId}&username=${profile?.username}`)}
        accessibilityRole="button"
        accessibilityLabel={`${stats?.followers_count || 0} followers`}
      >
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stats?.followers_count || 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Followers
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.statItem}
        onPress={() => router.push(`/profile/following?userId=${userId}&username=${profile?.username}`)}
        accessibilityRole="button"
        accessibilityLabel={`${stats?.following_count || 0} following`}
      >
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stats?.following_count || 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          Following
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPostGrid = () => (
    <View style={styles.postsGrid}>
      {posts.map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={[
            styles.postGridItem,
            // Don't add right margin to last item in each row
            (index + 1) % NUM_COLUMNS !== 0 && { marginRight: GAP },
          ]}
          onPress={() => router.push(`/post/${post.id}`)}
        >
          {post.image_url ? (
            <Image
              source={{ uri: post.image_url }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.textPost, { backgroundColor: colors.backgroundSecondary }]}>
              <Text
                style={[styles.textPostContent, { color: colors.text }]}
                numberOfLines={4}
              >
                {post.content}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Profile' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            User not found
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            This profile may have been deleted or doesn't exist.
          </Text>
          <Button
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `@${profile.username}` }} />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Avatar
            uri={profile.avatar_url}
            name={profile.full_name}
            size="xlarge"
          />

          <Text style={[styles.fullName, { color: colors.text }]}>
            {profile.full_name}
          </Text>

          <Text style={[styles.username, { color: colors.textTertiary }]}>
            @{profile.username}
          </Text>

          {profile.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>
              {profile.bio}
            </Text>
          )}

          {profile.website && (
            <TouchableOpacity>
              <Text style={[styles.website, { color: colors.textSecondary }]}>
                {profile.website}
              </Text>
            </TouchableOpacity>
          )}

          {renderStats()}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title={isFollowing ? 'Following' : 'Follow'}
              variant={isFollowing ? 'secondary' : 'primary'}
              onPress={handleFollow}
              loading={isFollowLoading}
              style={styles.actionButton}
            />
            <Button
              title="Share"
              variant="secondary"
              onPress={handleShareProfile}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Posts Tab */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <View style={[styles.tab, { borderBottomColor: colors.text }]}>
            <Ionicons name="grid" size={24} color={colors.text} />
          </View>
        </View>

        {/* Content */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No posts yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              This user hasn't shared any posts yet.
            </Text>
          </View>
        ) : (
          renderPostGrid()
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  fullName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.md,
  },
  username: {
    fontSize: Typography.sizes.base,
    marginTop: Spacing.xs,
  },
  bio: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  website: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: Spacing.base,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.base,
  },
  postGridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    marginBottom: GAP,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E2DD',
  },
  textPost: {
    width: '100%',
    height: '100%',
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  textPostContent: {
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.sizes.xs * 1.4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
  },
});
