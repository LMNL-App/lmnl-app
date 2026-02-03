/**
 * Theme configuration for LMNL app
 * Supports light and dark mode with system preference detection
 */

export const Colors = {
  light: {
    // Primary colors — restrained ink black
    primary: '#1A1A1A',
    primaryLight: '#4A4A4A',
    primaryDark: '#000000',

    // Background colors — warm off-whites
    background: '#F7F5F2',
    backgroundSecondary: '#EFECEA',
    backgroundTertiary: '#E5E2DD',

    // Surface colors
    surface: '#FDFCFB',
    surfaceSecondary: '#F2F0ED',

    // Text colors — warm charcoals
    text: '#1A1A1A',
    textSecondary: '#6B6560',
    textTertiary: '#9E9892',
    textInverse: '#FDFCFB',

    // Border colors — warm grays
    border: '#DDD9D3',
    borderLight: '#EFECEA',

    // Status colors — muted, earthy
    success: '#2E7D5E',
    warning: '#C47B2B',
    error: '#B5433E',
    info: '#4A6FA5',

    // Interactive colors
    like: '#B5433E',
    likeInactive: '#9E9892',

    // Sponsored/Ad indicator
    sponsored: '#C47B2B',
    sponsoredBackground: '#FAF7F2',

    // Tab bar
    tabBar: '#FDFCFB',
    tabBarBorder: '#DDD9D3',
    tabBarActive: '#1A1A1A',
    tabBarInactive: '#9E9892',

    // Card
    card: '#FDFCFB',
    cardBorder: '#EFECEA',

    // Input
    input: '#FDFCFB',
    inputBorder: '#DDD9D3',
    inputFocus: '#1A1A1A',
    placeholder: '#9E9892',

    // Overlay
    overlay: 'rgba(26, 26, 26, 0.45)',

    // Skeleton loading
    skeleton: '#E5E2DD',
    skeletonHighlight: '#EFECEA',
  },

  dark: {
    // Primary colors — soft white
    primary: '#E8E4DF',
    primaryLight: '#C9C3BC',
    primaryDark: '#FDFCFB',

    // Background colors — warm dark
    background: '#1C1A17',
    backgroundSecondary: '#252219',
    backgroundTertiary: '#2E2B26',

    // Surface colors
    surface: '#222019',
    surfaceSecondary: '#2A2720',

    // Text colors
    text: '#E8E4DF',
    textSecondary: '#B3ADA6',
    textTertiary: '#756F67',
    textInverse: '#1C1A17',

    // Border colors
    border: '#3A362F',
    borderLight: '#2E2B26',

    // Status colors
    success: '#4CAF82',
    warning: '#D4944A',
    error: '#D45A53',
    info: '#6B9FD4',

    // Interactive colors
    like: '#D45A53',
    likeInactive: '#756F67',

    // Sponsored/Ad indicator
    sponsored: '#D4944A',
    sponsoredBackground: '#2A2520',

    // Tab bar
    tabBar: '#222019',
    tabBarBorder: '#3A362F',
    tabBarActive: '#E8E4DF',
    tabBarInactive: '#756F67',

    // Card
    card: '#222019',
    cardBorder: '#3A362F',

    // Input
    input: '#2A2720',
    inputBorder: '#3A362F',
    inputFocus: '#E8E4DF',
    placeholder: '#756F67',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.6)',

    // Skeleton loading
    skeleton: '#2E2B26',
    skeletonHighlight: '#3A362F',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ColorScheme = 'light' | 'dark';

// Typography
export const Typography = {
  // Font sizes
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// Border radius — slightly tighter for editorial feel
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 10,
  xl: 14,
  '2xl': 18,
  full: 9999,
} as const;

// Shadows — very subtle, warm-tinted
export const Shadows = {
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
