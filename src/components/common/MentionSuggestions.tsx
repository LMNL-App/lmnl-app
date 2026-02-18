import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../ui';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import type { Profile } from '../../types/database';

interface MentionSuggestionsProps {
  query: string;
  visible: boolean;
  onSelect: (username: string) => void;
}

export function MentionSuggestions({ query, visible, onSelect }: MentionSuggestionsProps) {
  const { colors } = useThemeStore();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);

  useEffect(() => {
    if (!visible || !query) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching mention suggestions:', error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [query, visible]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelect(item.username)}
          >
            <Avatar uri={item.avatar_url} name={item.full_name} size="small" />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>@{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  info: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  name: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  username: {
    fontSize: Typography.sizes.xs,
  },
});
