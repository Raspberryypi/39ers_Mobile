import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Logo, TextField } from '@/components/ui';
import { Radius, brand, displayText } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const { user, signIn, configured, accountError } = useAuth();
  const { width } = useWindowDimensions();
  const split = width >= 900; // tablet / desktop: brand panel beside the form

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/" />;

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    const message = await signIn(email, password);
    setBusy(false);
    if (message) setError(message);
  }

  const form = (
    <View style={styles.form}>
      <Text style={[displayText(34, 'extrabold'), styles.heading]}>Welcome back</Text>
      <Text style={styles.sub}>Sign in with your staff account to start taking orders.</Text>

      {!configured && (
        <Card style={styles.warn}>
          <Text style={styles.warnTitle}>Not connected to the database yet</Text>
          <Text style={styles.warnText}>
            Paste your Supabase publishable key into .env.local in the 39ers_mobile folder, then restart with
            npx expo start -c.
          </Text>
        </Card>
      )}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
        style={styles.gap}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete="password"
        placeholder="Your password"
        onSubmitEditing={submit}
        style={styles.gap}
      />

      {error ?? accountError ? <Text style={styles.error}>{error ?? accountError}</Text> : null}

      <Button
        title={busy ? 'Signing in…' : 'Sign in'}
        variant="accent"
        size="lg"
        disabled={busy || !configured}
        onPress={submit}
        style={styles.signIn}
      />
      <Text style={styles.help}>Forgot your password? Ask the owner to reset it.</Text>
    </View>
  );

  if (split) {
    return (
      <View style={styles.splitRoot}>
        <StatusBar style="light" />
        <View style={styles.brandPanel}>
          <Logo size={176} />
          <Text style={[displayText(46, 'extrabold'), styles.heroTitle]}>Milktea, coffee{'\n'}and snacks.</Text>
          <Text style={styles.heroSub}>One place for orders, menu, and stock across every 39ers branch.</Text>
          <View style={styles.emojiRow}>
            {['🧋', '☕', '🍟'].map((e) => (
              <View key={e} style={styles.emojiBubble}>
                <Text style={styles.emoji}>{e}</Text>
              </View>
            ))}
          </View>
        </View>
        <ScrollView style={styles.formPanel} contentContainerStyle={styles.formPanelContent} keyboardShouldPersistTaps="handled">
          {form}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.phoneRoot}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.phoneTop}>
        <Logo size={104} />
        <Text style={[displayText(26, 'extrabold'), styles.phoneTitle]}>39ers Aklan POS</Text>
      </SafeAreaView>
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled">
        {form}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // tablet / desktop
  splitRoot: { flex: 1, flexDirection: 'row', backgroundColor: brand.surface },
  brandPanel: {
    flex: 1,
    backgroundColor: brand.brown800,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 64,
    gap: 20,
  },
  heroTitle: { color: brand.white, marginTop: 12 },
  heroSub: { fontSize: 18, color: brand.brown300, maxWidth: 420, lineHeight: 26 },
  emojiRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  emojiBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  formPanel: { flex: 1, backgroundColor: brand.background },
  formPanelContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },

  // phone
  phoneRoot: { flex: 1, backgroundColor: brand.brown800 },
  phoneTop: { alignItems: 'center', paddingTop: 20, paddingBottom: 28, gap: 10 },
  phoneTitle: { color: brand.white },
  sheet: {
    flex: 1,
    backgroundColor: brand.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  sheetContent: { flexGrow: 1, padding: 24, paddingBottom: 40 },

  // shared
  form: { width: '100%', maxWidth: 420 },
  heading: { color: brand.brown800 },
  sub: { fontSize: 15, color: brand.textSecondary, marginTop: 4, marginBottom: 20 },
  gap: { marginTop: 14 },
  warn: { backgroundColor: '#FFF4E0', borderColor: brand.warning, marginBottom: 6 },
  warnTitle: { fontSize: 15, fontWeight: '800', color: brand.textPrimary },
  warnText: { fontSize: 14, color: brand.textSecondary, marginTop: 4, lineHeight: 20 },
  error: { color: brand.danger, fontSize: 14, marginTop: 14 },
  signIn: { marginTop: 22 },
  help: { fontSize: 14, color: brand.textMuted, textAlign: 'center', marginTop: 18 },
});
