/**
 * Forgot Password Screen
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { Button, Input } from '../../src/components/ui';
import { resetPassword } from '../../src/lib/auth';
import { validateEmail } from '../../src/utils/validation';
import { Typography, Spacing } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="mail-outline" size={48} color={colors.success} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Check your email
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            We've sent password reset instructions to{'\n'}
            <Text style={{ fontWeight: Typography.weights.semibold }}>{email}</Text>
          </Text>

          <Button
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            style={styles.button}
          />

          <Button
            title="Didn't receive email? Try again"
            onPress={() => setIsSent(false)}
            variant="ghost"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Forgot password?
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={error}
              leftIcon="mail-outline"
            />

            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={isLoading}
              fullWidth
              style={styles.button}
            />

            <Button
              title="Back to Login"
              onPress={() => router.back()}
              variant="ghost"
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
    marginBottom: Spacing.xl,
  },
  form: {
    marginTop: Spacing.md,
  },
  button: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
