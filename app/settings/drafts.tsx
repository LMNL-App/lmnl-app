/**
 * Drafts Screen
 * View and manage saved post drafts
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { formatTimestamp } from '../../src/utils/dateUtils';
import type { Draft } from '../../src/types/database';

export default function DraftsScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDrafts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDelete = (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('drafts').delete().eq('id', draftId);
              setDrafts(prev => prev.filter(d => d.id !== draftId));
            } catch (error) {
              console.error('Error deleting draft:', error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Draft }) => (
    <TouchableOpacity
      style={[styles.draftItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        router.push({
          pathname: '/(tabs)/create',
          params: {
            draftId: item.id,
            draftContent: item.content || '',
            draftImageUrl: item.image_url || '',
          },
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Draft: ${item.content?.slice(0, 50) || 'Image draft'}`}
    >
      <View style={styles.draftContent}>
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.thumbnail}
          />
        )}
        <View style={styles.draftText}>
          <Text
            style={[styles.draftBody, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.content || 'Image-only draft'}
          </Text>
          <Text style={[styles.draftTime, { color: colors.textTertiary }]}>
            {formatTimestamp(item.updated_at)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Delete draft"
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Drafts',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No drafts
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Your saved drafts will appear here
              </Text>
            </View>
          }
        />
      )}
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
  list: {
    padding: Spacing.base,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  draftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: '#E5E2DD',
  },
  draftText: {
    flex: 1,
  },
  draftBody: {
    fontSize: Typography.sizes.base,
  },
  draftTime: {
    fontSize: Typography.sizes.xs,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
});
