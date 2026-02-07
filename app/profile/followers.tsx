/**
 * Followers List Screen
 * Displays users who follow a given user
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar, Button } from '../../src/components/ui';
import { Typography, Spacing } from '../../src/constants/theme';
import type { Profile } from '../../src/types/database';

interface FollowerItem extends Profile {
  is_following?: boolean;
}

export default function FollowersScreen() {
  const { userId, username } = useLocalSearchParams<{ userId: string; username: string }>();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user: currentUser } = useAuthStore();

  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchFollowers = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower:profiles!follows_follower_id_fkey(*)')
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profiles = (data || [])
        .map((row: any) => row.follower)
        .filter(Boolean);

      setFollowers(profiles);

      // Check which ones current user follows
      if (currentUser?.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);

        if (followData) {
          setFollowingIds(new Set(followData.map(f => f.following_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const handleFollow = async (targetId: string) => {
    if (!currentUser?.id) return;

    try {
      if (followingIds.has(targetId)) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetId);

        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: targetId });

        setFollowingIds(prev => new Set([...prev, targetId]));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const renderItem = ({ item }: { item: FollowerItem }) => {
    const isCurrentUser = item.id === currentUser?.id;
    const isFollowing = followingIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push(`/profile/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.full_name}'s profile`}
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
        {!isCurrentUser && (
          <Button
            title={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'outline' : 'primary'}
            size="small"
            onPress={() => handleFollow(item.id)}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: username ? `@${username}'s Followers` : 'Followers',
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
          data={followers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No followers yet
              </Text>
            </View>
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
  list: {
    paddingHorizontal: Spacing.base,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  fullName: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },
  username: {
    fontSize: Typography.sizes.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontSize: Typography.sizes.base,
  },
});
