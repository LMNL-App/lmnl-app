/**
 * Post Card component
 * Displays a single post in the feed
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { useFeedStore } from '../../stores/feedStore';
import { useUsageStore } from '../../stores/usageStore';
import { Avatar } from '../ui';
import { LimitReachedModal, type LimitType } from '../common';
import { formatTimestamp } from '../../utils/dateUtils';
import { isLimitError } from '../../constants/limits';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import type { FeedPost } from '../../types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostCardProps {
  post: FeedPost;
  onCommentPress?: () => void;
}

export function PostCard({ post, onCommentPress }: PostCardProps) {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { likePost, unlikePost, savePost, unsavePost } = useFeedStore();
  const { canLike, incrementLikes, decrementLikes, fetchUsage } = useUsageStore();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalType, setLimitModalType] = useState<LimitType>('likes');

  const showLimitModal = (type: LimitType) => {
    setLimitModalType(type);
    setLimitModalVisible(true);
  };

  const handleLike = async () => {
    if (isLiking) return;

    if (post.is_liked) {
      // Unlike
      setIsLiking(true);
      try {
        await unlikePost(post.id);
        decrementLikes();
      } catch (error) {
        console.error('Error unliking post:', error);
      } finally {
        setIsLiking(false);
      }
    } else {
      // Like - check limit first
      if (!canLike()) {
        showLimitModal('likes');
        return;
      }

      setIsLiking(true);
      try {
        await likePost(post.id);
        incrementLikes();
      } catch (error: any) {
        if (isLimitError(error.message)) {
          showLimitModal('likes');
          fetchUsage(); // Refresh usage from server
        } else {
          console.error('Error liking post:', error);
        }
      } finally {
        setIsLiking(false);
      }
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (post.is_saved) {
        await unsavePost(post.id);
      } else {
        await savePost(post.id);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePress = () => {
    router.push(`/profile/${post.user_id}`);
  };

  const handleCommentPress = () => {
    if (onCommentPress) {
      onCommentPress();
    } else {
      router.push(`/post/${post.id}/comments`);
    }
  };

  const handlePostPress = () => {
    router.push(`/post/${post.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={handleProfilePress}>
        <Avatar uri={post.avatar_url} name={post.full_name} size="medium" />
        <View style={styles.headerInfo}>
          <Text style={[styles.username, { color: colors.text }]}>
            {post.username}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {formatTimestamp(post.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Content - Tappable to open post */}
      <TouchableOpacity onPress={handlePostPress} activeOpacity={0.9}>
        {post.content && (
          <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>
        )}

        {/* Image */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={isLiking}
        >
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.is_liked ? colors.like : colors.likeInactive}
          />
          {post.likes_count > 0 && (
            <Text
              style={[
                styles.actionCount,
                { color: post.is_liked ? colors.like : colors.textSecondary },
              ]}
            >
              {post.likes_count}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={colors.textSecondary}
          />
          {post.comments_count > 0 && (
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {post.comments_count}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons
            name={post.is_saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={post.is_saved ? colors.text : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Limit Reached Modal */}
      <LimitReachedModal
        visible={limitModalVisible}
        limitType={limitModalType}
        onClose={() => setLimitModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  headerInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  username: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  timestamp: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  content: {
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#E5E2DD',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  actionCount: {
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.xs,
    fontWeight: Typography.weights.medium,
  },
});
