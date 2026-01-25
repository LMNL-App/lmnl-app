/**
 * Avatar component for user profile images
 */
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { Typography, BorderRadius } from '../../constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

const SIZES = {
  small: 32,
  medium: 44,
  large: 64,
  xlarge: 100,
};

const FONT_SIZES = {
  small: Typography.sizes.sm,
  medium: Typography.sizes.base,
  large: Typography.sizes.xl,
  xlarge: Typography.sizes['3xl'],
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ uri, name, size = 'medium', style }: AvatarProps) {
  const { colors } = useThemeStore();
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: getColorFromName(name),
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: '#FFFFFF' }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E0E0E0',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: Typography.weights.semibold,
  },
});
