/**
 * Search Screen
 * Search for users and hashtags
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
import type { Profile, Hashtag } from '../../src/types/database';

interface SearchResult extends Profile {
  is_following?: boolean;
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hashtagResults, setHashtagResults] = useState<Hashtag[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const isHashtagSearch = query.startsWith('#');

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

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHashtagResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (searchQuery.startsWith('#')) {
        const hashtagQuery = searchQuery.slice(1).toLowerCase();
        if (!hashtagQuery) {
          setHashtagResults([]);
          setIsSearching(false);
          return;
        }
        const { data, error } = await supabase
          .from('hashtags')
          .select('*')
          .ilike('name', `%${hashtagQuery}%`)
          .order('posts_count', { ascending: false })
          .limit(20);

        if (error) throw error;
        setHashtagResults(data || []);
        setResults([]);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        setResults(data || []);
        setHashtagResults([]);
      }
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
            placeholder="Search users or #hashtags"
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

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : query.length > 0 ? (
        isHashtagSearch ? (
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
        ) : (
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No users found
              </Text>
            }
          />
        )
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
