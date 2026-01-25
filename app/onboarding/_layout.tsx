/**
 * Onboarding group layout
 */
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';

export default function OnboardingLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
