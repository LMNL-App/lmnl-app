import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/stores/themeStore';

export default function MessagesLayout() {
  const { colors } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    />
  );
}
