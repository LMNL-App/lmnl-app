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
        <Text style={[styles.logoText, { color: colors.text }]}>lmnl</Text>
        <Text style={[styles.tagline, { color: colors.textTertiary }]}>
          quality over quantity
        </Text>
      </View>

      {/* Philosophy Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            <Text style={[styles.limitValue, { color: colors.text }]}>
              {DAILY_LIMITS.POSTS_STANDARD}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Posts per day
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.text }]}>
              {DAILY_LIMITS.LIKES}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Likes per day
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.text }]}>
              {DAILY_LIMITS.COMMENTS}
            </Text>
            <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>
              Comments per day
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Text style={[styles.limitValue, { color: colors.text }]}>
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
          <Text style={[styles.link, { color: colors.text }]}>
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
  logoText: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    margin: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
