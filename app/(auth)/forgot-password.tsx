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
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { Button, Input } from '../../src/components/ui';
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  updatePassword,
  signOut,
} from '../../src/lib/auth';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../../src/utils/validation';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

type ResetStep = 'request' | 'verify' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendCode = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setErrors({});
    setIsSending(true);

    try {
      await sendPasswordResetCode(email);
      setStep('verify');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      await sendPasswordResetCode(email);
      Alert.alert('Code Sent', 'A new code has been sent to your email.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Unable to resend the code. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyAndReset = async () => {
    const nextErrors: Record<string, string> = {};

    if (!code) {
      nextErrors.code = 'Code is required';
    } else if (code.length < 6) {
      nextErrors.code = 'Enter the 6-digit code';
    }

    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;

    const confirmError = validatePasswordConfirm(password, confirmPassword);
    if (confirmError) nextErrors.confirmPassword = confirmError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsVerifying(true);

    try {
      await verifyPasswordResetCode(email, code);
      await updatePassword(password);
      try {
        await signOut();
      } catch {
        // Ignore sign out errors after a successful reset
      }
      setStep('success');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Unable to reset your password. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(sanitized);
  };

  const handleChangeEmail = () => {
    setStep('request');
    setErrors({});
    setCode('');
    setPassword('');
    setConfirmPassword('');
  };

  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Password updated
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Your password has been reset successfully. Please log in with your new password.
          </Text>

          <Button
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            style={styles.button}
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons
                name={step === 'request' ? 'lock-closed-outline' : 'key-outline'}
                size={48}
                color={colors.text}
              />
            </View>

            <Text style={[styles.stepTag, { color: colors.textSecondary, borderColor: colors.border }]}>
              {step === 'request' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </Text>

            <Text style={[styles.title, { color: colors.text }]}>
              {step === 'request' ? 'Reset your password' : 'Enter code and new password'}
            </Text>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {step === 'request'
                ? 'We will email you a 6-digit code to reset your password.'
                : 'Enter the 6-digit code we sent and set a new password.'}
            </Text>

            {step === 'verify' && (
              <View
                style={[
                  styles.emailPill,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                ]}
              >
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.emailText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
                <TouchableOpacity onPress={handleChangeEmail}>
                  <Text style={[styles.changeEmailText, { color: colors.textSecondary }]}>
                    Change
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.form}>
              {step === 'request' ? (
                <>
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={errors.email}
                    leftIcon="mail-outline"
                  />

                  <Button
                    title="Send Code"
                    onPress={handleSendCode}
                    loading={isSending}
                    fullWidth
                    style={styles.button}
                  />

                  <Button
                    title="Back to Login"
                    onPress={() => router.back()}
                    variant="ghost"
                    fullWidth
                  />
                </>
              ) : (
                <>
                  <Input
                    value={code}
                    onChangeText={handleCodeChange}
                    placeholder="6-digit code"
                    keyboardType="numeric"
                    autoCapitalize="none"
                    maxLength={6}
                    error={errors.code}
                    leftIcon="key-outline"
                  />

                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="New password"
                    secureTextEntry
                    autoComplete="password"
                    error={errors.password}
                    leftIcon="lock-closed-outline"
                  />

                  <Input
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry
                    autoComplete="password"
                    error={errors.confirmPassword}
                    leftIcon="lock-closed-outline"
                  />

                  <Button
                    title="Reset Password"
                    onPress={handleVerifyAndReset}
                    loading={isVerifying}
                    fullWidth
                    style={styles.button}
                    disabled={!code || !password || !confirmPassword}
                  />

                  <Button
                    title="Resend Code"
                    onPress={handleResendCode}
                    variant="ghost"
                    fullWidth
                    disabled={isSending}
                  />

                  <Button
                    title="Back to Login"
                    onPress={() => router.replace('/(auth)/login')}
                    variant="ghost"
                    fullWidth
                  />
                </>
              )}
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: Spacing.xs,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
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
  stepTag: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
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
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  emailText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontWeight: Typography.weights.semibold,
  },
  changeEmailText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
