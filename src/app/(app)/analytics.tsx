import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePos } from '@/context/pos';

/** Draft analytics: computed live from orders placed in this session. Real data comes from Supabase views. */
export default function AnalyticsScreen() {
  const { orders } = usePos();
  const { branch, branches, user } = useAuth();
  const [today] = useState(() => new Date());

  const paid = orders.filter((o) => o.status === 'paid');
  const mine = paid.filter(
    (o) => o.branchId === branch?.id && o.createdAt.toDateString() === today.toDateString(),
  );

  const sales = mine.reduce((sum, o) => sum + o.total, 0);
  const average = mine.length ? sales / mine.length : 0;

  const byItem = new Map<string, { qty: number; revenue: number }>();
  for (const o of mine) {
    for (const i of o.items) {
      const cur = byItem.get(i.name) ?? { qty: 0, revenue: 0 };
      byItem.set(i.name, { qty: cur.qty + i.quantity, revenue: cur.revenue + i.lineTotal });
    }
  }
  const top = [...byItem.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Today · {branch?.name}</Text>

      <View style={styles.stats}>
        <Stat label="Sales" value={peso(sales)} />
        <Stat label="Orders" value={String(mine.length)} />
        <Stat label="Average order" value={peso(average)} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Best sellers today</Text>
        {top.length === 0 ? (
          <Text style={styles.muted}>No sales yet. Charge an order on the POS tab to see it here.</Text>
        ) : (
          top.map(([name, v], idx) => (
            <View key={name} style={styles.row}>
              <Text style={styles.rank}>{idx + 1}</Text>
              <Text style={styles.rowName}>{name}</Text>
              <Text style={styles.rowQty}>{v.qty} sold</Text>
              <Text style={styles.rowValue}>{peso(v.revenue)}</Text>
            </View>
          ))
        )}
      </Card>

      {user?.role === 'owner' && (
        <Card>
          <Text style={styles.cardTitle}>All branches · today</Text>
          {branches.map((b) => {
            const bo = paid.filter(
              (o) => o.branchId === b.id && o.createdAt.toDateString() === today.toDateString(),
            );
            return (
              <View key={b.id} style={styles.row}>
                <Text style={styles.rowName}>{b.name}</Text>
                <Text style={styles.rowQty}>{bo.length} orders</Text>
                <Text style={styles.rowValue}>{peso(bo.reduce((s, o) => s + o.total, 0))}</Text>
              </View>
            );
          })}
        </Card>
      )}

      <Text style={styles.footnote}>
        Draft data: resets when the app reloads. Charts, date ranges, margins and exports come in the analytics phase.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 20, fontWeight: '800', color: brand.brown800 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: brand.brown800,
    borderRadius: 16,
    padding: 14,
  },
  statLabel: { color: brand.brown300, fontSize: 13, fontWeight: '600' },
  statValue: { color: brand.white, fontSize: 20, fontWeight: '800', marginTop: 4 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: brand.textPrimary, marginBottom: 10 },
  muted: { color: brand.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rank: { width: 22, fontWeight: '800', color: brand.accentPressed },
  rowName: { flex: 1, fontSize: 15, color: brand.textPrimary, fontWeight: '600' },
  rowQty: { fontSize: 13, color: brand.textSecondary },
  rowValue: { fontSize: 15, fontWeight: '800', color: brand.textPrimary, minWidth: 80, textAlign: 'right' },
  footnote: { fontSize: 12, color: brand.textMuted, textAlign: 'center', marginTop: 4 },
});
