/**
 * AdMob Banner component
 * Displays a Google AdMob banner ad
 * Falls back gracefully if AdMob is not available
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { ADMOB_IDS } from '../../constants/admob';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

// Dynamic import for react-native-google-mobile-ads
// This allows the app to work even if AdMob is not installed (e.g., in Expo Go)
let BannerAd: any = null;
let BannerAdSize: any = null;
let AdEventType: any = null;

try {
  const googleAds = require('react-native-google-mobile-ads');
  BannerAd = googleAds.BannerAd;
  BannerAdSize = googleAds.BannerAdSize;
  AdEventType = googleAds.AdEventType;
} catch (e) {
  // react-native-google-mobile-ads not available (e.g., in Expo Go)
  console.log('AdMob not available:', e);
}

interface AdMobBannerProps {
  onAdLoaded?: () => void;
  onAdFailed?: (error: Error) => void;
}

export function AdMobBanner({ onAdLoaded, onAdFailed }: AdMobBannerProps) {
  const { colors } = useThemeStore();
  const [adError, setAdError] = useState<string | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  // If AdMob is not available, show a placeholder
  if (!BannerAd) {
    return (
      <View style={[styles.container, { backgroundColor: colors.sponsoredBackground }]}>
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
            Advertisement
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.sponsoredBackground }]}>
      {/* Sponsored Label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.sponsored }]}>sponsored</Text>
      </View>

      {/* AdMob Banner */}
      <View style={styles.adContainer}>
        <BannerAd
          unitId={ADMOB_IDS.BANNER}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setIsAdLoaded(true);
            setAdError(null);
            onAdLoaded?.();
          }}
          onAdFailedToLoad={(error: Error) => {
            setAdError(error.message);
            onAdFailed?.(error);
          }}
        />
      </View>

      {/* Error state */}
      {adError && !isAdLoaded && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textTertiary }]}>
            Ad failed to load
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  labelContainer: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    padding: Spacing.sm,
  },
  placeholder: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: Typography.sizes.sm,
  },
  errorContainer: {
    padding: Spacing.base,
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.sizes.xs,
  },
});
