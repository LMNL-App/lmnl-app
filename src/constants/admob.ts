/**
 * AdMob configuration
 * Replace with your actual AdMob IDs in production
 */
import { Platform } from 'react-native';

// Test Ad Unit IDs (use these for development)
const TEST_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
  NATIVE: Platform.select({
    ios: 'ca-app-pub-3940256099942544/3986624511',
    android: 'ca-app-pub-3940256099942544/2247696110',
  }) as string,
};

// Production Ad Unit IDs (replace with your actual IDs)
const PRODUCTION_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-XXXXXXXX/YYYYYYYY', // Replace with your iOS banner ad unit ID
    android: 'ca-app-pub-XXXXXXXX/YYYYYYYY', // Replace with your Android banner ad unit ID
  }) as string,
  NATIVE: Platform.select({
    ios: 'ca-app-pub-XXXXXXXX/YYYYYYYY', // Replace with your iOS native ad unit ID
    android: 'ca-app-pub-XXXXXXXX/YYYYYYYY', // Replace with your Android native ad unit ID
  }) as string,
};

// Use test IDs in development, production IDs in production
const isDevelopment = __DEV__;

export const ADMOB_IDS = isDevelopment ? TEST_IDS : PRODUCTION_IDS;

/**
 * AdMob configuration options
 */
export const ADMOB_CONFIG = {
  // Request non-personalized ads for GDPR compliance by default
  requestNonPersonalizedAdsOnly: true,
  // Maximum content rating
  maxAdContentRating: 'G' as const,
  // Tag for child-directed treatment
  tagForChildDirectedTreatment: false,
  // Tag for users under age of consent
  tagForUnderAgeOfConsent: false,
};
