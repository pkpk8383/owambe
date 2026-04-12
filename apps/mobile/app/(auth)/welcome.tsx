import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../src/utils/theme';
import { Button } from '../../src/components/ui';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🤖',
    title: 'Plan any event\nwith AI',
    body: 'Describe your event, budget, and guest count. Our AI plans everything in under 2 minutes.',
    bg: COLORS.primary,
  },
  {
    emoji: '🏛',
    title: '200+ verified\nLagos vendors',
    body: 'Venues, catering, photography, AV, makeup, décor — all verified, all in one place.',
    bg: '#4A1D96',
  },
  {
    emoji: '🔒',
    title: 'Pay with\nconfidence',
    body: 'Deposits held in escrow via Paystack. Vendors get paid after your event. You\'re protected.',
    bg: '#A07A10',
  },
  {
    emoji: '📱',
    title: 'Event day\ncoordinator',
    body: 'On the day, the app becomes your live operations hub. Vendor contacts, schedule, live chat.',
    bg: '#7B61FF',
  },
];

export default function WelcomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = React.useState(0);

  function next() {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (current + 1), animated: true });
      setCurrent(current + 1);
    } else {
      router.push('/(auth)/login');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: SLIDES[current].bg }}>
      <StatusBar style="light" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width, flex: 1, backgroundColor: slide.bg }}>
            <LinearGradient
              colors={[slide.bg, slide.bg + 'CC', '#1C1528']}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}
            >
              <Text style={{ fontSize: 96, marginBottom: SPACING.xl }}>{slide.emoji}</Text>
              <Text style={{
                fontSize: 36, fontWeight: '800', color: COLORS.white,
                textAlign: 'center', lineHeight: 44, marginBottom: SPACING.md,
              }}>
                {slide.title}
              </Text>
              <Text style={{
                fontSize: 17, color: 'rgba(255,255,255,0.75)',
                textAlign: 'center', lineHeight: 26, maxWidth: 300,
              }}>
                {slide.body}
              </Text>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: SPACING.xl, paddingBottom: 48,
        backgroundColor: '#1C1528',
      }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: SPACING.lg }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={{
              width: i === current ? 24 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === current ? COLORS.accent : 'rgba(255,255,255,0.3)',
            }} />
          ))}
        </View>

        <TouchableOpacity
          onPress={next}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.accent,
            padding: 18,
            borderRadius: RADIUS.lg,
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '800' }}>
            {current === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>

        {current === SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              Already have an account? <Text style={{ color: COLORS.accent, fontWeight: '700' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
