import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { aiApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Button, Card, formatNGN } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, VENDOR_EMOJIS, VENDOR_LABELS } from '../../src/utils/theme';

const { width } = Dimensions.get('window');

interface Message { role: 'user' | 'assistant'; content: string }
interface Brief { eventType?: string; location?: string; date?: string; guestCount?: number; totalBudget?: number }

const QUICK_PROMPTS = [
  'Wedding for 150 guests in Lagos, ₦3M budget',
  'Corporate conference, 80 people, Lekki, ₦1.5M',
  'Birthday party, 50 guests, Victoria Island, ₦600K',
  'Product launch, 120 people, Ikeja, ₦2M',
];

export default function PlanScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! 👋 I'm your Owambe AI event planner. Tell me about your event — what, where, when and your budget. I'll find the best vendors in Lagos! 🇳🇬",
  }]);
  const [input, setInput] = useState('');
  const [brief, setBrief] = useState<Brief>({});
  const [step, setStep] = useState<'chat' | 'plans' | 'confirm'>('chat');
  const [plans, setPlans] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'budget' | 'standard' | 'premium'>('standard');
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Get GPS location
  async function detectLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const rev = await Location.reverseGeocodeAsync(loc.coords);
      if (rev[0]?.city) {
        setInput(prev => prev ? `${prev}, location: ${rev[0].city}` : `My event is in ${rev[0].city}`);
      }
    } catch { /* ignore */ }
  }

  const intakeMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: Message[] }) =>
      aiApi.planIntake(message, history).then(r => r.data),
    onSuccess: (data) => {
      const merged = { ...brief };
      if (data.extracted) {
        Object.entries(data.extracted).forEach(([k, v]) => { if (v !== null) (merged as any)[k] = v; });
        setBrief(merged);
      }

      const reply = data.isComplete
        ? "Perfect! I have everything I need 🎉 Searching for the best vendors in Lagos now..."
        : data.followUpQuestion || "Could you share more details?";

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      if (data.isComplete) {
        setIsComplete(true);
        generatePlans(data.extracted || merged);
      }
    },
  });

  const planMutation = useMutation({
    mutationFn: (d: any) => aiApi.generatePlan(d).then(r => r.data),
    onSuccess: (data) => {
      setPlans(data);
      setStep('plans');
    },
    onError: () => Alert.alert('Error', 'Failed to generate plans. Please try again.'),
  });

  function sendMessage() {
    if (!input.trim() || intakeMutation.isPending || isComplete) return;
    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    intakeMutation.mutate({ message: input, history: newMessages });
  }

  function generatePlans(b: Brief) {
    const d = { ...brief, ...b };
    if (!d.eventType || !d.totalBudget) return;
    planMutation.mutate({
      eventType: d.eventType, location: d.location || 'Lagos',
      date: d.date || new Date().toISOString(), guestCount: d.guestCount || 100,
      totalBudget: d.totalBudget, sessionId: `mobile-${Date.now()}`,
    });
  }

  function quickPrompt(text: string) {
    setInput(text);
  }

  const PLAN_COLORS = { budget: '#059669', standard: COLORS.primary, premium: COLORS.accent };
  const PLAN_LABELS = { budget: 'Budget-Smart', standard: 'Best Value', premium: 'Premium Experience' };

  if (step === 'plans' && plans) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
          <Text style={{ ...TYPOGRAPHY.h2, marginBottom: 4 }}>Your Event Plans</Text>
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.muted, marginBottom: SPACING.lg }}>
            {brief.guestCount} guests · {brief.location || 'Lagos'} · {formatNGN(brief.totalBudget || 0, true)} budget
          </Text>

          {/* Plan selector */}
          {(['budget', 'standard', 'premium'] as const).map(tier => {
            const plan = plans.plans?.[tier];
            if (!plan) return null;
            const isSelected = selectedPlan === tier;
            return (
              <TouchableOpacity
                key={tier}
                onPress={() => setSelectedPlan(tier)}
                activeOpacity={0.85}
              >
                <Card
                  style={{
                    marginBottom: SPACING.sm,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? PLAN_COLORS[tier] : COLORS.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      {tier === 'standard' && (
                        <View style={{
                          backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2,
                          borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: 6,
                        }}>
                          <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '700' }}>RECOMMENDED</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 13, fontWeight: '700', color: PLAN_COLORS[tier], marginBottom: 2 }}>
                        {PLAN_LABELS[tier]}
                      </Text>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.dark }}>
                        {formatNGN(plan.totalCost || 0, true)}
                      </Text>
                      {plans.explanation?.[tier] && (
                        <Text style={{ ...TYPOGRAPHY.caption, marginTop: 4 }} numberOfLines={2}>
                          {plans.explanation[tier]}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      borderWidth: 2, borderColor: isSelected ? PLAN_COLORS[tier] : COLORS.border,
                      backgroundColor: isSelected ? PLAN_COLORS[tier] : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <Text style={{ color: COLORS.white, fontSize: 12 }}>✓</Text>}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}

          {/* Vendor breakdown */}
          {plans.plans?.[selectedPlan]?.selections && (
            <>
              <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.sm, marginTop: SPACING.md }}>
                Vendor Breakdown
              </Text>
              {Object.entries(plans.plans[selectedPlan].selections).map(([cat, vendor]: any) => (
                <Card key={cat} style={{ marginBottom: SPACING.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Text style={{ fontSize: 24 }}>{VENDOR_EMOJIS[cat.toUpperCase()] || '🏢'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {VENDOR_LABELS[cat.toUpperCase()] || cat}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.dark }} numberOfLines={1}>
                        {vendor.businessName}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>
                        {formatNGN(vendor.price, true)}
                      </Text>
                      {vendor.isInstantBook && (
                        <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '600' }}>⚡ Instant</Text>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}

          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            <Button
              title="← Edit Brief"
              variant="secondary"
              onPress={() => { setStep('chat'); setIsComplete(false); }}
            />
            <Button
              title="Book This Plan →"
              variant="accent"
              onPress={() => setStep('confirm')}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'confirm' && plans) {
    const plan = plans.plans?.[selectedPlan];
    const total = plan?.totalCost || 0;
    const deposit = total * 0.3;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
          <Text style={{ ...TYPOGRAPHY.h2, marginBottom: SPACING.lg }}>Confirm Your Plan</Text>
          <Card style={{ marginBottom: SPACING.lg }}>
            <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.sm }}>Booking Summary</Text>
            {[
              ['Event Type', brief.eventType],
              ['Location', brief.location || 'Lagos'],
              ['Guests', `${brief.guestCount}`],
              ['Plan', PLAN_LABELS[selectedPlan]],
              ['Total Cost', formatNGN(total)],
            ].map(([l, v]) => (
              <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <Text style={{ ...TYPOGRAPHY.body, color: COLORS.muted }}>{l}</Text>
                <Text style={{ ...TYPOGRAPHY.body, fontWeight: '700' }}>{v}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 }}>
              <Text style={TYPOGRAPHY.caption}>Deposit now (30%)</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary }}>{formatNGN(deposit)}</Text>
            </View>
          </Card>
          <Text style={{ ...TYPOGRAPHY.caption, textAlign: 'center', marginBottom: SPACING.lg }}>
            🔒 Secure payment via Paystack · Balance released after your event
          </Text>
          <Button
            title={`Pay Deposit ${formatNGN(deposit)} via Paystack →`}
            variant="accent"
            fullWidth
            size="lg"
            onPress={() => Alert.alert('Payment', 'Redirecting to Paystack...')}
          />
          <Button
            title="← Back to plans"
            variant="ghost"
            fullWidth
            onPress={() => setStep('plans')}
            style={{ marginTop: SPACING.sm }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Chat (intake) screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={{
          backgroundColor: COLORS.primary,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
        }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '800' }}>✨ AI Event Planner</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
            Tell me your event — I'll find the perfect vendors
          </Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.sm }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: SPACING.sm,
              gap: 8,
            }}>
              {m.role === 'assistant' && (
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Text style={{ fontSize: 16 }}>✨</Text>
                </View>
              )}
              <View style={{
                maxWidth: '80%',
                backgroundColor: m.role === 'user' ? COLORS.primary : COLORS.white,
                borderRadius: RADIUS.lg,
                borderBottomRightRadius: m.role === 'user' ? 4 : RADIUS.lg,
                borderBottomLeftRadius: m.role === 'user' ? RADIUS.lg : 4,
                padding: SPACING.md,
                borderWidth: m.role === 'assistant' ? 1 : 0,
                borderColor: COLORS.border,
              }}>
                <Text style={{
                  fontSize: 14, lineHeight: 20,
                  color: m.role === 'user' ? COLORS.white : COLORS.dark,
                }}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing indicator */}
          {(intakeMutation.isPending || planMutation.isPending) && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.sm }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>✨</Text>
              </View>
              <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            </View>
          )}

          {/* Quick prompts — show only on first message */}
          {messages.length === 1 && (
            <View style={{ marginTop: SPACING.sm }}>
              <Text style={{ ...TYPOGRAPHY.label, marginBottom: SPACING.sm }}>Quick start</Text>
              {QUICK_PROMPTS.map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => quickPrompt(p)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: RADIUS.md,
                    padding: SPACING.sm,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: COLORS.mid }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View style={{
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          padding: SPACING.md,
          flexDirection: 'row',
          gap: SPACING.sm,
          alignItems: 'flex-end',
        }}>
          <TouchableOpacity onPress={detectLocation} style={{ paddingBottom: 12 }}>
            <Text style={{ fontSize: 22 }}>📍</Text>
          </TouchableOpacity>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Tell me about your event..."
            placeholderTextColor={COLORS.muted}
            multiline
            maxLength={500}
            style={{
              flex: 1,
              fontSize: 14,
              color: COLORS.dark,
              backgroundColor: COLORS.bg,
              borderRadius: RADIUS.md,
              padding: SPACING.sm,
              maxHeight: 100,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            editable={!isComplete}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || intakeMutation.isPending || isComplete}
            activeOpacity={0.8}
            style={{
              backgroundColor: input.trim() && !isComplete ? COLORS.primary : COLORS.border,
              width: 40, height: 40, borderRadius: 20,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
