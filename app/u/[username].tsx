/**
 * Username deep link handler
 * Redirects /u/:username to the profile screen
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useThemeStore } from '../../src/stores/themeStore';
import { Typography, Spacing } from '../../src/constants/theme';

export default function UsernameRedirectScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { colors } = useThemeStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const normalizedUsername = (username || '').trim().toLowerCase();
      if (!normalizedUsername) {
        setErrorMessage('Invalid profile link.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', normalizedUsername)
          .single();

        if (error || !data?.id) {
          setErrorMessage('Profile not found.');
          return;
        }

        router.replace(`/profile/${data.id}`);
      } catch (err) {
        console.error('Error resolving username link:', err);
        setErrorMessage('Unable to open profile.');
      }
    };

    loadProfile();
  }, [username, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Profile' }} />
      {errorMessage ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>
            {errorMessage}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Try opening the app and searching for the username.
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Opening profile…
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
