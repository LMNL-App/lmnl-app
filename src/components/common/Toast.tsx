/**
 * Toast notification component
 * Displays temporary messages at the top of the screen
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/themeStore';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: colors.surface,
          borderLeftColor: getTypeColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons
        name={TOAST_ICONS[type]}
        size={20}
        color={getTypeColor()}
      />
      <Text
        style={[styles.message, { color: colors.text }]}
        numberOfLines={2}
      >
        {message}
      </Text>
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  message: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.4,
  },
});
