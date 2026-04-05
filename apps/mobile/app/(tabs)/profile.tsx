import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { Avatar, Card, Button } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/utils/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const isPlanner = user?.role === 'PLANNER';

  const MENU_ITEMS = [
    {
      section: 'Account',
      items: [
        { emoji: '👤', label: 'Edit Profile', onPress: () => Alert.alert('Coming soon') },
        { emoji: '🔔', label: 'Notifications', right: <Switch value={notifications} onValueChange={setNotifications} thumbColor={COLORS.white} trackColor={{ true: COLORS.primary, false: COLORS.border }} /> },
        { emoji: '🔐', label: 'Change Password', onPress: () => Alert.alert('Coming soon') },
      ],
    },
    ...(isPlanner ? [{
      section: 'Planner Tools',
      items: [
        { emoji: '🎫', label: 'Check-in Scanner', onPress: () => router.push('/checkin') },
        { emoji: '📊', label: 'Analytics', onPress: () => router.push('/analytics') },
        { emoji: '📅', label: 'My Events', onPress: () => router.push('/events') },
      ],
    }] : []),
    {
      section: 'Support',
      items: [
        { emoji: '❓', label: 'Help & FAQ', onPress: () => Alert.alert('Coming soon') },
        { emoji: '💬', label: 'Contact Support', onPress: () => Alert.alert('Coming soon') },
        { emoji: '⭐', label: 'Rate Owambe', onPress: () => Alert.alert('Coming soon') },
        { emoji: '📄', label: 'Terms & Privacy', onPress: () => Alert.alert('Coming soon') },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxl }} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={{
          backgroundColor: COLORS.primary,
          paddingTop: SPACING.lg,
          paddingBottom: 40,
          paddingHorizontal: SPACING.xl,
          alignItems: 'center',
        }}>
          <Avatar
            name={`${user?.firstName || ''} ${user?.lastName || ''}`}
            size={72}
          />
          <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: SPACING.md }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 4 }}>
            {user?.email}
          </Text>
          <View style={{
            marginTop: SPACING.md, backgroundColor: COLORS.accent,
            paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full,
          }}>
            <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>
              {user?.role} · {user?.profile?.plan || 'STARTER'} PLAN
            </Text>
          </View>
        </View>

        <View style={{ padding: SPACING.lg, marginTop: -20 }}>
          {/* Stats row for planners */}
          {isPlanner && (
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
              {[
                { label: 'Events', value: '—' },
                { label: 'Attendees', value: '—' },
                { label: 'Revenue', value: '₦—' },
              ].map(s => (
                <Card key={s.label} style={{ flex: 1, alignItems: 'center', padding: SPACING.md }}>
                  <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.primary }}>{s.value}</Text>
                  <Text style={TYPOGRAPHY.caption}>{s.label}</Text>
                </Card>
              ))}
            </View>
          )}

          {/* Menu sections */}
          {MENU_ITEMS.map(section => (
            <View key={section.section} style={{ marginBottom: SPACING.lg }}>
              <Text style={{ ...TYPOGRAPHY.label, marginBottom: SPACING.sm }}>{section.section}</Text>
              <Card padding={0} style={{ overflow: 'hidden' }}>
                {section.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.onPress}
                    activeOpacity={item.right ? 1 : 0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.md,
                      padding: SPACING.md,
                      borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                      borderBottomColor: COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.emoji}</Text>
                    <Text style={{ flex: 1, fontSize: 15, color: COLORS.dark }}>{item.label}</Text>
                    {item.right || (item.onPress && (
                      <Text style={{ color: COLORS.muted, fontSize: 18 }}>›</Text>
                    ))}
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          ))}

          {/* Sign out */}
          <Button
            title="Sign Out"
            variant="secondary"
            fullWidth
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
              ]);
            }}
          />

          <Text style={{ ...TYPOGRAPHY.caption, textAlign: 'center', marginTop: SPACING.lg }}>
            owambe.com · Version 1.0.0 · Lagos, Nigeria 🇳🇬
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
