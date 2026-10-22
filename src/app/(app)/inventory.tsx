import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { brand } from '@/constants/theme';

// SAMPLE DATA: placeholder rows to show the intended layout. Real stock comes from the
// `stock_movements` ledger (see supabase/migrations/001_schema.sql).
const SAMPLE_STOCK = [
  { name: 'Tapioca pearls', onHand: '1.2 kg', low: true },
  { name: 'Milk (fresh)', onHand: '8 L', low: false },
  { name: 'Coffee beans', onHand: '2.5 kg', low: false },
  { name: 'Cups 16oz', onHand: '60 pcs', low: true },
  { name: 'Potatoes', onHand: '12 kg', low: false },
];

const PLANNED = [
  'Ingredients and units, with reorder levels',
  'Recipes: every sale automatically deducts ingredients',
  'Stock-in from deliveries, wastage, and stock counts',
  'Transfers between branches',
  'Low-stock alerts',
];

export default function InventoryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Inventory is built in Phase 3</Text>
        {PLANNED.map((p) => (
          <Text key={p} style={styles.bullet}>
            • {p}
          </Text>
        ))}
      </Card>

      <Card>
        <Text style={styles.title}>Preview (sample data)</Text>
        {SAMPLE_STOCK.map((s) => (
          <View key={s.name} style={styles.row}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.qty}>{s.onHand}</Text>
            {s.low ? <Text style={styles.low}>LOW</Text> : <View style={styles.spacer} />}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: brand.textPrimary, marginBottom: 10 },
  bullet: { fontSize: 15, color: brand.textSecondary, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: brand.textPrimary },
  qty: { fontSize: 15, color: brand.textSecondary },
  low: {
    fontSize: 11,
    fontWeight: '800',
    color: brand.danger,
    backgroundColor: '#FBE6E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    width: 46,
    textAlign: 'center',
  },
  spacer: { width: 46 },
});
