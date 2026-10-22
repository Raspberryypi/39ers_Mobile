import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ROLE_LABEL } from '@/lib/rbac';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={styles.icon}>{emoji}</Text>;
}

/** Tabs a user can see depend on their role (staff: POS + Orders + Settings only). */
export default function AppLayout() {
  const { user, branch, can } = useAuth();

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: brand.brand },
          headerTintColor: brand.white,
          headerTitleStyle: { fontWeight: '800' },
          headerRight: () => (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user ? ROLE_LABEL[user.role] : ''}</Text>
            </View>
          ),
          tabBarActiveTintColor: brand.brown800,
          tabBarInactiveTintColor: brand.textMuted,
          tabBarLabelStyle: { fontWeight: '700', fontSize: 12 },
          tabBarStyle: { backgroundColor: brand.surface, borderTopColor: brand.border },
          sceneStyle: { backgroundColor: brand.background },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'POS',
            headerTitle: branch?.name ?? '39ers',
            tabBarIcon: () => <TabIcon emoji="☕" />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{ title: 'Orders', tabBarIcon: () => <TabIcon emoji="🧾" /> }}
        />

        <Tabs.Protected guard={can('inventory.manage')}>
          <Tabs.Screen
            name="inventory"
            options={{ title: 'Inventory', tabBarIcon: () => <TabIcon emoji="📦" /> }}
          />
        </Tabs.Protected>

        <Tabs.Protected guard={can('analytics.view')}>
          <Tabs.Screen
            name="analytics"
            options={{ title: 'Analytics', tabBarIcon: () => <TabIcon emoji="📊" /> }}
          />
        </Tabs.Protected>

        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarIcon: () => <TabIcon emoji="⚙️" /> }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 20 },
  badge: {
    backgroundColor: brand.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 14,
  },
  badgeText: { color: brand.onAccent, fontWeight: '800', fontSize: 12 },
});
