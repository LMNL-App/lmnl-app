/**
 * Feed Screen (Home)
 * Displays the finite feed with activity dashboard
 */
import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';
import { useFeedStore } from '../../src/stores/feedStore';
import { useUsageStore } from '../../src/stores/usageStore';
import { ActivityDashboard, PostCard, SponsoredPost, AdMobBanner } from '../../src/components/feed';
import { Typography, Spacing } from '../../src/constants/theme';
import type { FeedPost } from '../../src/types/database';

export default function FeedScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const {
    posts,
    sponsoredPost,
    isLoading,
    isRefreshing,
    hasReachedLimit,
    fetchFeed,
    refreshFeed,
  } = useFeedStore();
  const { fetchUsage, feedPostsRemaining } = useUsageStore();

  useEffect(() => {
    fetchUsage();
    fetchFeed();
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshFeed(), fetchUsage()]);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: FeedPost; index: number }) => {
      const shouldShowSinglePostAd = posts.length === 1 && index === 0;
      const shouldShowStandardAd = posts.length > 1 && index === 3;
      // Insert sponsored content after 3rd post
      if (shouldShowSinglePostAd || shouldShowStandardAd) {
        // Prefer internal sponsored post, fallback to AdMob
        const adComponent = sponsoredPost ? (
          <SponsoredPost post={sponsoredPost} />
        ) : (
          <AdMobBanner />
        );

        if (shouldShowSinglePostAd) {
          return (
            <>
              <PostCard post={item} />
              {adComponent}
            </>
          );
        }

        return (
          <>
            {adComponent}
            <PostCard post={item} />
          </>
        );
      }

      return <PostCard post={item} />;
    },
    [posts.length, sponsoredPost]
  );

  const renderHeader = () => (
    <View>
      <ActivityDashboard />
    </View>
  );

  const renderFooter = () => {
    if (isLoading && posts.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (hasReachedLimit || feedPostsRemaining <= 0) {
      return (
        <View style={[styles.limitReached, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.limitTitle, { color: colors.text }]}>
            You have 0 posts left to view today
          </Text>
          <Text style={[styles.limitMessage, { color: colors.textSecondary }]}>
            LMNL will gently remind you to log off when you reach your limit.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No posts yet
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          Follow some people to see their posts here, or create your first post!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.logo, { color: colors.text }]}>lmnl</Text>
        <TouchableOpacity
          onPress={() => router.push('/messages')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
      />

      {/* Initial loading state */}
      {isLoading && posts.length === 0 && (
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    letterSpacing: 4,
  },
  loadingFooter: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  limitReached: {
    margin: Spacing.base,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  limitTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  limitMessage: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
  },
  initialLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
