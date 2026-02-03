/**
 * Notification Settings Screen
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingRow({ label, description, value, onValueChange }: SettingRowProps) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.text }}
        thumbColor="#FDFCFB"
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { colors } = useThemeStore();
  const { profile, updateProfile } = useAuthStore();

  const [pushEnabled, setPushEnabled] = useState(profile?.notifications_enabled ?? true);
  const [likesEnabled, setLikesEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [followsEnabled, setFollowsEnabled] = useState(true);

  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    await updateProfile({ notifications_enabled: value });
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
            onValueChange={setLikesEnabled}
          />
          <SettingRow
            label="Comments"
            description="When someone comments on your post"
            value={commentsEnabled}
            onValueChange={setCommentsEnabled}
          />
          <SettingRow
            label="New Followers"
            description="When someone follows you"
            value={followsEnabled}
            onValueChange={setFollowsEnabled}
          />
        </View>
      </View>

      {/* Note */}
      <Text style={[styles.note, { color: colors.textTertiary }]}>
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
    fontWeight: Typography.weights.medium,
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
    fontWeight: Typography.weights.medium,
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
  },
});
