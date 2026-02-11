/**
 * Verification Request Screen
 * Users can request account verification
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui';
import { useToastStore } from '../../src/stores/toastStore';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export default function VerificationScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { profile, user } = useAuthStore();
  const toast = useToastStore();

  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<RequestStatus>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStatus(data.status as RequestStatus);
      }
    } catch {
      // No existing request
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user?.id,
          reason: reason.trim(),
        });

      if (error) throw error;

      setStatus('pending');
      toast.success('Verification request submitted');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You already have a pending request');
      } else {
        toast.error('Failed to submit request');
      }
      console.error('Error submitting verification request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Verification', headerBackTitle: 'Back', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (profile?.is_verified) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Verification', headerBackTitle: 'Back', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.statusContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            Account Verified
          </Text>
          <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
            Your account has been verified. Thank you!
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Verification', headerBackTitle: 'Back', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.statusContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="time" size={48} color={colors.warning} />
          </View>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            Request Pending
          </Text>
          <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
            Your verification request is being reviewed. We'll notify you when a decision is made.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: 'Request Verification', headerBackTitle: 'Back', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Verified accounts get a badge on their profile. Verification is typically for public figures, creators, and educational institutions.
          </Text>
        </View>

        {status === 'rejected' && (
          <View style={[styles.rejectedBox, { backgroundColor: colors.error + '15' }]}>
            <Text style={[styles.rejectedText, { color: colors.error }]}>
              Your previous request was not approved. You may submit a new one.
            </Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>
          Why should your account be verified?
        </Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text }]}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe why you're requesting verification..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={6}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.textTertiary }]}>
          {reason.length}/500
        </Text>

        <Button
          title="Submit Request"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!reason.trim() || isSubmitting}
          fullWidth
          style={styles.submitButton}
        />
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
  rejectedBox: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  rejectedText: {
    fontSize: Typography.sizes.sm,
  },
  label: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    minHeight: 150,
  },
  charCount: {
    textAlign: 'right',
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  statusMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.6,
  },
});
