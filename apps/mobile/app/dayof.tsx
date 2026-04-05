import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking,
  Alert, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { bookingsApi } from '../src/services/api';
import { Card, Spinner, Badge, formatNGN } from '../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, VENDOR_EMOJIS, VENDOR_LABELS } from '../src/utils/theme';

export default function DayOfScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: bookingsData, refetch } = useQuery({
    queryKey: ['event-bookings', eventId],
    queryFn: () => bookingsApi.list({ limit: 50 }).then(r => r.data),
  });

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const bookings = bookingsData?.bookings?.filter((b: any) => b.status === 'CONFIRMED') || [];

  // Mock runsheet (in production this comes from event data)
  const RUNSHEET = [
    { time: '09:00', label: 'Venue setup begins', vendor: 'Décor & Florals', done: true },
    { time: '10:30', label: 'AV & sound check', vendor: 'AV & Production', done: true },
    { time: '11:00', label: 'Catering arrives', vendor: 'Catering', done: false },
    { time: '12:00', label: 'Guest registration opens', vendor: null, done: false },
    { time: '13:00', label: 'Photography begins', vendor: 'Photography', done: false },
    { time: '14:00', label: 'Main event starts', vendor: null, done: false },
    { time: '17:00', label: 'Event closes', vendor: null, done: false },
    { time: '18:00', label: 'Breakdown & clear', vendor: null, done: false },
  ];

  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nextItem = RUNSHEET.find(r => {
    const [h, m] = r.time.split(':').map(Number);
    return h + m / 60 > currentHour;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Stack.Screen options={{ headerTitle: 'Day-of Coordinator', headerBackTitle: 'Back' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Live clock + next up */}
        <Card style={{ marginBottom: SPACING.md, backgroundColor: COLORS.primary, borderColor: COLORS.primary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                EVENT DAY — LIVE
              </Text>
              <Text style={{ color: COLORS.white, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>
                {now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {nextItem && (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: RADIUS.md, padding: SPACING.sm, maxWidth: 160,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' }}>UP NEXT</Text>
                <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                  {nextItem.time} · {nextItem.label}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/checkin')}
            activeOpacity={0.85}
            style={{
              marginTop: SPACING.md,
              backgroundColor: COLORS.accent,
              borderRadius: RADIUS.md,
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 14 }}>
              📷 Open Check-in Scanner
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Vendor contacts */}
        <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.sm }}>
          Vendor Contacts ({bookings.length})
        </Text>
        {bookings.length === 0 && (
          <Card style={{ marginBottom: SPACING.md }}>
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.muted }}>
              No confirmed bookings for this event. Book vendors first.
            </Text>
          </Card>
        )}
        {bookings.map((b: any) => (
          <VendorContactCard key={b.id} booking={b} />
        ))}

        {/* Runsheet */}
        <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.sm, marginTop: SPACING.sm }}>
          Event Runsheet
        </Text>
        <Card padding={0} style={{ overflow: 'hidden', marginBottom: SPACING.md }}>
          {RUNSHEET.map((item, i) => {
            const [h, m] = item.time.split(':').map(Number);
            const isPast = h + m / 60 < currentHour;
            const isNow = !item.done && nextItem?.time === item.time;

            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
                  padding: SPACING.md,
                  backgroundColor: isNow ? COLORS.primaryLight : 'transparent',
                  borderBottomWidth: i < RUNSHEET.length - 1 ? 1 : 0,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Text style={{
                  fontFamily: 'Courier', fontSize: 13, fontWeight: '600',
                  color: isPast ? COLORS.muted : isNow ? COLORS.primary : COLORS.dark,
                  width: 46,
                }}>
                  {item.time}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14, fontWeight: isNow ? '700' : '500',
                    color: isPast ? COLORS.muted : COLORS.dark,
                    textDecorationLine: isPast ? 'line-through' : 'none',
                  }}>
                    {item.label}
                  </Text>
                  {item.vendor && (
                    <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 1 }}>{item.vendor}</Text>
                  )}
                </View>
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: isPast ? COLORS.success : isNow ? COLORS.accent : COLORS.border,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isPast && <Text style={{ color: COLORS.white, fontSize: 11 }}>✓</Text>}
                  {isNow && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white }} />}
                </View>
              </View>
            );
          })}
        </Card>

        {/* Issue reporting */}
        <Card style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
          <Text style={{ ...TYPOGRAPHY.h4, color: '#92400E', marginBottom: SPACING.xs }}>⚠️ Report an Issue</Text>
          <Text style={{ ...TYPOGRAPHY.body, fontSize: 13, color: '#92400E', marginBottom: SPACING.sm }}>
            If a vendor cancels or there's a problem, report it immediately. We'll find a replacement within 2 hours.
          </Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Issue Reported', 'Our team has been notified and will contact you within 15 minutes.')}
            style={{
              backgroundColor: '#92400E', borderRadius: RADIUS.md,
              paddingVertical: 10, alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>
              Report Issue Now
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function VendorContactCard({ booking }: { booking: any }) {
  const vendor = booking.vendor;
  const [expanded, setExpanded] = useState(false);

  function call() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:+234000000000`); // In production use vendor.phone
  }

  function message() {
    router.push(`/booking/${booking.id}`);
  }

  return (
    <Card style={{ marginBottom: SPACING.sm }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={{ fontSize: 28 }}>{VENDOR_EMOJIS[vendor?.category] || '🏢'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {VENDOR_LABELS[vendor?.category] || vendor?.category}
            </Text>
            <Text style={{ ...TYPOGRAPHY.h4, fontSize: 15 }}>{vendor?.businessName}</Text>
          </View>
          <Badge
            label={booking.paymentStatus === 'FULLY_PAID' ? 'Paid ✓' : 'Deposit ✓'}
            variant="confirmed"
          />
          <Text style={{ color: COLORS.muted, fontSize: 16 }}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TouchableOpacity
              onPress={call}
              activeOpacity={0.85}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: COLORS.success, borderRadius: RADIUS.md,
                paddingVertical: 10, gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>📞</Text>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={message}
              activeOpacity={0.85}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
                paddingVertical: 10, gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>💬</Text>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const addr = vendor?.address || vendor?.city || 'Lagos';
                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(addr)}`);
              }}
              activeOpacity={0.85}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#3B82F6', borderRadius: RADIUS.md,
                paddingVertical: 10, gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>🗺</Text>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>Map</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ ...TYPOGRAPHY.caption, marginTop: SPACING.sm, textAlign: 'center' }}>
            Booking ref: {booking.reference} · {formatNGN(booking.totalAmount, true)}
          </Text>
        </View>
      )}
    </Card>
  );
}
