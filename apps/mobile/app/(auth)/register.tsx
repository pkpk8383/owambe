import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { api } from '../../src/services/api';
import { Button, Input } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/utils/theme';

const ROLES = [
  { value: 'PLANNER', emoji: '📋', label: 'Event Planner', desc: 'I manage events for clients' },
  { value: 'VENDOR', emoji: '🏢', label: 'Vendor / Business', desc: 'I offer services for events' },
  { value: 'CONSUMER', emoji: '🎉', label: 'Planning My Event', desc: 'I want to plan with AI' },
];

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('PLANNER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!firstName || !lastName || !email || password.length < 8) {
      Alert.alert('Missing details', 'Please fill in all fields. Password must be 8+ characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { firstName, lastName, email: email.toLowerCase(), password, role });
      Alert.alert(
        '✅ Account Created!',
        'Check your email to verify your account, then sign in.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{
          backgroundColor: COLORS.primary, paddingTop: 80,
          paddingBottom: SPACING.xl, paddingHorizontal: SPACING.xl,
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: SPACING.md }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>← Back</Text>
          </TouchableOpacity>
          <Image
            source={require('../../assets/owambe-logo-auth.png')}
            style={{ height: 40, width: undefined, aspectRatio: 148 / 60, resizeMode: 'contain', marginBottom: 10 }}
          />
          <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.white }}>Create account</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', marginTop: 4, fontSize: 14 }}>
            Join 1,000+ event professionals on Owambe
          </Text>
        </View>

        <View style={{ padding: SPACING.xl }}>
          {step === 1 ? (
            <>
              <Text style={{ ...TYPOGRAPHY.h3, marginBottom: SPACING.sm }}>I am a...</Text>
              <View style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.md,
                      padding: SPACING.md,
                      borderRadius: RADIUS.lg,
                      borderWidth: 2,
                      borderColor: role === r.value ? COLORS.primary : COLORS.border,
                      backgroundColor: role === r.value ? COLORS.primaryLight : COLORS.white,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.dark }}>{r.label}</Text>
                      <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{r.desc}</Text>
                    </View>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      borderWidth: 2, borderColor: role === r.value ? COLORS.primary : COLORS.border,
                      backgroundColor: role === r.value ? COLORS.primary : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {role === r.value && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white }} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <Button title="Continue →" onPress={() => setStep(2)} fullWidth size="lg" />
            </>
          ) : (
            <>
              <Text style={{ ...TYPOGRAPHY.h3, marginBottom: SPACING.sm }}>Your details</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Input label="First name" placeholder="Adaeze" value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Last name" placeholder="Okonkwo" value={lastName} onChangeText={setLastName} />
                </View>
              </View>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                placeholder="Minimum 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                <Button title="← Back" variant="secondary" onPress={() => setStep(1)} />
                <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ flex: 1 }} />
              </View>
              <Text style={{ fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: SPACING.md }}>
                By signing up you agree to our Terms and Privacy Policy
              </Text>
            </>
          )}

          <TouchableOpacity
            style={{ marginTop: SPACING.lg, alignItems: 'center' }}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>
              Already have an account?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
