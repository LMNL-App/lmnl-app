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
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';
import { useFeedStore } from '../../stores/feedStore';
import { useUsageStore } from '../../stores/usageStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { deletePostImage } from '../../lib/storage';
import { Avatar } from '../ui';
import { LimitReachedModal, type LimitType } from '../common';
import { formatTimestamp } from '../../utils/dateUtils';
import { isLimitError } from '../../constants/limits';
import { APP_CONFIG } from '../../constants/config';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import type { FeedPost } from '../../types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostCardProps {
  post: FeedPost;
  onCommentPress?: () => void;
  onDeleted?: (postId: string) => void;
  onEdited?: (postId: string, newContent: string) => void;
}

export const PostCard = React.memo(function PostCard({ post, onCommentPress, onDeleted, onEdited }: PostCardProps) {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { likePost, unlikePost, savePost, unsavePost, removePost, updatePostContent } = useFeedStore();
  const { canLike, incrementLikes, decrementLikes, fetchUsage } = useUsageStore();
  const { user } = useAuthStore();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalType, setLimitModalType] = useState<LimitType>('likes');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [isEditing, setIsEditing] = useState(false);

  const isOwnPost = user?.id === post.user_id;

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

  const handlePostMenu = () => {
    Alert.alert(
      undefined as any,
      undefined as any,
      [
        {
          text: 'Edit Post',
          onPress: () => {
            setEditContent(post.content || '');
            setEditModalVisible(true);
          },
        },
        {
          text: 'Delete Post',
          style: 'destructive',
          onPress: () => handleDelete(),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (post.image_url) {
                await deletePostImage(post.image_url).catch(() => {});
              }

              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

              if (error) throw error;

              removePost(post.id);
              onDeleted?.(post.id);
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() && !post.image_url) return;
    setIsEditing(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editContent.trim() || null,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;

      updatePostContent(post.id, editContent.trim() || null);
      onEdited?.(post.id, editContent.trim());
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error editing post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.header} onPress={handleProfilePress}>
          <Avatar uri={post.avatar_url} name={post.full_name} size="medium" />
          <View style={styles.headerInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {post.username}
            </Text>
            <View style={styles.timestampRow}>
              <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                {formatTimestamp(post.created_at)}
              </Text>
              {(post as any).is_edited && (
                <Text style={[styles.editedLabel, { color: colors.textTertiary }]}>
                  {' \u00b7 edited'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {isOwnPost && (
          <TouchableOpacity
            onPress={handlePostMenu}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

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
          accessibilityRole="button"
          accessibilityLabel={post.is_liked ? `Unlike post, ${post.likes_count} likes` : `Like post, ${post.likes_count} likes`}
          accessibilityState={{ selected: post.is_liked }}
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

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCommentPress}
          accessibilityRole="button"
          accessibilityLabel={`View comments, ${post.comments_count} comments`}
        >
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
          accessibilityRole="button"
          accessibilityLabel={post.is_saved ? 'Unsave post' : 'Save post'}
          accessibilityState={{ selected: post.is_saved }}
        >
          <Ionicons
            name={post.is_saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={post.is_saved ? colors.text : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Edit Post Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.editModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.editModalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={[styles.editModalCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.editModalTitle, { color: colors.text }]}>Edit Post</Text>
            <TouchableOpacity onPress={handleEditSubmit} disabled={isEditing}>
              {isEditing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.editModalSave, { color: colors.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.editModalInput, { color: colors.text }]}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            maxLength={APP_CONFIG.maxChars.post}
            autoFocus
            placeholderTextColor={colors.placeholder}
            placeholder="Write something..."
          />
          <Text style={[styles.editModalCharCount, { color: colors.textTertiary }]}>
            {editContent.length}/{APP_CONFIG.maxChars.post}
          </Text>
        </View>
      </Modal>

      {/* Limit Reached Modal */}
      <LimitReachedModal
        visible={limitModalVisible}
        limitType={limitModalType}
        onClose={() => setLimitModalVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editedLabel: {
    fontSize: Typography.sizes.xs,
  },
  editModalContainer: {
    flex: 1,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  editModalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  editModalCancel: {
    fontSize: Typography.sizes.base,
  },
  editModalSave: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  editModalInput: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.relaxed,
    padding: Spacing.base,
    textAlignVertical: 'top',
  },
  editModalCharCount: {
    textAlign: 'right',
    fontSize: Typography.sizes.sm,
    padding: Spacing.base,
  },
});
