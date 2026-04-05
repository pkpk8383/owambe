import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../src/services/api';
import { Card, Badge, Spinner, EmptyState, formatNGN } from '../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../src/utils/theme';
import { formatShortDate } from '../src/utils/helpers';

const STATUS_TABS = ['All', 'DRAFT', 'PUBLISHED', 'LIVE', 'ENDED'];

const STATUS_BADGE_MAP: Record<string, any> = {
  DRAFT: 'draft',
  PUBLISHED: 'primary',
  LIVE: 'live',
  ENDED: 'cancelled',
};

export default function EventsScreen() {
  const [activeStatus, setActiveStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-events-list', activeStatus],
    queryFn: () => eventsApi.list({
      status: activeStatus || undefined,
      limit: 50,
    }).then(r => r.data),
  });

  const publishMutation = useMutation({
    mutationFn: eventsApi.publish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events-list'] });
      Alert.alert('🚀 Event Published!', 'Your event is now live and accepting registrations.');
    },
    onError: (err: any) => Alert.alert('Publish Failed', err.response?.data?.error || 'Could not publish event.'),
  });

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const events = data?.events || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Stack.Screen options={{
        headerTitle: 'My Events',
        headerBackTitle: 'Home',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/plan')}
            style={{ marginRight: 4 }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 15 }}>+ New</Text>
          </TouchableOpacity>
        ),
      }} />

      {/* Status filter */}
      <View style={{ backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, padding: SPACING.sm, paddingHorizontal: SPACING.md }}
        >
          {STATUS_TABS.map(tab => {
            const active = tab === 'All' ? !activeStatus : activeStatus === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveStatus(tab === 'All' ? '' : tab)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: RADIUS.full,
                  backgroundColor: active ? COLORS.dark : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? COLORS.dark : COLORS.border,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: active ? COLORS.white : COLORS.mid,
                }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? <Spinner /> : (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {events.length === 0 ? (
            <EmptyState
              emoji="🎉"
              title={activeStatus ? `No ${activeStatus.toLowerCase()} events` : 'No events yet'}
              description="Create your first event to get started"
              action={
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/plan')}
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 24, paddingVertical: 12,
                    borderRadius: RADIUS.md,
                  }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: '700' }}>Create Event with AI</Text>
                </TouchableOpacity>
              }
            />
          ) : (
            events.map((ev: any) => (
              <Card key={ev.id} style={{ marginBottom: SPACING.sm }}>
                {/* Header */}
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: SPACING.sm,
                }}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Text style={{ ...TYPOGRAPHY.h4, marginBottom: 2 }} numberOfLines={1}>
                      {ev.name}
                    </Text>
                    <Text style={TYPOGRAPHY.caption}>
                      {ev.type || 'Event'} · {ev.city || 'Lagos'}
                    </Text>
                  </View>
                  <Badge label={ev.status} variant={STATUS_BADGE_MAP[ev.status] || 'draft'} />
                </View>

                {/* Stats row */}
                <View style={{
                  flexDirection: 'row', gap: SPACING.lg,
                  paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border,
                  marginBottom: SPACING.sm,
                }}>
                  <View>
                    <Text style={TYPOGRAPHY.label}>Date</Text>
                    <Text style={{ fontSize: 13, color: COLORS.dark, fontWeight: '600', marginTop: 2 }}>
                      {ev.startDate ? formatShortDate(ev.startDate) : 'TBC'}
                    </Text>
                  </View>
                  <View>
                    <Text style={TYPOGRAPHY.label}>Registered</Text>
                    <Text style={{ fontSize: 13, color: COLORS.dark, fontWeight: '600', marginTop: 2 }}>
                      {ev.registrationCount || 0}
                      {ev.maxCapacity ? ` / ${ev.maxCapacity}` : ''}
                    </Text>
                  </View>
                  <View>
                    <Text style={TYPOGRAPHY.label}>Revenue</Text>
                    <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 2 }}>
                      {formatNGN(ev.revenue || 0, true)}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  {ev.status === 'DRAFT' && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Publish Event',
                          'Make this event live and start accepting registrations?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Publish', onPress: () => publishMutation.mutate(ev.id) },
                          ]
                        );
                      }}
                      style={{
                        flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
                        paddingVertical: 8, alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>
                        🚀 Publish
                      </Text>
                    </TouchableOpacity>
                  )}
                  {(ev.status === 'PUBLISHED' || ev.status === 'LIVE') && (
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/checkin', params: { eventId: ev.id } })}
                      style={{
                        flex: 1, backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
                        paddingVertical: 8, alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>
                        📷 Check-in
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/dayof',
                      params: { eventId: ev.id },
                    })}
                    style={{
                      flex: ev.status === 'DRAFT' ? 1 : 1,
                      backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
                      paddingVertical: 8, alignItems: 'center',
                      borderWidth: 1, borderColor: COLORS.border,
                    }}
                  >
                    <Text style={{ color: COLORS.mid, fontSize: 13, fontWeight: '600' }}>
                      📋 Day-of
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
