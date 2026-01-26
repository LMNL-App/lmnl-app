/**
 * Card component for content containers
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevated?: boolean;
}

export function Card({
  children,
  style,
  padding = 'medium',
  elevated = false,
}: CardProps) {
  const { colors, colorScheme } = useThemeStore();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return Spacing.sm;
      case 'large':
        return Spacing.lg;
      default:
        return Spacing.base;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          padding: getPadding(),
        },
        elevated && colorScheme === 'light' && Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm, // Geometric
    borderWidth: 1,
  },
});
