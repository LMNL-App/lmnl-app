/**
 * Profile Screen
 * Displays current user's profile
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar, Button } from '../../src/components/ui';
import { APP_CONFIG } from '../../src/constants/config';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import type { Post, UserStats } from '../../src/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;
const NUM_COLUMNS = 3;
// Calculate grid size: available width minus gaps, divided by columns
const GRID_SIZE = (SCREEN_WIDTH - Spacing.base * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { profile, fetchProfile, user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_sponsored', false)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch saved posts
      const { data: savedData, error: savedError } = await supabase
        .from('saved_posts')
        .select('post:posts(*)')
        .eq('user_id', user.id)
        .eq('post.is_sponsored', false)
        .order('created_at', { ascending: false });

      if (savedError) {
        console.error('Error fetching saved posts:', savedError);
      } else {
        const mapped = (savedData || [])
          .map((row: { post: Post | null }) => row.post)
          .filter((post): post is Post => !!post);
        setSavedPosts(mapped);
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!statsError) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchData();
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProfile();
    fetchData();
  }, [fetchData]);

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
        onPress={() => router.push(`/profile/followers?userId=${user?.id}&username=${profile?.username}`)}
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
        onPress={() => router.push(`/profile/following?userId=${user?.id}&username=${profile?.username}`)}
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

  const renderPostGrid = (items: Post[]) => (
    <View style={styles.postsGrid}>
      {items.map((post, index) => (
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

  if (!profile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.username, { color: colors.textTertiary }]}>
            @{profile.username}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="menu-outline" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

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
              title="Edit Profile"
              variant="secondary"
              onPress={() => router.push('/settings/edit-profile')}
              style={styles.actionButton}
            />
            <Button
              title="Share Profile"
              variant="secondary"
              onPress={handleShareProfile}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'posts' && { borderBottomColor: colors.text },
            ]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name={activeTab === 'posts' ? 'grid' : 'grid-outline'}
              size={24}
              color={activeTab === 'posts' ? colors.text : colors.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'saved' && { borderBottomColor: colors.text },
            ]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={activeTab === 'saved' ? colors.text : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === 'posts' && posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No posts yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Share your first mindful moment
            </Text>
          </View>
        ) : activeTab === 'saved' && savedPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No saved posts
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Save posts to view them later
            </Text>
          </View>
        ) : (
          renderPostGrid(activeTab === 'posts' ? posts : savedPosts)
        )}
      </ScrollView>
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
    paddingVertical: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  username: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: Spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  fullName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.md,
  },
  bio: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
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
    borderBottomColor: 'transparent',
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
    lineHeight: Typography.sizes.xs * Typography.lineHeights.normal,
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
