/**
 * Analytics Dashboard Screen
 * Displays usage statistics, trends, and activity insights
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { useUsageStore } from '../../src/stores/usageStore';
import { DAILY_LIMITS } from '../../src/constants/limits';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { format, parseISO, subDays } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 140;
const BAR_CHART_PADDING = Spacing.base * 2;

interface WeeklyData {
  date: string;
  posts_count: number;
  likes_count: number;
  comments_count: number;
  posts_viewed: number;
}

interface AnalyticsSummary {
  total_posts: number;
  total_likes_given: number;
  total_comments: number;
  total_posts_viewed: number;
  days_active: number;
  avg_posts_per_day: number;
  avg_likes_per_day: number;
  avg_comments_per_day: number;
  most_active_day: string | null;
  account_created_at: string;
}

type ChartMetric = 'posts_count' | 'likes_count' | 'comments_count' | 'posts_viewed';

export default function AnalyticsScreen() {
  const { colors } = useThemeStore();
  const { user, profile } = useAuthStore();
  const { usage } = useUsageStore();

  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('posts_count');

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [weeklyResult, summaryResult] = await Promise.all([
        supabase.rpc('get_weekly_usage', { p_user_id: user.id, p_days: 7 }),
        supabase.rpc('get_user_analytics_summary', { p_user_id: user.id }),
      ]);

      if (weeklyResult.data) {
        // Fill missing days with zeros
        const filledData = fillMissingDays(weeklyResult.data, 7);
        setWeeklyData(filledData);
      }

      if (summaryResult.data && summaryResult.data.length > 0) {
        setSummary(summaryResult.data[0]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const fillMissingDays = (data: WeeklyData[], days: number): WeeklyData[] => {
    const result: WeeklyData[] = [];
    const dataMap = new Map(data.map(d => [d.date, d]));

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      result.push(
        dataMap.get(date) || {
          date,
          posts_count: 0,
          likes_count: 0,
          comments_count: 0,
          posts_viewed: 0,
        }
      );
    }

    return result;
  };

  const getMetricColor = (metric: ChartMetric): string => {
    switch (metric) {
      case 'posts_count': return colors.info;
      case 'likes_count': return colors.like;
      case 'comments_count': return colors.success;
      case 'posts_viewed': return colors.warning;
    }
  };

  const getMetricLabel = (metric: ChartMetric): string => {
    switch (metric) {
      case 'posts_count': return 'Posts';
      case 'likes_count': return 'Likes';
      case 'comments_count': return 'Comments';
      case 'posts_viewed': return 'Feed Views';
    }
  };

  const getMetricMax = (metric: ChartMetric): number => {
    switch (metric) {
      case 'posts_count': return DAILY_LIMITS.POSTS_STANDARD;
      case 'likes_count': return DAILY_LIMITS.LIKES;
      case 'comments_count': return DAILY_LIMITS.COMMENTS;
      case 'posts_viewed': return DAILY_LIMITS.FEED_POSTS;
    }
  };

  const renderBarChart = () => {
    if (weeklyData.length === 0) return null;

    const maxValue = Math.max(
      getMetricMax(selectedMetric),
      ...weeklyData.map(d => d[selectedMetric])
    );
    const barWidth = (SCREEN_WIDTH - BAR_CHART_PADDING * 2 - Spacing.sm * 6) / 7;
    const metricColor = getMetricColor(selectedMetric);

    return (
      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Last 7 Days — {getMetricLabel(selectedMetric)}
        </Text>

        {/* Metric selector */}
        <View style={styles.metricSelector}>
          {(['posts_count', 'likes_count', 'comments_count', 'posts_viewed'] as ChartMetric[]).map((metric) => (
            <View
              key={metric}
              style={[
                styles.metricChip,
                {
                  backgroundColor: selectedMetric === metric
                    ? getMetricColor(metric) + '20'
                    : colors.backgroundSecondary,
                  borderColor: selectedMetric === metric
                    ? getMetricColor(metric)
                    : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.metricChipText,
                  {
                    color: selectedMetric === metric
                      ? getMetricColor(metric)
                      : colors.textSecondary,
                  },
                ]}
                onPress={() => setSelectedMetric(metric)}
              >
                {getMetricLabel(metric)}
              </Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={styles.barsContainer}>
          {weeklyData.map((day, index) => {
            const value = day[selectedMetric];
            const barHeight = maxValue > 0 ? (value / maxValue) * CHART_HEIGHT : 0;
            const dayLabel = format(parseISO(day.date), 'EEE').slice(0, 2);

            return (
              <View key={day.date} style={styles.barColumn}>
                <Text style={[styles.barValue, { color: metricColor }]}>
                  {value > 0 ? value : ''}
                </Text>
                <View style={[styles.barTrack, { backgroundColor: colors.backgroundSecondary }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: Math.max(barHeight, value > 0 ? 4 : 0),
                        backgroundColor: metricColor,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textTertiary }]}>
                  {dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTodayCard = () => {
    if (!usage) return null;

    const items = [
      {
        label: 'Posts',
        used: usage.posts_count,
        limit: DAILY_LIMITS.POSTS_STANDARD,
        color: colors.info,
        icon: 'create-outline' as const,
      },
      {
        label: 'Likes',
        used: usage.likes_count,
        limit: DAILY_LIMITS.LIKES,
        color: colors.like,
        icon: 'heart-outline' as const,
      },
      {
        label: 'Comments',
        used: usage.comments_count,
        limit: DAILY_LIMITS.COMMENTS,
        color: colors.success,
        icon: 'chatbubble-outline' as const,
      },
      {
        label: 'Feed Views',
        used: usage.posts_viewed,
        limit: DAILY_LIMITS.FEED_POSTS,
        color: colors.warning,
        icon: 'eye-outline' as const,
      },
    ];

    return (
      <View style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Usage</Text>
        {items.map((item) => {
          const progress = item.limit > 0 ? item.used / item.limit : 0;

          return (
            <View key={item.label} style={styles.usageRow}>
              <View style={styles.usageLabel}>
                <Ionicons name={item.icon} size={18} color={item.color} />
                <Text style={[styles.usageLabelText, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.usageRight}>
                <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(progress * 100, 100)}%`,
                        backgroundColor: progress >= 1 ? colors.error : item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.usageCount, { color: colors.textSecondary }]}>
                  {item.used}/{item.limit}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSummaryCard = () => {
    if (!summary) return null;

    const stats = [
      { label: 'Total Posts', value: summary.total_posts, icon: 'create-outline' as const },
      { label: 'Total Likes Given', value: summary.total_likes_given, icon: 'heart-outline' as const },
      { label: 'Total Comments', value: summary.total_comments, icon: 'chatbubble-outline' as const },
      { label: 'Posts Viewed', value: summary.total_posts_viewed, icon: 'eye-outline' as const },
      { label: 'Days Active', value: summary.days_active, icon: 'calendar-outline' as const },
    ];

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>All-Time Summary</Text>

        <View style={styles.summaryGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.summaryItem, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={stat.icon} size={20} color={colors.textSecondary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Averages */}
        <View style={[styles.averagesSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.averagesTitle, { color: colors.textSecondary }]}>
            Daily Averages
          </Text>
          <View style={styles.averagesRow}>
            <View style={styles.averageItem}>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {summary.avg_posts_per_day}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textTertiary }]}>
                posts
              </Text>
            </View>
            <View style={styles.averageItem}>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {summary.avg_likes_per_day}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textTertiary }]}>
                likes
              </Text>
            </View>
            <View style={styles.averageItem}>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {summary.avg_comments_per_day}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textTertiary }]}>
                comments
              </Text>
            </View>
          </View>

          {summary.most_active_day && (
            <Text style={[styles.mostActiveDay, { color: colors.textSecondary }]}>
              Most active on {summary.most_active_day.trim()}s
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderWellbeingCard = () => {
    if (!summary) return null;

    const avgTotal = summary.avg_posts_per_day + summary.avg_likes_per_day + summary.avg_comments_per_day;
    const maxTotal = DAILY_LIMITS.POSTS_STANDARD + DAILY_LIMITS.LIKES + DAILY_LIMITS.COMMENTS;
    const usagePercent = maxTotal > 0 ? Math.round((avgTotal / maxTotal) * 100) : 0;

    let wellbeingMessage: string;
    let wellbeingIcon: keyof typeof Ionicons.glyphMap;
    let wellbeingColor: string;

    if (usagePercent < 30) {
      wellbeingMessage = 'You\'re using LMNL mindfully. Keep up the intentional approach!';
      wellbeingIcon = 'leaf-outline';
      wellbeingColor = colors.success;
    } else if (usagePercent < 60) {
      wellbeingMessage = 'You\'re finding a good balance between engagement and mindfulness.';
      wellbeingIcon = 'sunny-outline';
      wellbeingColor = colors.warning;
    } else {
      wellbeingMessage = 'You\'re nearing your daily limits regularly. Consider if each interaction is meaningful.';
      wellbeingIcon = 'alert-circle-outline';
      wellbeingColor = colors.error;
    }

    return (
      <View style={[styles.wellbeingCard, { backgroundColor: wellbeingColor + '10', borderColor: wellbeingColor + '30' }]}>
        <View style={styles.wellbeingHeader}>
          <Ionicons name={wellbeingIcon} size={24} color={wellbeingColor} />
          <Text style={[styles.wellbeingTitle, { color: colors.text }]}>
            Wellbeing Check
          </Text>
        </View>
        <Text style={[styles.wellbeingText, { color: colors.textSecondary }]}>
          {wellbeingMessage}
        </Text>
        <Text style={[styles.wellbeingPercent, { color: wellbeingColor }]}>
          Average daily usage: {usagePercent}% of limits
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Analytics',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Analytics',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {renderTodayCard()}
        {renderBarChart()}
        {renderWellbeingCard()}
        {renderSummaryCard()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.base,
  },
  chartCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  chartTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  metricSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  metricChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  metricChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 44,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    height: 16,
    marginBottom: 4,
  },
  barTrack: {
    width: '60%',
    height: CHART_HEIGHT,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  barLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  todayCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  usageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  usageLabelText: {
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.sm,
  },
  usageRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageCount: {
    fontSize: Typography.sizes.xs,
    width: 36,
    textAlign: 'right',
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: (SCREEN_WIDTH - Spacing.base * 2 - Spacing.base * 2 - Spacing.sm * 2) / 3,
    flex: 1,
  },
  summaryValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  averagesSection: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
  },
  averagesTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  averagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  averageItem: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
  },
  averageLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  mostActiveDay: {
    textAlign: 'center',
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  wellbeingCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  wellbeingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  wellbeingTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  wellbeingText: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.6,
    marginBottom: Spacing.sm,
  },
  wellbeingPercent: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});
