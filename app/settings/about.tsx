/**
 * About LMNL Screen
 */
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../src/stores/themeStore';
import { APP_CONFIG } from '../../src/constants/config';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { DAILY_LIMITS } from '../../src/constants/limits';

export default function AboutScreen() {
  const { colors } = useThemeStore();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={[styles.logoCircles]}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
          <View style={[styles.circle, styles.circle4]} />
        </View>
        <Text style={[styles.logoText, { color: colors.text }]}>LMNL</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Quality over Quantity
        </Text>
      </View>

      {/* Philosophy Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Our Philosophy
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          LMNL (pronounced "liminal") is designed to create a space between mindless scrolling and meaningful connection. We believe that less is more when it comes to social media.
        </Text>
      </View>

      {/* Daily Limits Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Daily Limits
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          To encourage intentional engagement, we enforce daily limits:
        </Text>

        <View style={styles.limitsGrid}>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.primary }]}>
              {DAILY_LIMITS.POSTS_STANDARD}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Posts per day
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.primary }]}>
              {DAILY_LIMITS.LIKES}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Likes per day
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.primary }]}>
              {DAILY_LIMITS.COMMENTS}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Comments per day
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.primary }]}>
              {DAILY_LIMITS.FEED_POSTS}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Feed posts per day
            </Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Key Features
        </Text>

        <View style={styles.featureItem}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>
            Finite Feed
          </Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            No infinite scrolling. Your daily feed is limited to 10 posts, encouraging you to be present with each one.
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>
            Intentional Engagement
          </Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            With limited likes and comments, every interaction becomes more meaningful.
          </Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>
            Daily Reset
          </Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            Limits reset at midnight in your local timezone, giving you a fresh start each day.
          </Text>
        </View>
      </View>

      {/* Version */}
      <View style={styles.footer}>
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Version 1.0.0
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.webBaseUrl)}>
          <Text style={[styles.link, { color: colors.primary }]}>
            {APP_CONFIG.webBaseUrl.replace('https://', '')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  logoCircles: {
    width: 80,
    height: 80,
    position: 'relative',
    marginBottom: Spacing.base,
  },
  circle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  circle1: {
    backgroundColor: '#FF6B6B',
    top: 0,
    left: 0,
  },
  circle2: {
    backgroundColor: '#4ECDC4',
    top: 0,
    right: 0,
  },
  circle3: {
    backgroundColor: '#45B7D1',
    bottom: 0,
    left: 0,
  },
  circle4: {
    backgroundColor: '#96CEB4',
    bottom: 0,
    right: 0,
  },
  logoText: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: Typography.sizes.base,
    marginTop: Spacing.xs,
  },
  section: {
    margin: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  limitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  limitItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  limitValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  limitLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  featureItem: {
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  featureText: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  version: {
    fontSize: Typography.sizes.sm,
  },
  link: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.sm,
  },
});
