import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/context/auth';
import { PosProvider } from '@/context/pos';

/**
 * Signed-out users only see /login; signed-in users only see the (app) tabs.
 * (Client-side guard. Real access control is enforced by Supabase RLS.)
 */
function RootNavigator() {
  const { user } = useAuth();

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
  return (
    <AuthProvider>
      <PosProvider>
        <RootNavigator />
      </PosProvider>
    </AuthProvider>
  );
}
