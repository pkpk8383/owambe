// vendor/calendar.tsx - Availability calendar
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { vendorsApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Card, Button } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/utils/theme';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function VendorCalendarScreen() {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'block' | 'open'>('block');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  const setAvailMutation = useMutation({
    mutationFn: (dates: any[]) => vendorsApi.setAvailability(dates),
    onSuccess: () => {
      Alert.alert('✅ Saved', `${selected.size} dates updated.`);
      setSelected(new Set());
    },
  });

  function toggleDate(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    const d = new Date(year, month, day);
    if (d < today) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  function applySelected() {
    const dates = Array.from(selected).map(d => ({
      date: d, isAvailable: mode === 'open', isBlocked: mode === 'block',
    }));
    setAvailMutation.mutate(dates);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
        <Text style={{ ...TYPOGRAPHY.h3, marginBottom: SPACING.lg }}>Availability</Text>

        <Card style={{ marginBottom: SPACING.lg }}>
          {/* Month navigation */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
            <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <Text style={{ fontSize: 20, color: COLORS.primary }}>‹</Text>
            </TouchableOpacity>
            <Text style={TYPOGRAPHY.h4}>{monthName}</Text>
            <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <Text style={{ fontSize: 20, color: COLORS.primary }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={{ flexDirection: 'row', marginBottom: SPACING.xs }}>
            {DAYS.map(d => (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.muted }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`pad-${i}`} style={{ width: `${100 / 7}%` }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selected.has(dateStr);
              const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));
              const isToday = new Date(year, month, day).toDateString() === new Date().toDateString();

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => !isPast && toggleDate(day)}
                  disabled={isPast}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                  }}
                >
                  <View style={{
                    width: '85%', aspectRatio: 1, borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? COLORS.accent : isToday ? COLORS.primaryLight : 'transparent',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: COLORS.primary,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{
                      fontSize: 13, fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? COLORS.white : isPast ? COLORS.border : COLORS.dark,
                    }}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Mode selector */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
          <TouchableOpacity
            onPress={() => setMode('open')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center',
              backgroundColor: mode === 'open' ? '#059669' : COLORS.white,
              borderWidth: 1.5, borderColor: mode === 'open' ? '#059669' : COLORS.border,
            }}
          >
            <Text style={{ fontWeight: '700', color: mode === 'open' ? COLORS.white : COLORS.mid }}>
              ✓ Mark Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('block')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center',
              backgroundColor: mode === 'block' ? COLORS.danger : COLORS.white,
              borderWidth: 1.5, borderColor: mode === 'block' ? COLORS.danger : COLORS.border,
            }}
          >
            <Text style={{ fontWeight: '700', color: mode === 'block' ? COLORS.white : COLORS.mid }}>
              ✕ Block Off
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={`Apply to ${selected.size} day${selected.size !== 1 ? 's' : ''}`}
          fullWidth size="lg"
          loading={setAvailMutation.isPending}
          onPress={applySelected}
          disabled={selected.size === 0}
        />
        {selected.size > 0 && (
          <Button title="Clear selection" variant="ghost" fullWidth onPress={() => setSelected(new Set())} style={{ marginTop: 4 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
