import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../src/store/auth.store';
import { Button, Input } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/utils/theme';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!email.includes('@')) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'Password too short';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
      // Router redirect is handled by auth layout
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Check your email and password.';
      Alert.alert('Sign In Failed', msg);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          backgroundColor: COLORS.primary,
          paddingTop: 80,
          paddingBottom: SPACING.xl,
          paddingHorizontal: SPACING.xl,
        }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 }}>
            event<Text style={{ color: COLORS.accent }}>flow</Text>
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 15 }}>
            Nigeria's smartest event platform
          </Text>
        </View>

        {/* Form */}
        <View style={{ flex: 1, padding: SPACING.xl }}>
          <Text style={{ ...TYPOGRAPHY.h2, marginBottom: 4 }}>Welcome back</Text>
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.muted, marginBottom: SPACING.xl }}>
            Sign in to your Owambe account
          </Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            returnKeyType="next"
          />

          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={() => {/* forgot password */}}
            style={{ alignSelf: 'flex-end', marginBottom: SPACING.lg, marginTop: -4 }}
          >
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
          />

          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginVertical: SPACING.lg, gap: SPACING.sm,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View>

          {/* Google sign in */}
          <Button
            title="Continue with Google"
            variant="secondary"
            fullWidth
            size="lg"
            onPress={() => Alert.alert('Google Sign-In', 'Coming soon')}
          />

          <TouchableOpacity
            style={{ marginTop: SPACING.xl, alignItems: 'center' }}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>
              Don't have an account?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Create one free</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
