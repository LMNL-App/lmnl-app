/**
 * Data Export Screen
 * Allows users to request and download their personal data
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui';
import { useToastStore } from '../../src/stores/toastStore';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { format } from 'date-fns';

type ExportSection = 'profile' | 'posts' | 'interactions' | 'usage' | 'follows' | 'notifications';

interface ExportItem {
  key: ExportSection;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const EXPORT_ITEMS: ExportItem[] = [
  {
    key: 'profile',
    label: 'Profile Data',
    description: 'Your name, username, bio, and account settings',
    icon: 'person-outline',
  },
  {
    key: 'posts',
    label: 'Posts',
    description: 'All posts you\'ve created with content and timestamps',
    icon: 'create-outline',
  },
  {
    key: 'interactions',
    label: 'Likes & Comments',
    description: 'Your likes and comments on posts',
    icon: 'heart-outline',
  },
  {
    key: 'usage',
    label: 'Usage History',
    description: 'Daily activity and usage statistics',
    icon: 'bar-chart-outline',
  },
  {
    key: 'follows',
    label: 'Connections',
    description: 'Your followers and accounts you follow',
    icon: 'people-outline',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Your notification history',
    icon: 'notifications-outline',
  },
];

export default function DataExportScreen() {
  const { colors } = useThemeStore();
  const { user, profile } = useAuthStore();
  const toast = useToastStore();

  const [selectedSections, setSelectedSections] = useState<Set<ExportSection>>(
    new Set(['profile', 'posts', 'interactions', 'usage', 'follows', 'notifications'])
  );
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (section: ExportSection) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSections(new Set(EXPORT_ITEMS.map(i => i.key)));
  };

  const deselectAll = () => {
    setSelectedSections(new Set());
  };

  const fetchExportData = async (): Promise<Record<string, any>> => {
    if (!user?.id) throw new Error('Not authenticated');

    const data: Record<string, any> = {
      export_date: new Date().toISOString(),
      user_id: user.id,
    };

    if (selectedSections.has('profile')) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      data.profile = profileData;
    }

    if (selectedSections.has('posts')) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, image_url, is_sponsored, is_edited, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      data.posts = posts || [];
    }

    if (selectedSections.has('interactions')) {
      const { data: interactions } = await supabase
        .from('interactions')
        .select('id, post_id, type, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      data.interactions = interactions || [];
    }

    if (selectedSections.has('usage')) {
      const { data: usage } = await supabase
        .from('daily_usage')
        .select('date, posts_count, likes_count, comments_count, posts_viewed')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      data.usage_history = usage || [];
    }

    if (selectedSections.has('follows')) {
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id, created_at, profiles!follows_follower_id_fkey(username, full_name)')
          .eq('following_id', user.id),
        supabase
          .from('follows')
          .select('following_id, created_at, profiles!follows_following_id_fkey(username, full_name)')
          .eq('follower_id', user.id),
      ]);
      data.followers = followersResult.data || [];
      data.following = followingResult.data || [];
    }

    if (selectedSections.has('notifications')) {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, type, content, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      data.notifications = notifications || [];
    }

    return data;
  };

  const handleExport = async () => {
    if (selectedSections.size === 0) {
      Alert.alert('Select Data', 'Please select at least one data category to export.');
      return;
    }

    setIsExporting(true);

    try {
      const exportData = await fetchExportData();

      const jsonString = JSON.stringify(exportData, null, 2);
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
      const fileName = `lmnl-data-export-${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Try to share the file using expo-sharing if available, otherwise use RN Share
      try {
        const Sharing = await import('expo-sharing');
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Export Your LMNL Data',
          });
          toast.success('Data exported successfully');
          return;
        }
      } catch {
        // expo-sharing not available, fallback below
      }

      // Fallback: share the JSON content as text
      await Share.share({
        message: jsonString,
        title: 'LMNL Data Export',
      });
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Export Data',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Export your data in JSON format. You can select which categories to include in the export. Your data will be saved as a file you can share or store.
          </Text>
        </View>

        {/* Selection controls */}
        <View style={styles.selectionControls}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Data to Export
          </Text>
          <View style={styles.selectionActions}>
            <Text
              style={[styles.selectAction, { color: colors.info }]}
              onPress={selectAll}
            >
              Select All
            </Text>
            <Text style={[styles.selectDivider, { color: colors.textTertiary }]}>|</Text>
            <Text
              style={[styles.selectAction, { color: colors.info }]}
              onPress={deselectAll}
            >
              Deselect All
            </Text>
          </View>
        </View>

        {/* Export items */}
        {EXPORT_ITEMS.map((item) => {
          const isSelected = selectedSections.has(item.key);

          return (
            <View
              key={item.key}
              style={[
                styles.exportItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.info + '40' : colors.border,
                },
              ]}
            >
              <View
                style={styles.exportItemContent}
                accessible
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={item.label}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected ? colors.info : 'transparent',
                      borderColor: isSelected ? colors.info : colors.textTertiary,
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={styles.exportItemText}>
                  <Text
                    style={[styles.exportItemLabel, { color: colors.text }]}
                    onPress={() => toggleSection(item.key)}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.exportItemDesc, { color: colors.textTertiary }]}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name={item.icon} size={20} color={colors.textTertiary} />
              </View>
            </View>
          );
        })}

        {/* Export button */}
        <Button
          title={isExporting ? 'Preparing Export...' : 'Export Data'}
          onPress={handleExport}
          loading={isExporting}
          disabled={selectedSections.size === 0 || isExporting}
          fullWidth
          style={styles.exportButton}
        />

        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          Exported data is in JSON format and contains only your personal information. Images are referenced by URL and not included in the export file.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  infoBox: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAction: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
  },
  selectDivider: {
    marginHorizontal: Spacing.sm,
    fontSize: Typography.sizes.sm,
  },
  exportItem: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  exportItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  exportItemText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  exportItemLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },
  exportItemDesc: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  exportButton: {
    marginTop: Spacing.lg,
  },
  disclaimer: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: Typography.sizes.xs * 1.6,
    paddingBottom: Spacing.xl,
  },
});
