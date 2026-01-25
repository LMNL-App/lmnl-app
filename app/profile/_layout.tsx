/**
 * Profile Stack Layout
 */
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';

export default function ProfileLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
