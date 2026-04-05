import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { analyticsApi, eventsApi } from '../src/services/api';
import { StatCard, Card, Spinner, formatNGN } from '../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../src/utils/theme';

const { width } = Dimensions.get('window');
const CHART_W = width - SPACING.lg * 2 - SPACING.md * 2; // card padding
const CHART_H = 140;

// Native SVG bar chart — no external chart lib needed on mobile
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = (CHART_W - 8) / data.length - 4;

  return (
    <Svg width={CHART_W} height={CHART_H + 20}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * CHART_H);
        const x = i * (barW + 4) + 2;
        const y = CHART_H - barH;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y} width={barW} height={barH}
              rx={3} fill={i === data.length - 1 ? COLORS.accent : COLORS.primary}
              opacity={0.7 + i * (0.3 / data.length)}
            />
            <SvgText
              x={x + barW / 2} y={CHART_H + 14}
              textAnchor="middle" fontSize={9}
              fill={COLORS.muted}
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke={COLORS.border} strokeWidth={1} />
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const [selectedEventId, setSelectedEventId] = useState('');

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['planner-overview-mobile'],
    queryFn: () => analyticsApi.plannerOverview().then(r => r.data),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['my-events-analytics'],
    queryFn: () => eventsApi.list({ limit: 20 }).then(r => r.data),
  });

  const stats = overviewData?.stats;
  const events = eventsData?.events || [];

  // Mock monthly chart data (replace with real API data)
  const MONTHLY = [
    { label: 'Jan', value: 0 },
    { label: 'Feb', value: 12 },
    { label: 'Mar', value: 34 },
    { label: 'Apr', value: 28 },
    { label: 'May', value: 56 },
    { label: 'Jun', value: 71 },
  ];

  const REVENUE = [
    { label: 'Jan', value: 0 },
    { label: 'Feb', value: 480000 },
    { label: 'Mar', value: 1200000 },
    { label: 'Apr', value: 850000 },
    { label: 'May', value: 2100000 },
    { label: 'Jun', value: 1750000 },
  ];

  if (overviewLoading) return <Spinner />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Stack.Screen options={{ headerTitle: 'Analytics', headerBackTitle: 'Home' }} />

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview stats */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
          <StatCard
            label="Total Events"
            value={stats?.totalEvents ?? '—'}
            sub={`${stats?.liveEvents ?? 0} live now`}
            accent={COLORS.primary}
          />
          <StatCard
            label="Registrations"
            value={stats?.totalAttendees ?? '—'}
            sub="all time"
            accent={COLORS.accent}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
          <StatCard
            label="Revenue"
            value={stats ? formatNGN(stats.totalRevenue, true) : '—'}
            accent="#7B61FF"
          />
          <StatCard
            label="Avg Fill Rate"
            value={stats ? `${stats.fillRate ?? 0}%` : '—'}
            accent="#059669"
          />
        </View>

        {/* Registrations chart */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.md }}>
            Registrations — Last 6 Months
          </Text>
          <BarChart data={MONTHLY} />
        </Card>

        {/* Revenue chart */}
        <Card style={{ marginBottom: SPACING.md }}>
          <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.md }}>
            Revenue — Last 6 Months (₦)
          </Text>
          <BarChart data={REVENUE.map(r => ({
            label: r.label,
            value: r.value / 1000, // Scale to K for display
          }))} />
          <Text style={{ ...TYPOGRAPHY.caption, textAlign: 'center', marginTop: 4 }}>
            Values in ₦000s
          </Text>
        </Card>

        {/* Per-event breakdown */}
        <Text style={{ ...TYPOGRAPHY.h4, marginBottom: SPACING.sm }}>Event Performance</Text>
        {events.slice(0, 5).map((ev: any) => {
          const fillRate = ev.maxCapacity && ev.registrationCount
            ? Math.round((ev.registrationCount / ev.maxCapacity) * 100)
            : null;
          return (
            <Card key={ev.id} style={{ marginBottom: SPACING.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                <Text style={{ ...TYPOGRAPHY.h4, fontSize: 14, flex: 1 }} numberOfLines={1}>
                  {ev.name}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>
                  {formatNGN(ev.revenue || 0, true)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={TYPOGRAPHY.caption}>
                  👥 {ev.registrationCount || 0}{ev.maxCapacity ? ` / ${ev.maxCapacity}` : ''} registered
                </Text>
                {fillRate !== null && (
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: fillRate >= 80 ? COLORS.success : fillRate >= 50 ? COLORS.warning : COLORS.danger,
                  }}>
                    {fillRate}% full
                  </Text>
                )}
              </View>
              {ev.maxCapacity && ev.registrationCount && (
                <View style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min(100, fillRate || 0)}%`,
                    backgroundColor: (fillRate || 0) >= 80 ? COLORS.success : COLORS.primary,
                    borderRadius: 2,
                  }} />
                </View>
              )}
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card>
            <Text style={{ ...TYPOGRAPHY.body, textAlign: 'center', color: COLORS.muted }}>
              Create and publish events to see your analytics here.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
