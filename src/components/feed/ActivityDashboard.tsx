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

export function ActivityDashboard() {
  const { colors } = useThemeStore();
  const { postsRemaining, likesRemaining, commentsRemaining } = useUsageStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Today's activity</Text>

      <View style={styles.statsRow}>
        <StatItem
          value={postsRemaining}
          label="Posts left"
          color={postsRemaining > 0 ? colors.primary : colors.error}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatItem
          value={commentsRemaining}
          label="Comments left"
          color={commentsRemaining > 0 ? colors.primary : colors.error}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <StatItem
          value={likesRemaining}
          label="Likes left"
          color={likesRemaining > 0 ? colors.primary : colors.error}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    marginBottom: Spacing.md,
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
  },
  divider: {
    width: 1,
    height: 40,
  },
});
