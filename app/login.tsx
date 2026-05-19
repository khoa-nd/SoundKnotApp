// ── Sound Knot V2 — Login / Register Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/constants/theme';
import { Typography } from '../src/constants/Typography';
import { Spacing, Radius } from '../src/constants/Spacing';
import { Chip } from '../src/components/ui/Chip';
import { useAuthStore } from '../src/stores/authStore';

export default function LoginScreen() {
  const colors = useTheme();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('ndkhoa.is@gmail.com');
  const [password, setPassword] = useState('11235813');
  const [displayName, setDisplayName] = useState('');

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      if (mode === 'login') {
        await login(email.trim(), password.trim());
      } else {
        await register(email.trim(), password.trim(), displayName.trim() || undefined);
      }
      router.replace('/(tabs)/home');
    } catch {
      // error is set in the store
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      >
        <View style={styles.content}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <Text style={[Typography.titleLarge, { color: colors.ink3 }]}>
              {mode === 'login' ? 'Welcome back.' : 'Start listening.'}
            </Text>
            <Text style={[Typography.titleLarge, Typography.serifItalic]}>
              {mode === 'login' ? 'Pick up the thread.' : 'Tie the first knot.'}
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorRow}>
              <Chip label={error} dotColor={colors.negative} />
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {mode === 'register' && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.paper2,
                    borderColor: colors.hair,
                    color: colors.ink,
                  },
                  Typography.mono,
                ]}
                placeholder="Display name"
                placeholderTextColor={colors.ink4}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            )}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.paper2,
                  borderColor: colors.hair,
                  color: colors.ink,
                },
                Typography.mono,
              ]}
              placeholder="Email"
              placeholderTextColor={colors.ink4}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.paper2,
                  borderColor: colors.hair,
                  color: colors.ink,
                },
                Typography.mono,
              ]}
              placeholder="Password"
              placeholderTextColor={colors.ink4}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: email && password ? colors.ink : colors.ink4 },
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !email.trim() || !password.trim()}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.paper} />
              ) : (
                <Text style={[Typography.button, { color: colors.paper }]}>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Google placeholder */}
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: colors.hair }]}
              disabled
              activeOpacity={0.5}
            >
              <Text style={[Typography.button, { color: colors.ink4 }]}>
                Sign in with Google (coming soon)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle mode */}
          <View style={styles.toggleRow}>
            <Text style={[Typography.bodySmall, { color: colors.ink3 }]}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleMode} activeOpacity={0.7}>
              <Text style={[Typography.bodySmall, { color: colors.ink, fontWeight: '600' }]}>
                {mode === 'login' ? ' Create one' : ' Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.screen,
    justifyContent: 'center',
  },
  heroSection: {
    marginBottom: Spacing.massive,
  },
  errorRow: {
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
  },
  submitBtn: {
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  googleBtn: {
    paddingVertical: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.huge,
  },
});
