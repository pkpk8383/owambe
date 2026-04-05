import { Tabs, Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS } from '../../src/utils/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '500', color: focused ? COLORS.accent : COLORS.muted }}>
        {label}
      </Text>
    </View>
  );
}

export default function VendorTabsLayout() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;
  if (user?.role !== 'VENDOR') return <Redirect href="/(tabs)/" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: COLORS.dark,
        borderTopColor: 'rgba(255,255,255,0.1)',
        height: 82, paddingTop: 8,
      },
    }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Overview" focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Bookings" focused={focused} /> }} />
      <Tabs.Screen name="calendar" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Calendar" focused={focused} /> }} />
      <Tabs.Screen name="earnings" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Earnings" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙" label="Settings" focused={focused} /> }} />
    </Tabs>
  );
}
