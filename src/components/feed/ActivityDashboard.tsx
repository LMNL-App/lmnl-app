/**
 * Activity Dashboard component
 * Displays remaining daily interactions
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { useUsageStore } from '../../stores/usageStore';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

interface StatItemProps {
  value: number;
  label: string;
  color: string;
}

function StatItem({ value, label, color }: StatItemProps) {
  const { colors } = useThemeStore();

  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

export const ActivityDashboard = React.memo(function ActivityDashboard() {
  const { colors } = useThemeStore();
  const { postsRemaining, likesRemaining, commentsRemaining } = useUsageStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>today</Text>

      <View style={styles.statsRow}>
        <StatItem
          value={postsRemaining}
          label="posts"
          color={postsRemaining > 0 ? colors.text : colors.error}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatItem
          value={commentsRemaining}
          label="comments"
          color={commentsRemaining > 0 ? colors.text : colors.error}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatItem
          value={likesRemaining}
          label="likes"
          color={likesRemaining > 0 ? colors.text : colors.error}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 40,
  },
});
