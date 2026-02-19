import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { useMessageStore } from '../../src/stores/messageStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar } from '../../src/components/ui';
import { formatNotificationTime } from '../../src/utils/dateUtils';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import type { ConversationWithParticipant, Profile } from '../../src/types/database';

export default function ConversationsScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { conversations, isLoading, fetchConversations, getOrCreateConversation } = useMessageStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  }, []);

  const handleConversationPress = (conversation: ConversationWithParticipant) => {
    router.push(`/messages/${conversation.id}?name=${encodeURIComponent(conversation.participant.full_name)}&avatar=${encodeURIComponent(conversation.participant.avatar_url || '')}`);
  };

  const handleNewMessage = async (userId: string) => {
    const conversationId = await getOrCreateConversation(userId);
    if (conversationId) {
      setShowNewMessage(false);
      setSearchQuery('');
      setSearchResults([]);
      const profile = searchResults.find(p => p.id === userId);
      router.push(`/messages/${conversationId}?name=${encodeURIComponent(profile?.full_name || '')}&avatar=${encodeURIComponent(profile?.avatar_url || '')}`);
    }
  };

  const handleSearchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showNewMessage) {
        handleSearchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showNewMessage]);

  const renderConversation = ({ item }: { item: ConversationWithParticipant }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
      onPress={() => handleConversationPress(item)}
    >
      <Avatar
        uri={item.participant.avatar_url}
        name={item.participant.full_name}
        size="medium"
      />
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text
            style={[
              styles.conversationName,
              { color: colors.text },
              item.unread_count > 0 && styles.unreadName,
            ]}
            numberOfLines={1}
          >
            {item.participant.full_name}
          </Text>
          {item.last_message_at && (
            <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
              {formatNotificationTime(item.last_message_at)}
            </Text>
          )}
        </View>
        <View style={styles.conversationPreview}>
          <Text
            style={[
              styles.lastMessage,
              { color: item.unread_count > 0 ? colors.text : colors.textSecondary },
              item.unread_count > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {item.last_message || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.unreadCount, { color: colors.textInverse }]}>
                {item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (showNewMessage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'New Message',
            headerBackTitle: 'Back',
            headerLeft: () => (
              <TouchableOpacity onPress={() => { setShowNewMessage(false); setSearchQuery(''); setSearchResults([]); }}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            ),
          }}
        />

        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for a user..."
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInputText, { color: colors.text }]}
              autoFocus
              autoCapitalize="none"
            />
          </View>
        </View>

        {isSearching ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.userItem, { borderBottomColor: colors.border }]}
                onPress={() => handleNewMessage(item.id)}
              >
                <Avatar uri={item.avatar_url} name={item.full_name} size="medium" />
                <View style={styles.userInfo}>
                  <Text style={[styles.conversationName, { color: colors.text }]}>
                    {item.full_name}
                  </Text>
                  <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
                    @{item.username}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              searchQuery.length > 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No users found
                </Text>
              ) : null
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Messages',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowNewMessage(true)}>
              <Ionicons name="create-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                Start a conversation with someone!
              </Text>
              <TouchableOpacity
                style={[styles.newMessageButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowNewMessage(true)}
              >
                <Text style={[styles.newMessageButtonText, { color: colors.textInverse }]}>
                  New Message
                </Text>
              </TouchableOpacity>
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
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  unreadName: {
    fontWeight: Typography.weights.bold,
  },
  conversationTime: {
    fontSize: Typography.sizes.xs,
    marginLeft: Spacing.sm,
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: Typography.weights.semibold,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: Typography.sizes.base,
  },
  newMessageButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  newMessageButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
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
  searchInputText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.sizes.base,
  },
  cancelText: {
    fontSize: Typography.sizes.base,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
