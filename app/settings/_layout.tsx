/**
 * Settings group layout
 */
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';

export default function SettingsLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="notifications-settings"
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="privacy"
        options={{ title: 'Privacy' }}
      />
      <Stack.Screen
        name="theme"
        options={{ title: 'Theme' }}
      />
      <Stack.Screen
        name="about"
        options={{ title: 'About LMNL' }}
      />
      <Stack.Screen
        name="delete-account"
        options={{ title: 'Delete Account' }}
      />
      <Stack.Screen
        name="change-password"
        options={{ title: 'Change Password' }}
      />
    </Stack>
  );
}
