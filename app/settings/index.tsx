/**
 * Settings Screen
 * Main settings hub
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Avatar } from '../../src/components/ui';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

function SettingItem({ icon, label, onPress, showArrow = true, danger = false }: SettingItemProps) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? colors.error : colors.text}
        />
        <Text
          style={[
            styles.settingLabel,
            { color: danger ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView>
        {/* Profile Section */}
        <TouchableOpacity
          style={[styles.profileSection, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/settings/edit-profile')}
        >
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.full_name}
            size="large"
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile?.full_name}
            </Text>
            <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
              @{profile?.username}
            </Text>
            <Text style={[styles.editProfile, { color: colors.textSecondary }]}>
              Edit profile
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Quick Settings
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View style={styles.quickSettings}>
              <TouchableOpacity
                style={styles.quickSettingItem}
                onPress={() => router.push('/settings/notifications-settings')}
              >
                <View style={[styles.quickSettingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
                </View>
                <Text style={[styles.quickSettingLabel, { color: colors.text }]}>
                  Notifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSettingItem}
                onPress={() => router.push('/settings/privacy')}
              >
                <View style={[styles.quickSettingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
                </View>
                <Text style={[styles.quickSettingLabel, { color: colors.text }]}>
                  Privacy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSettingItem}
                onPress={() => router.push('/settings/theme')}
              >
                <View style={[styles.quickSettingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="moon-outline" size={24} color={colors.text} />
                </View>
                <Text style={[styles.quickSettingLabel, { color: colors.text }]}>
                  Theme
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.push('/settings/edit-profile')}
            />
            <SettingItem
              icon="key-outline"
              label="Change Password"
              onPress={() => router.push('/settings/change-password')}
            />
            <SettingItem
              icon="analytics-outline"
              label="Analytics"
              onPress={() => router.push('/settings/analytics')}
            />
            <SettingItem
              icon="download-outline"
              label="Export Data"
              onPress={() => router.push('/settings/data-export')}
            />
            <SettingItem
              icon="language-outline"
              label="Language"
              onPress={() => {}}
            />
            <SettingItem
              icon="trash-outline"
              label="Delete Account"
              onPress={() => router.push('/settings/delete-account')}
              danger
            />
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Support & About
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => Linking.openURL('https://lmnlapp.com')}
            />
            <SettingItem
              icon="information-circle-outline"
              label="About LMNL"
              onPress={() => router.push('/settings/about')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="log-out-outline"
              label="Log out"
              onPress={handleSignOut}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          LMNL v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    margin: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  profileInfo: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  profileUsername: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  editProfile: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickSettings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.base,
  },
  quickSettingItem: {
    alignItems: 'center',
  },
  quickSettingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickSettingLabel: {
    fontSize: Typography.sizes.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    marginLeft: Spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.sizes.sm,
    marginVertical: Spacing.xl,
  },
});
