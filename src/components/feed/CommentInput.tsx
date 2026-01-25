/**
 * CommentInput component
 * Input field for adding comments with limit awareness
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { useUsageStore } from '../../stores/usageStore';
import { LimitReachedModal } from '../common';
import { isLimitError } from '../../constants/limits';
import { APP_CONFIG } from '../../constants/config';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

interface CommentInputProps {
  postId: string;
  onCommentSubmit: (content: string) => Promise<void>;
  onCommentAdded?: () => void;
}

export function CommentInput({
  postId,
  onCommentSubmit,
  onCommentAdded,
}: CommentInputProps) {
  const { colors } = useThemeStore();
  const { canComment, incrementComments, commentsRemaining, fetchUsage } = useUsageStore();

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const maxLength = APP_CONFIG.maxChars.comment;
  const canSubmit = text.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Check limit before submitting
    if (!canComment()) {
      setLimitModalVisible(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await onCommentSubmit(text.trim());
      incrementComments();
      setText('');
      onCommentAdded?.();
    } catch (error: any) {
      if (isLimitError(error.message)) {
        setLimitModalVisible(true);
        fetchUsage(); // Refresh from server
      } else {
        console.error('Error submitting comment:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Remaining comments indicator */}
        <View style={styles.limitIndicator}>
          <Text style={[
            styles.limitText,
            { color: commentsRemaining > 0 ? colors.textTertiary : colors.error }
          ]}>
            {commentsRemaining} comments left today
          </Text>
        </View>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.placeholder}
            value={text}
            onChangeText={setText}
            maxLength={maxLength}
            multiline
            editable={!isSubmitting && commentsRemaining > 0}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: canSubmit ? colors.primary : colors.backgroundSecondary,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={canSubmit ? colors.textInverse : colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Character count */}
        {text.length > 0 && (
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {text.length}/{maxLength}
          </Text>
        )}
      </View>

      {/* Limit Modal */}
      <LimitReachedModal
        visible={limitModalVisible}
        limitType="comments"
        onClose={() => setLimitModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  limitIndicator: {
    marginBottom: Spacing.sm,
  },
  limitText: {
    fontSize: Typography.sizes.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: Typography.sizes.base,
    marginRight: Spacing.sm,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: Typography.sizes.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
});
