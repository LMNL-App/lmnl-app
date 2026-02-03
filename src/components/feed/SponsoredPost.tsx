/**
 * Sponsored Post component
 * Displays a clearly marked sponsored/ad post
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import type { SponsoredPost as SponsoredPostType } from '../../types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SponsoredPostProps {
  post: SponsoredPostType;
}

export function SponsoredPost({ post }: SponsoredPostProps) {
  const { colors } = useThemeStore();

  const handlePress = async () => {
    if (post.sponsor_link) {
      // Track click
      await supabase.rpc('increment_ad_click', { ad_id: post.id });

      // Open link
      Linking.openURL(post.sponsor_link);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.sponsoredBackground, borderColor: colors.border }]}>
      {/* Sponsored Label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.sponsored }]}>sponsored</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
        {post.content && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {post.content}
          </Text>
        )}
      </View>

      {/* Image */}
      <Image
        source={{ uri: post.image_url }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.sponsorInfo}>
          <Text style={[styles.sponsorName, { color: colors.textTertiary }]}>
            Ad by {post.sponsor_name}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.text }]}
          onPress={handlePress}
        >
          <Text style={[styles.ctaText, { color: colors.textInverse }]}>{post.cta_text}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
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
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E2DD',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorName: {
    fontSize: Typography.sizes.xs,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ctaText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginRight: Spacing.xs,
  },
});
