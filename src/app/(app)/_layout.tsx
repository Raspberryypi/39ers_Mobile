import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions } from 'react-native';

import { AppTabBar } from '@/components/nav/AppTabBar';
import { BREAKPOINT, brand } from '@/constants/theme';
import { useAuth } from '@/context/auth';

/**
 * The tab bar itself is drawn by AppTabBar (side rail on tablets / browsers, bottom bar on phones).
 * Which tabs exist depends on the signed-in role.
 */
export default function AppLayout() {
  const { can } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINT;

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: wide ? 'left' : 'bottom',
          sceneStyle: { backgroundColor: brand.background },
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="orders" />

        <Tabs.Protected guard={can('menu.manage')}>
          <Tabs.Screen name="menu" />
        </Tabs.Protected>

        <Tabs.Protected guard={can('inventory.manage')}>
          <Tabs.Screen name="inventory" />
        </Tabs.Protected>

        <Tabs.Protected guard={can('analytics.view')}>
          <Tabs.Screen name="analytics" />
        </Tabs.Protected>

        <Tabs.Screen name="settings" />
      </Tabs>
    </>
  );
}
