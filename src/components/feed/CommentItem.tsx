/**
 * CommentItem component
 * Displays a single comment with author info
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { Avatar } from '../ui';
import { formatTimestamp } from '../../utils/dateUtils';
import { Typography, Spacing } from '../../constants/theme';
import type { Comment } from '../../types/database';

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const router = useRouter();
  const { colors } = useThemeStore();

  const handleProfilePress = () => {
    router.push(`/profile/${comment.user_id}`);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={handleProfilePress}>
        <Avatar
          uri={comment.user.avatar_url}
          name={comment.user.full_name}
          size="small"
        />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfilePress}>
            <Text style={[styles.username, { color: colors.text }]}>
              @{comment.user.username}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {formatTimestamp(comment.created_at)}
          </Text>
        </View>

        <Text style={[styles.content, { color: colors.text }]}>
          {comment.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contentContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  timestamp: {
    fontSize: Typography.sizes.xs,
    marginLeft: Spacing.sm,
  },
  content: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
  },
});
