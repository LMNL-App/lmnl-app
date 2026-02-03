/**
 * Sign Up Screen
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/stores/themeStore';
import { Button, Input } from '../../src/components/ui';
import { signUp } from '../../src/lib/auth';
import { validateSignUpForm } from '../../src/utils/validation';
import { Typography, Spacing } from '../../src/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    // Validate form
    const validation = validateSignUpForm({
      email,
      password,
      confirmPassword,
      fullName,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await signUp({ email, password, fullName });
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { color: colors.text }]}>lmnl</Text>
            <Text style={[styles.logoTagline, { color: colors.textTertiary }]}>quality over quantity</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.fullName}
              leftIcon="person-outline"
            />

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

            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
              leftIcon="lock-closed-outline"
            />

            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              secureTextEntry
              autoComplete="password"
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
            />

            <Button
              title="Sign up"
              onPress={handleSignUp}
              loading={isLoading}
              fullWidth
              style={styles.signupButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
          </View>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: colors.text }]}>
                  Log in
                </Text>
              </TouchableOpacity>
            </Link>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoText: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    letterSpacing: 6,
  },
  logoTagline: {
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  signupButton: {
    marginTop: Spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.base,
    fontSize: Typography.sizes.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: Typography.sizes.sm,
  },
  loginLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
