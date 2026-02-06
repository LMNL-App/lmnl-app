/**
 * Notifications Screen
 * Shows likes, comments, and follows
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar } from '../../src/components/ui';
import { formatNotificationTime } from '../../src/utils/dateUtils';
import { Typography, Spacing } from '../../src/constants/theme';
import { useNotificationSubscription } from '../../src/hooks/useRealtimeSubscription';
import type { NotificationWithActor, Profile } from '../../src/types/database';

interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  post_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor: Profile;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);

      // Mark as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Subscribe to real-time notifications
  useNotificationSubscription(() => {
    fetchNotifications();
  });

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: colors.like };
      case 'comment':
        return { name: 'chatbubble', color: colors.info };
      case 'follow':
        return { name: 'person-add', color: colors.success };
      case 'mention':
        return { name: 'at', color: colors.info };
      default:
        return { name: 'notifications', color: colors.textSecondary };
    }
  };

  const getNotificationText = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return notification.content
          ? `commented: "${notification.content.slice(0, 50)}${notification.content.length > 50 ? '...' : ''}"`
          : 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'mention':
        return 'mentioned you in a post';
      default:
        return '';
    }
  };

  const handlePress = (notification: NotificationItem) => {
    if (notification.post_id) {
      // Navigate to post
      router.push(`/post/${notification.post_id}`);
    } else {
      // Navigate to profile
      router.push(`/profile/${notification.actor_id}`);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getNotificationIcon(item.type);
    const text = getNotificationText(item);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { borderBottomColor: colors.border },
          !item.is_read && { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.iconContainer}>
          <Avatar
            uri={item.actor.avatar_url}
            name={item.actor.full_name}
            size="medium"
          />
          <View style={[styles.typeIcon, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <Ionicons
              name={icon.name as any}
              size={14}
              color={icon.color}
            />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.text, { color: colors.text }]}>
            <Text style={styles.username}>{item.actor.username}</Text>
            {' '}{text}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatNotificationTime(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        When someone likes or comments on your posts, or follows you, you'll see it here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  typeIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  username: {
    fontWeight: Typography.weights.semibold,
  },
  time: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
  },
});
