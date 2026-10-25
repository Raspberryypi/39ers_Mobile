import { BalooChettan2_600SemiBold } from '@expo-google-fonts/baloo-chettan-2/600SemiBold';
import { BalooChettan2_700Bold } from '@expo-google-fonts/baloo-chettan-2/700Bold';
import { BalooChettan2_800ExtraBold } from '@expo-google-fonts/baloo-chettan-2/800ExtraBold';
import { useFonts } from '@expo-google-fonts/baloo-chettan-2/useFonts';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { brand } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth';
import { MenuProvider } from '@/context/menu';
import { PosProvider } from '@/context/pos';

function Splash() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={brand.brown800} />
    </View>
  );
}

/**
 * Signed-out users only see /login; signed-in users only see the (app) tabs.
 * (Client-side guard. Real access control is enforced by Supabase RLS.)
 */
function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BalooChettan2_600SemiBold,
    BalooChettan2_700Bold,
    BalooChettan2_800ExtraBold,
  });

  // If the font fails to load, carry on with the system font rather than blocking the app.
  if (!fontsLoaded && !fontError) return <Splash />;

  return (
    <AuthProvider>
      <MenuProvider>
        <PosProvider>
          <RootNavigator />
        </PosProvider>
      </MenuProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.background },
});
