import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../src/services/api';
import { StatCard, Card, Spinner, formatNGN } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/utils/theme';

const MOCK_PAYOUTS = [
  { event: 'Wedding — Jul 15', amount: 1800000, daysLeft: 12, status: 'pending' },
  { event: 'Conference — Jul 22', amount: 650000, daysLeft: 19, status: 'pending' },
  { event: 'Birthday — May 3', amount: 320000, daysLeft: 0, status: 'released' },
  { event: 'Launch Event — Apr 28', amount: 900000, daysLeft: 0, status: 'released' },
];

export default function VendorEarningsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-revenue-mobile'],
    queryFn: () => analyticsApi.vendorRevenue().then(r => r.data),
  });

  const stats = data?.stats;

  if (isLoading) return <Spinner />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
        <Text style={{ ...TYPOGRAPHY.h3, marginBottom: SPACING.lg }}>Earnings</Text>

        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <StatCard label="Total Earned" value={stats ? formatNGN(stats.totalRevenue, true) : '—'} accent={COLORS.primary} />
          <StatCard label="In Escrow" value={stats ? formatNGN(stats.pendingPayout, true) : '—'} accent={COLORS.accent} />
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
          <StatCard label="Bookings" value={stats?.totalBookings ?? '—'} accent="#7B61FF" />
          <StatCard label="Avg per Booking" value={stats?.totalBookings && stats?.totalRevenue ? formatNGN(stats.totalRevenue / stats.totalBookings, true) : '—'} accent="#059669" />
        </View>

        {/* Launch bonus info */}
        <Card style={{ marginBottom: SPACING.lg, backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 4 }}>
            🎉 Launch Bonus Active
          </Text>
          <Text style={{ fontSize: 13, color: '#92400E' }}>
            You're on 0% commission for your first 90 days. Standard rate applies after the bonus period.
          </Text>
        </Card>

        {/* Upcoming payouts */}
        <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.sm }}>Payout Schedule</Text>
        <Card padding={0} style={{ overflow: 'hidden', marginBottom: SPACING.lg }}>
          {MOCK_PAYOUTS.map((p, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
              borderBottomWidth: i < MOCK_PAYOUTS.length - 1 ? 1 : 0, borderBottomColor: COLORS.border,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.dark }} numberOfLines={1}>{p.event}</Text>
                <Text style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                  {p.status === 'released' ? 'Released to bank ✓' : `Releases in ${p.daysLeft} days`}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: p.status === 'released' ? COLORS.success : COLORS.primary }}>
                  {formatNGN(p.amount, true)}
                </Text>
                <Text style={{
                  fontSize: 10, fontWeight: '700',
                  color: p.status === 'released' ? COLORS.success : COLORS.muted,
                }}>
                  {p.status === 'released' ? 'PAID' : 'PENDING'}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Commission notice */}
        <Card style={{ backgroundColor: COLORS.primaryLight }}>
          <Text style={{ fontSize: 13, color: COLORS.primary }}>
            💰 Owambe deducts its commission automatically before releasing your payout. You always see your net amount.
            Standard rates: 8% for instant bookings, 10–12% for venues and RFQ bookings.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
