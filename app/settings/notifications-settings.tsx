/**
 * Notification Settings Screen
 * Granular notification preferences persisted to profile
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useToastStore } from '../../src/stores/toastStore';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingRow({ label, description, value, onValueChange, disabled }: SettingRowProps) {
  const { colors } = useThemeStore();

  return (
    <View
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={`${label}: ${description}`}
    >
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: disabled ? colors.textTertiary : colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.text }}
        thumbColor="#FDFCFB"
        disabled={disabled}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { colors } = useThemeStore();
  const { profile, updateProfile } = useAuthStore();
  const toast = useToastStore();

  const [pushEnabled, setPushEnabled] = useState(profile?.notifications_enabled ?? true);
  const [likesEnabled, setLikesEnabled] = useState(profile?.notify_likes ?? true);
  const [commentsEnabled, setCommentsEnabled] = useState(profile?.notify_comments ?? true);
  const [followsEnabled, setFollowsEnabled] = useState(profile?.notify_follows ?? true);
  const [mentionsEnabled, setMentionsEnabled] = useState(profile?.notify_mentions ?? true);

  const handleUpdate = async (field: string, value: boolean) => {
    try {
      await updateProfile({ [field]: value } as any);
    } catch (error) {
      toast.error('Failed to update notification setting');
      console.error('Error updating notification setting:', error);
    }
  };

  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    await handleUpdate('notifications_enabled', value);
  };

  const handleLikesToggle = async (value: boolean) => {
    setLikesEnabled(value);
    await handleUpdate('notify_likes', value);
  };

  const handleCommentsToggle = async (value: boolean) => {
    setCommentsEnabled(value);
    await handleUpdate('notify_comments', value);
  };

  const handleFollowsToggle = async (value: boolean) => {
    setFollowsEnabled(value);
    await handleUpdate('notify_follows', value);
  };

  const handleMentionsToggle = async (value: boolean) => {
    setMentionsEnabled(value);
    await handleUpdate('notify_mentions', value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Push Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Push Notifications
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <SettingRow
            label="Enable Push Notifications"
            description="Receive notifications on your device"
            value={pushEnabled}
            onValueChange={handlePushToggle}
          />
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Notification Types
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <SettingRow
            label="Likes"
            description="When someone likes your post"
            value={likesEnabled}
            onValueChange={handleLikesToggle}
            disabled={!pushEnabled}
          />
          <SettingRow
            label="Comments"
            description="When someone comments on your post"
            value={commentsEnabled}
            onValueChange={handleCommentsToggle}
            disabled={!pushEnabled}
          />
          <SettingRow
            label="New Followers"
            description="When someone follows you"
            value={followsEnabled}
            onValueChange={handleFollowsToggle}
            disabled={!pushEnabled}
          />
          <SettingRow
            label="Mentions"
            description="When someone mentions you in a post"
            value={mentionsEnabled}
            onValueChange={handleMentionsToggle}
            disabled={!pushEnabled}
          />
        </View>
      </View>

      {/* Note */}
      <Text style={[styles.note, { color: colors.textTertiary }]}>
        Individual notification types are only available when push notifications are enabled.
        You can also manage notification permissions in your device settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  note: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    lineHeight: Typography.sizes.sm * 1.6,
  },
});
