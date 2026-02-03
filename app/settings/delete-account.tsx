/**
 * Delete Account Screen
 * Allows users to permanently delete their account
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useFeedStore } from '../../src/stores/feedStore';
import { Button } from '../../src/components/ui';
import { deleteAccount } from '../../src/lib/auth';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { profile, signOut } = useAuthStore();
  const { clearFeed } = useFeedStore();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText.toLowerCase() === 'delete my account';

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAccount();
      clearFeed();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to delete account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Warning Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
          <Ionicons name="warning" size={48} color={colors.error} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.error }]}>
          Delete Your Account
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          We're sorry to see you go. Before you delete your account, please note:
        </Text>

        {/* Consequences List */}
        <View style={[styles.consequencesList, { backgroundColor: colors.surface }]}>
          <ConsequenceItem
            icon="images-outline"
            text="All your posts will be permanently deleted"
            colors={colors}
          />
          <ConsequenceItem
            icon="heart-outline"
            text="All your likes and comments will be removed"
            colors={colors}
          />
          <ConsequenceItem
            icon="people-outline"
            text="Your followers and following list will be cleared"
            colors={colors}
          />
          <ConsequenceItem
            icon="person-outline"
            text="Your profile and username will become available again"
            colors={colors}
          />
          <ConsequenceItem
            icon="time-outline"
            text="This action cannot be undone"
            colors={colors}
            isLast
          />
        </View>

        {/* Confirmation Input */}
        <View style={styles.confirmSection}>
          <Text style={[styles.confirmLabel, { color: colors.text }]}>
            To confirm, type "delete my account" below:
          </Text>
          <TextInput
            style={[
              styles.confirmInput,
              {
                backgroundColor: colors.input,
                color: colors.text,
                borderColor: confirmText && !canDelete ? colors.error : colors.inputBorder,
              },
            ]}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="delete my account"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Delete Button */}
        <Button
          title={isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
          onPress={handleDelete}
          disabled={!canDelete || isDeleting}
          loading={isDeleting}
          fullWidth
          style={[
            styles.deleteButton,
            { backgroundColor: canDelete ? colors.error : colors.backgroundSecondary },
          ]}
          textStyle={{ color: canDelete ? '#FDFCFB' : colors.textTertiary }}
        />

        {/* Cancel Link */}
        <Text
          style={[styles.cancelText, { color: colors.textSecondary }]}
          onPress={() => router.back()}
        >
          Cancel and keep my account
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ConsequenceItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: any;
  isLast?: boolean;
}

function ConsequenceItem({ icon, text, colors, isLast }: ConsequenceItemProps) {
  return (
    <View
      style={[
        styles.consequenceItem,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.error} style={styles.consequenceIcon} />
      <Text style={[styles.consequenceText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
  },
  consequencesList: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  consequenceIcon: {
    marginRight: Spacing.md,
  },
  consequenceText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
  },
  confirmSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  confirmLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  confirmInput: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.sizes.base,
  },
  deleteButton: {
    marginBottom: Spacing.lg,
  },
  cancelText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
});
