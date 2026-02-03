/**
 * Search Screen
 * Search for users and view suggestions
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
import type { Profile } from '../../src/types/database';

interface SearchResult extends Profile {
  is_following?: boolean;
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecentSearches();
    loadSuggestions();
    loadFollowing();
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

      // Get users not followed yet
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

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
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

  const handleFollow = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (followingIds.has(userId)) {
        // Unfollow
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
        // Follow
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
            placeholder="Search"
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
                    <TouchableOpacity onPress={() => setRecentSearches([])}>
                      <Text style={[styles.seeAll, { color: colors.textSecondary }]}>
                        See all
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((item) => (
                    <View key={item.id}>{renderRecentItem({ item })}</View>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Suggested for you
                  </Text>
                  <TouchableOpacity>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>
                      See all
                    </Text>
                  </TouchableOpacity>
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
