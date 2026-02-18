/**
 * Search Screen
 * Advanced search with tabs for Users, Posts, and Hashtags
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../src/stores/themeStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar, Button } from '../../src/components/ui';
import { STORAGE_KEYS } from '../../src/constants/config';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { formatTimestamp } from '../../src/utils/dateUtils';
import type { Profile, Hashtag } from '../../src/types/database';

type SearchTab = 'users' | 'posts' | 'hashtags';

interface SearchResult extends Profile {
  is_following?: boolean;
}

interface PostResult {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('users');
  const [userResults, setUserResults] = useState<SearchResult[]>([]);
  const [postResults, setPostResults] = useState<PostResult[]>([]);
  const [hashtagResults, setHashtagResults] = useState<Hashtag[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecentSearches();
    loadSuggestions();
    loadFollowing();
    loadTrendingHashtags();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.recentSearches);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadFollowing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
      }
    } catch (error) {
      console.error('Error loading following:', error);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('posts_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    }
  };

  const searchUsers = async (searchQuery: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) throw error;
    setUserResults(data || []);
  };

  const searchPosts = async (searchQuery: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        created_at,
        user_id,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .ilike('content', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const results: PostResult[] = (data || []).map((post: any) => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      user_id: post.user_id,
      username: post.profiles.username,
      full_name: post.profiles.full_name,
      avatar_url: post.profiles.avatar_url,
    }));

    setPostResults(results);
  };

  const searchHashtags = async (searchQuery: string) => {
    const cleanQuery = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery;
    const { data, error } = await supabase
      .from('hashtags')
      .select('*')
      .ilike('name', `%${cleanQuery}%`)
      .order('posts_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    setHashtagResults(data || []);
  };

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      setPostResults([]);
      setHashtagResults([]);
      return;
    }

    setIsSearching(true);
    try {
      await Promise.all([
        searchUsers(searchQuery),
        searchPosts(searchQuery),
        searchHashtags(searchQuery),
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  const saveToRecent = async (profile: SearchResult) => {
    try {
      const updated = [profile, ...recentSearches.filter(p => p.id !== profile.id)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const removeFromRecent = async (profileId: string) => {
    try {
      const updated = recentSearches.filter(p => p.id !== profileId);
      setRecentSearches(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(STORAGE_KEYS.recentSearches);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (followingIds.has(userId)) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: userId });

        setFollowingIds(prev => new Set([...prev, userId]));
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleProfilePress = (profile: SearchResult) => {
    saveToRecent(profile);
    router.push(`/profile/${profile.id}`);
  };

  const handleHashtagPress = (hashtag: Hashtag) => {
    router.push(`/hashtag/${hashtag.name}`);
  };

  const renderUserItem = ({ item }: { item: SearchResult }) => {
    const isFollowing = followingIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleProfilePress(item)}
      >
        <Avatar uri={item.avatar_url} name={item.full_name} size="medium" />
        <View style={styles.userInfo}>
          <Text style={[styles.fullName, { color: colors.text }]}>
            {item.full_name}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{item.username}
          </Text>
        </View>
        <Button
          title={isFollowing ? 'Following' : 'Follow'}
          variant={isFollowing ? 'outline' : 'primary'}
          size="small"
          onPress={() => handleFollow(item.id)}
        />
      </TouchableOpacity>
    );
  };

  const renderPostItem = ({ item }: { item: PostResult }) => (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <View style={styles.postHeader}>
        <Avatar uri={item.avatar_url} name={item.full_name} size="small" />
        <View style={styles.postHeaderInfo}>
          <Text style={[styles.postUsername, { color: colors.text }]}>{item.username}</Text>
          <Text style={[styles.postTime, { color: colors.textTertiary }]}>
            {formatTimestamp(item.created_at)}
          </Text>
        </View>
      </View>
      {item.content && (
        <Text style={[styles.postContent, { color: colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>
      )}
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.postThumbnail}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );

  const renderHashtagItem = ({ item }: { item: Hashtag }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleHashtagPress(item)}
    >
      <View style={[styles.hashtagIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.hashtagIconText, { color: colors.text }]}>#</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.fullName, { color: colors.text }]}>
          #{item.name}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          {item.posts_count} {item.posts_count === 1 ? 'post' : 'posts'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleProfilePress(item)}
    >
      <Avatar uri={item.avatar_url} name={item.full_name} size="medium" />
      <View style={styles.userInfo}>
        <Text style={[styles.fullName, { color: colors.text }]}>
          {item.full_name}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{item.username}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFromRecent(item.id)}>
        <Ionicons name="close" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const tabs: { key: SearchTab; label: string; count: number }[] = [
    { key: 'users', label: 'Users', count: userResults.length },
    { key: 'posts', label: 'Posts', count: postResults.length },
    { key: 'hashtags', label: 'Hashtags', count: hashtagResults.length },
  ];

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'users':
        return (
          <FlatList
            data={userResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No users found
              </Text>
            }
          />
        );
      case 'posts':
        return (
          <FlatList
            data={postResults}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No posts found
              </Text>
            }
          />
        );
      case 'hashtags':
        return (
          <FlatList
            data={hashtagResults}
            renderItem={renderHashtagItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No hashtags found
              </Text>
            }
          />
        );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search users, posts, or #hashtags"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length > 0 ? (
        <View style={{ flex: 1 }}>
          {/* Search Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: activeTab === tab.key ? colors.text : colors.textTertiary },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tabBadgeText, { color: colors.textSecondary }]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {renderSearchResults()}
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Recent
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={[styles.seeAll, { color: colors.textSecondary }]}>
                        Clear all
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((item) => (
                    <View key={item.id}>{renderRecentItem({ item })}</View>
                  ))}
                </View>
              )}

              {trendingHashtags.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Trending Hashtags
                    </Text>
                  </View>
                  {trendingHashtags.map((item) => (
                    <View key={item.id}>{renderHashtagItem({ item })}</View>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Suggested for you
                  </Text>
                </View>
                {suggestions.map((item) => (
                  <View key={item.id}>{renderUserItem({ item })}</View>
                ))}
              </View>
            </>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: Spacing.base,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.sizes.base,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.base,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  tabBadge: {
    marginLeft: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  list: {
    paddingHorizontal: Spacing.base,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  seeAll: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  fullName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  username: {
    fontSize: Typography.sizes.sm,
  },
  hashtagIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagIconText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  postItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  postHeaderInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  postUsername: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  postTime: {
    fontSize: Typography.sizes.xs,
  },
  postContent: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * 1.4,
  },
  postThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    backgroundColor: '#E5E2DD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: Typography.sizes.base,
  },
});
