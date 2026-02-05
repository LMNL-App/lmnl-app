/**
 * Root layout for LMNL app
 * Handles app initialization, auth state, and navigation structure
 */
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { useThemeStore } from '../src/stores/themeStore';
import { useUsageStore } from '../src/stores/usageStore';
import { useToastStore } from '../src/stores/toastStore';
import { useOfflineStore } from '../src/stores/offlineStore';
import { ErrorBoundary, Toast, OfflineBanner } from '../src/components/common';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';

function InitialLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized, isLoading } = useAuthStore();
  const { colors } = useThemeStore();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup && !inOnboarding) {
      // Not signed in, redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Signed in, redirect to main app
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments]);

  if (!isInitialized || isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="post"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

function GlobalToast() {
  const { visible, message, type, duration, hide } = useToastStore();

  return (
    <Toast
      visible={visible}
      message={message}
      type={type}
      duration={duration}
      onDismiss={hide}
    />
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { initialize: initAuth } = useAuthStore();
  const { initialize: initTheme, colorScheme, colors } = useThemeStore();
  const { fetchUsage } = useUsageStore();

  useEffect(() => {
    async function init() {
      try {
        // Initialize theme first for immediate visual
        await initTheme();
        // Then initialize auth
        await initAuth();
        // Fetch usage if logged in
        const { session } = useAuthStore.getState();
        if (session) {
          await fetchUsage();
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: '#F7F5F2' }]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  const { isOnline } = useNetworkStatus();
  const { setOnline, loadQueue } = useOfflineStore();

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    setOnline(isOnline);
  }, [isOnline]);

  return (
    <ErrorBoundary>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner isOnline={isOnline} />
      <InitialLayout />
      <GlobalToast />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
