/**
 * Privacy Settings Screen
 */
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}

function SettingItem({ icon, label, description, onPress }: SettingItemProps) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={colors.text} style={styles.icon} />
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function PrivacyScreen() {
  const { colors } = useThemeStore();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'Please contact support@lmnlapp.com to delete your account.'
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account Privacy
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="eye-outline"
            label="Profile Visibility"
            description="Your profile is visible to everyone"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
          />
          <SettingItem
            icon="people-outline"
            label="Blocked Accounts"
            description="Manage accounts you've blocked"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
          />
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Your Data
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          <SettingItem
            icon="download-outline"
            label="Download Your Data"
            description="Get a copy of your LMNL data"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}
          />
          <SettingItem
            icon="trash-outline"
            label="Delete Account"
            description="Permanently delete your account"
            onPress={handleDeleteAccount}
          />
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
  },
  icon: {
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  settingDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
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
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
});
