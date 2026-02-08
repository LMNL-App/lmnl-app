/**
 * Privacy Settings Screen
 * Manage account visibility, blocked accounts, and data controls
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Avatar } from '../../src/components/ui';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import type { Profile } from '../../src/types/database';

type PrivacyTab = 'settings' | 'blocked' | 'muted';

interface BlockedMutedUser {
  id: string;
  profile: Profile;
}

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { profile, updateProfile, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<PrivacyTab>('settings');
  const [isPrivate, setIsPrivate] = useState(profile?.is_private ?? false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedMutedUser[]>([]);
  const [mutedUsers, setMutedUsers] = useState<BlockedMutedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_user_id, profile:profiles!blocked_users_blocked_user_id_fkey(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlockedUsers(
        (data || []).map((row: any) => ({
          id: row.id,
          profile: row.profile,
        }))
      );
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchMutedUsers = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('muted_users')
        .select('id, muted_user_id, profile:profiles!muted_users_muted_user_id_fkey(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMutedUsers(
        (data || []).map((row: any) => ({
          id: row.id,
          profile: row.profile,
        }))
      );
    } catch (error) {
      console.error('Error fetching muted users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'blocked') fetchBlockedUsers();
    if (activeTab === 'muted') fetchMutedUsers();
  }, [activeTab]);

  const handlePrivateToggle = async (value: boolean) => {
    setIsPrivate(value);
    try {
      await updateProfile({ is_private: value } as any);
    } catch (error) {
      setIsPrivate(!value);
      console.error('Error updating privacy:', error);
    }
  };

  const handleUnblock = async (blockedId: string, name: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await supabase
                .from('blocked_users')
                .delete()
                .eq('id', blockedId);

              setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
            } catch (error) {
              console.error('Error unblocking user:', error);
            }
          },
        },
      ]
    );
  };

  const handleUnmute = async (mutedId: string, name: string) => {
    Alert.alert(
      'Unmute User',
      `Are you sure you want to unmute ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmute',
          onPress: async () => {
            try {
              await supabase
                .from('muted_users')
                .delete()
                .eq('id', mutedId);

              setMutedUsers(prev => prev.filter(u => u.id !== mutedId));
            } catch (error) {
              console.error('Error unmuting user:', error);
            }
          },
        },
      ]
    );
  };

  const renderSettings = () => (
    <View>
      {/* Account Privacy */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account Privacy
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Private Account
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Only approved followers can see your posts
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={handlePrivateToggle}
              trackColor={{ false: colors.border, true: colors.text }}
              thumbColor="#FDFCFB"
            />
          </View>
        </View>
      </View>

      {/* Manage */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Manage
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.navItem, { borderBottomColor: colors.border }]}
            onPress={() => setActiveTab('blocked')}
          >
            <Ionicons name="ban-outline" size={22} color={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>
              Blocked Accounts
            </Text>
            <View style={styles.navRight}>
              <Text style={[styles.navCount, { color: colors.textTertiary }]}>
                {blockedUsers.length > 0 ? blockedUsers.length : ''}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderBottomColor: colors.border }]}
            onPress={() => setActiveTab('muted')}
          >
            <Ionicons name="volume-mute-outline" size={22} color={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>
              Muted Accounts
            </Text>
            <View style={styles.navRight}>
              <Text style={[styles.navCount, { color: colors.textTertiary }]}>
                {mutedUsers.length > 0 ? mutedUsers.length : ''}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Your Data
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.navItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/settings/data-export')}
          >
            <Ionicons name="download-outline" size={22} color={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>
              Download Your Data
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/settings/delete-account')}
          >
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <Text style={[styles.navLabel, { color: colors.error }]}>
              Delete Account
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          LMNL is designed with your privacy in mind. We don't sell your data to advertisers and only collect what's necessary to provide our service.
        </Text>
      </View>
    </View>
  );

  const renderUserList = (
    items: BlockedMutedUser[],
    type: 'blocked' | 'muted',
    onRemove: (id: string, name: string) => void
  ) => (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.userList}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name={type === 'blocked' ? 'ban-outline' : 'volume-mute-outline'}
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No {type} accounts
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.userItem}>
          <Avatar uri={item.profile.avatar_url} name={item.profile.full_name} size="medium" />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.profile.full_name}
            </Text>
            <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
              @{item.profile.username}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.removeButton, { borderColor: colors.border }]}
            onPress={() => onRemove(item.id, item.profile.full_name)}
          >
            <Text style={[styles.removeText, { color: colors.text }]}>
              {type === 'blocked' ? 'Unblock' : 'Unmute'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {activeTab !== 'settings' && (
        <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setActiveTab('settings')}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subHeaderTitle, { color: colors.text }]}>
            {activeTab === 'blocked' ? 'Blocked Accounts' : 'Muted Accounts'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'settings' ? (
        renderSettings()
      ) : activeTab === 'blocked' ? (
        renderUserList(blockedUsers, 'blocked', handleUnblock)
      ) : (
        renderUserList(mutedUsers, 'muted', handleUnmute)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  subHeaderTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
  },
  navLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
    flex: 1,
    marginLeft: Spacing.md,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navCount: {
    fontSize: Typography.sizes.sm,
    marginRight: Spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    margin: Spacing.base,
    marginTop: Spacing.xl,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.75,
  },
  userList: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
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
  userName: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },
  userUsername: {
    fontSize: Typography.sizes.sm,
  },
  removeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  removeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    marginTop: Spacing.md,
  },
});
