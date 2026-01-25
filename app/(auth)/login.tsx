/**
 * Login Screen
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
import { signIn } from '../../src/lib/auth';
import { validateLoginForm } from '../../src/utils/validation';
import { Typography, Spacing } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validate form
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await signIn({ email, password });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
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
            <View style={[styles.logoCircles]}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
              <View style={[styles.circle, styles.circle4]} />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>LMNL</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="Email or username"
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
              error={errors.email}
              leftIcon="person-outline"
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

            <Button
              title="Log in"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Sign up link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.signupLink, { color: colors.primary }]}>
                  Sign up
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
    marginBottom: Spacing['3xl'],
  },
  logoCircles: {
    width: 80,
    height: 80,
    position: 'relative',
    marginBottom: Spacing.base,
  },
  circle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  circle1: {
    backgroundColor: '#FF6B6B',
    top: 0,
    left: 0,
  },
  circle2: {
    backgroundColor: '#4ECDC4',
    top: 0,
    right: 0,
  },
  circle3: {
    backgroundColor: '#45B7D1',
    bottom: 0,
    left: 0,
  },
  circle4: {
    backgroundColor: '#96CEB4',
    bottom: 0,
    right: 0,
  },
  logoText: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    letterSpacing: 4,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: Typography.sizes.sm,
  },
  signupLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
