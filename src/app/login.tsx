import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Logo } from '@/components/ui';
import { brand } from '@/constants/theme';
import { BRANCHES, DEMO_USERS, useAuth, type Branch, type User } from '@/context/auth';
import { ROLE_LABEL, type Role } from '@/lib/rbac';

const ROLE_BLURB: Record<Role, string> = {
  owner: 'All branches, analytics, inventory and users',
  admin: 'Branch menu, inventory and reports',
  staff: 'POS and orders only',
};

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [branch, setBranch] = useState<Branch>(BRANCHES[0]);
  const [user, setUser] = useState<User>(DEMO_USERS[2]);

  function enter() {
    signIn(user, branch);
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Logo size={140} />
        <Text style={styles.title}>39ers Aklan POS</Text>
        <Text style={styles.sub}>
          Demo sign-in. Pick a branch and a role to preview what each role can see.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.label}>Branch</Text>
          <View style={styles.chips}>
            {BRANCHES.map((b) => (
              <Chip key={b.id} label={b.name} selected={b.id === branch.id} onPress={() => setBranch(b)} />
            ))}
          </View>

          <Text style={[styles.label, styles.gap]}>Role</Text>
          {DEMO_USERS.map((u) => {
            const selected = u.id === user.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => setUser(u)}
                style={[styles.role, selected && styles.roleSelected]}>
                <Text style={[styles.roleName, selected && styles.roleNameSelected]}>
                  {ROLE_LABEL[u.role]}
                </Text>
                <Text style={[styles.roleBlurb, selected && styles.roleBlurbSelected]}>
                  {ROLE_BLURB[u.role]}
                </Text>
              </Pressable>
            );
          })}
        </Card>

        <Button title="Sign in" variant="accent" onPress={enter} style={styles.signIn} />
        <Text style={styles.note}>Real accounts and PINs come with the Supabase connection.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.background },
  content: { alignItems: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: brand.brown800, marginTop: 8 },
  sub: { fontSize: 15, color: brand.textSecondary, textAlign: 'center', maxWidth: 420 },
  card: { width: '100%', maxWidth: 480, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '700', color: brand.textSecondary, marginBottom: 8 },
  gap: { marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  role: {
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: brand.surface,
  },
  roleSelected: { backgroundColor: brand.brown800, borderColor: brand.brown800 },
  roleName: { fontSize: 17, fontWeight: '800', color: brand.textPrimary },
  roleNameSelected: { color: brand.white },
  roleBlurb: { fontSize: 14, color: brand.textSecondary, marginTop: 2 },
  roleBlurbSelected: { color: brand.brown100 },
  signIn: { width: '100%', maxWidth: 480, marginTop: 4 },
  note: { fontSize: 13, color: brand.textMuted, textAlign: 'center' },
});
