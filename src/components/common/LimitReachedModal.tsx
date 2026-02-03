/**
 * LimitReachedModal component
 * Displays a friendly modal when users reach their daily limits
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { getTimeUntilReset } from '../../utils/dateUtils';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export type LimitType = 'posts' | 'likes' | 'comments' | 'feed';

interface LimitReachedModalProps {
  visible: boolean;
  limitType: LimitType;
  onClose: () => void;
}

const LIMIT_CONFIG: Record<LimitType, {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  encouragement: string;
}> = {
  posts: {
    icon: 'create-outline',
    title: 'Post Limit Reached',
    message: "You've shared 5 posts today.",
    encouragement: 'Quality over quantity! Come back tomorrow to share more.',
  },
  likes: {
    icon: 'heart-outline',
    title: 'Like Limit Reached',
    message: "You've used all 5 likes for today.",
    encouragement: 'Make each like count! Your favorites await tomorrow.',
  },
  comments: {
    icon: 'chatbubble-outline',
    title: 'Comment Limit Reached',
    message: "You've made 5 comments today.",
    encouragement: 'Thoughtful conversations take time. Continue tomorrow!',
  },
  feed: {
    icon: 'newspaper-outline',
    title: 'Feed Limit Reached',
    message: "You've viewed today's 10 posts.",
    encouragement: 'Take a break and enjoy the moment. Fresh content awaits tomorrow!',
  },
};

export function LimitReachedModal({
  visible,
  limitType,
  onClose,
}: LimitReachedModalProps) {
  const { colors } = useThemeStore();
  const config = LIMIT_CONFIG[limitType];
  const timeUntilReset = getTimeUntilReset();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: colors.surface }]}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons
                  name={config.icon}
                  size={32}
                  color={colors.text}
                />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                {config.title}
              </Text>

              {/* Message */}
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {config.message}
              </Text>

              {/* Encouragement */}
              <Text style={[styles.encouragement, { color: colors.textTertiary }]}>
                {config.encouragement}
              </Text>

              {/* Time until reset */}
              <View style={[styles.resetContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                  Limits reset in {timeUntilReset}
                </Text>
              </View>

              {/* Close button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.text }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  encouragement: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  resetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  resetText: {
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.sm,
  },
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
});
