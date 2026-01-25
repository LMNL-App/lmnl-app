/**
 * Post detail screens layout
 */
import { Stack } from 'expo-router';
import { useThemeStore } from '../../../src/stores/themeStore';

export default function PostLayout() {
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
    />
  );
}
