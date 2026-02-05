/**
 * Offline Banner component
 * Shows a banner when the device is offline
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/themeStore';
import { Typography, Spacing } from '../../constants/theme';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const height = useRef(new Animated.Value(0)).current;
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      Animated.timing(height, {
        toValue: 36,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (wasOffline.current) {
      // Show "back online" briefly then hide
      setTimeout(() => {
        Animated.timing(height, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          wasOffline.current = false;
        });
      }, 2000);
    }
  }, [isOnline]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height,
          backgroundColor: isOnline ? colors.success : colors.error,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isOnline ? 'wifi' : 'cloud-offline-outline'}
          size={14}
          color="#FDFCFB"
        />
        <Text style={styles.text}>
          {isOnline ? 'Back online' : 'No internet connection'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#FDFCFB',
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});
