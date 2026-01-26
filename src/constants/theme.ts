/**
 * Theme configuration for LMNL app
 * Supports light and dark mode with system preference detection
 */

export const Colors = {
  light: {
    // Primary colors
    primary: '#007AFF',
    primaryLight: '#4DA3FF',
    primaryDark: '#0056B3',

    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#EBEBEB',

    // Surface colors
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F8F8',

    // Text colors
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#FFFFFF',

    // Border colors
    border: '#E0E0E0',
    borderLight: '#F0F0F0',

    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5856D6',

    // Interactive colors
    like: '#FF3B30',
    likeInactive: '#999999',

    // Sponsored/Ad indicator
    sponsored: '#FF9500',
    sponsoredBackground: '#FFF8E6',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E0E0E0',
    tabBarActive: '#007AFF',
    tabBarInactive: '#999999',

    // Card
    card: '#FFFFFF',
    cardBorder: '#F0F0F0',

    // Input
    input: '#F5F5F5',
    inputBorder: '#E0E0E0',
    inputFocus: '#007AFF',
    placeholder: '#999999',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Skeleton loading
    skeleton: '#E0E0E0',
    skeletonHighlight: '#F5F5F5',
  },

  dark: {
    // Primary colors
    primary: '#0A84FF',
    primaryLight: '#4DA3FF',
    primaryDark: '#0056B3',

    // Background colors
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',

    // Surface colors
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#8E8E93',
    textInverse: '#000000',

    // Border colors
    border: '#38383A',
    borderLight: '#2C2C2E',

    // Status colors
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#5E5CE6',

    // Interactive colors
    like: '#FF453A',
    likeInactive: '#8E8E93',

    // Sponsored/Ad indicator
    sponsored: '#FF9F0A',
    sponsoredBackground: '#3D3000',

    // Tab bar
    tabBar: '#1C1C1E',
    tabBarBorder: '#38383A',
    tabBarActive: '#0A84FF',
    tabBarInactive: '#8E8E93',

    // Card
    card: '#1C1C1E',
    cardBorder: '#38383A',

    // Input
    input: '#2C2C2E',
    inputBorder: '#38383A',
    inputFocus: '#0A84FF',
    placeholder: '#8E8E93',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Skeleton loading
    skeleton: '#2C2C2E',
    skeletonHighlight: '#3C3C3E',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ColorScheme = 'light' | 'dark';

// Typography - Swiss Style (Modular Scale 1.125 - Major Second or similar)
// Focusing on cleanliness and readability
export const Typography = {
  // Font sizes
  sizes: {
    xs: 11,   // Captions
    sm: 13,   // Secondary text
    md: 15,   // Body text (slightly lowered for density)
    base: 16, // Standard
    lg: 20,   // Subtitles
    xl: 24,   // Titles
    '2xl': 32, // Headlines
    '3xl': 48, // Display
    '4xl': 64, // Hero
  },

  // Font weights - Swiss design often uses distinct weights like Regular and Bold, less in-between
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const, // Use for emphasis instead of bold sometimes
    bold: '700' as const,
  },

  // Line heights - Tighter for headlines, breathable for body
  lineHeights: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

// Spacing - Strict grid system (Base 4px)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,  // Increased from 12 for more whitespace
  base: 24, // Increased standard separation
  lg: 32,
  xl: 48,
  '2xl': 64,
  '3xl': 96,
  '4xl': 128,
} as const;

// Border radius - Minimal or None (Swiss Style favors geometric shapes)
export const BorderRadius = {
  none: 0,
  sm: 2,   // Very subtle
  md: 4,   // Minimal
  lg: 6,   // Slightly softened
  xl: 8,
  '2xl': 12,
  full: 9999,
} as const;

// Shadows - Flat design, minimal depth
export const Shadows = {
  sm: {
    shadowColor: 'transparent', // Flattened
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // Very subtle
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
