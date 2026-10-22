import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PaperPreview } from '@/components/PaperPreview';
import { Button, Card, Chip } from '@/components/ui';
import { brand } from '@/constants/theme';
import { BRANCHES, useAuth } from '@/context/auth';
import { usePos } from '@/context/pos';
import { ROLE_LABEL } from '@/lib/rbac';
import { buildTestPage, columnsFor, type PaperWidth, type TicketMode } from '@/printing/ticketBuilder';

const WIDTHS: PaperWidth[] = [58, 80];
const MODES: { value: TicketMode; label: string }[] = [
  { value: 'split_by_station', label: 'Separate bar / kitchen tickets' },
  { value: 'single_copy', label: 'One ticket for everything' },
];

export default function SettingsScreen() {
  const { user, branch, signOut, setBranch, can } = useAuth();
  const { settings, updateSettings, clearCart } = usePos();

  function logout() {
    clearCart();
    signOut();
    router.replace('/login');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.line}>
          {user?.name} · {user ? ROLE_LABEL[user.role] : ''}
        </Text>
        <Text style={styles.line}>{branch?.name}</Text>
        {can('branches.switch') && (
          <>
            <Text style={styles.label}>Switch branch (owner)</Text>
            <View style={styles.chips}>
              {BRANCHES.map((b) => (
                <Chip key={b.id} label={b.name} selected={b.id === branch?.id} onPress={() => setBranch(b)} />
              ))}
            </View>
          </>
        )}
      </Card>

      <Card>
        <Text style={styles.title}>Printer</Text>

        <Text style={styles.label}>Paper width</Text>
        <View style={styles.chips}>
          {WIDTHS.map((w) => (
            <Chip
              key={w}
              label={`${w}mm (${columnsFor(w)} characters)`}
              selected={settings.paperWidth === w}
              onPress={() => updateSettings({ paperWidth: w })}
            />
          ))}
        </View>

        <Text style={styles.label}>Prep tickets</Text>
        <View style={styles.chips}>
          {MODES.map((m) => (
            <Chip
              key={m.value}
              label={m.label}
              selected={settings.ticketMode === m.value}
              onPress={() => updateSettings({ ticketMode: m.value })}
            />
          ))}
        </View>

        <Text style={styles.label}>Test page preview</Text>
        <PaperPreview lines={buildTestPage(settings.paperWidth)} width={settings.paperWidth} />
        <Text style={styles.hint}>
          Once the printer is connected, the test page prints this ruler line. If the right edge is cut off,
          switch the paper width.
        </Text>

        <Button title="Connect Bluetooth printer" variant="outline" disabled onPress={() => {}} style={styles.connect} />
        <Text style={styles.hint}>Bluetooth printing needs the development build (next stage).</Text>
      </Card>

      <Button title="Sign out" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: brand.textPrimary, marginBottom: 6 },
  line: { fontSize: 15, color: brand.textSecondary, marginBottom: 2 },
  label: { fontSize: 14, fontWeight: '700', color: brand.textSecondary, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13, color: brand.textMuted, marginTop: 8 },
  connect: { marginTop: 16 },
});
