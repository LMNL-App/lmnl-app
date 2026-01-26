/**
 * App configuration constants
 */

export const APP_CONFIG = {
  /** App name */
  name: 'LMNL',

  /** App description */
  description: 'Quality over Quantity',

  /** App version */
  version: '1.0.0',

  /** Public website base URL */
  webBaseUrl: 'https://lmnlapp.com',

  /** Maximum image upload size in bytes (5MB) */
  maxImageSize: 5 * 1024 * 1024,

  /** Image compression quality (0-1) */
  imageQuality: 0.8,

  /** Maximum image dimensions */
  maxImageDimensions: {
    width: 1080,
    height: 1350,
  },

  /** Maximum character counts */
  maxChars: {
    bio: 150,
    post: 500,
    comment: 200,
    username: 30,
    fullName: 50,
  },

  /** Minimum character counts */
  minChars: {
    username: 3,
    password: 8,
  },

  /** Pagination */
  pagination: {
    defaultPageSize: 20,
    notificationsPageSize: 30,
    searchPageSize: 20,
  },

  /** Cache durations in milliseconds */
  cacheDuration: {
    profile: 5 * 60 * 1000, // 5 minutes
    feed: 1 * 60 * 1000, // 1 minute
    notifications: 30 * 1000, // 30 seconds
  },

  /** Animation durations in milliseconds */
  animationDuration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  posts: 'posts',
} as const;

/**
 * AsyncStorage keys
 */
export const STORAGE_KEYS = {
  theme: '@lmnl/theme',
  recentSearches: '@lmnl/recent_searches',
  onboardingComplete: '@lmnl/onboarding_complete',
  pushToken: '@lmnl/push_token',
} as const;
