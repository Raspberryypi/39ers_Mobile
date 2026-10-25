import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { TicketPreviewModal } from '@/components/pos/TicketPreviewModal';
import { Button, Card, Chip, EmptyState, Page, Pill, ScreenHeader, peso, useGrid } from '@/components/ui';
import { brand, displayText } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePos, type SavedOrder } from '@/context/pos';
import { formatDateTime } from '@/printing/ticketBuilder';

type Filter = 'all' | 'paid' | 'voided';

export default function OrdersScreen() {
  const { orders, voidOrder, today } = usePos();
  const { branch, can } = useAuth();
  const [viewing, setViewing] = useState<SavedOrder | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const grid = useGrid(300, 14);

  const mine = orders.filter((o) => o.branchId === branch?.id);
  const list = mine.filter((o) => filter === 'all' || o.status === filter);

  function confirmVoid(o: SavedOrder) {
    Alert.alert('Void this order?', `Order #${o.queueNo} will be marked as void.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Void order', style: 'destructive', onPress: () => voidOrder(o.id) },
    ]);
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Orders" subtitle={branch?.name} />
      <Page>
        <View style={styles.stats}>
          <View style={[styles.stat, styles.statDark]}>
            <Text style={styles.statLabelOn}>Paid today</Text>
            <Text style={[displayText(36, 'extrabold'), styles.statNumOn]}>{today.count}</Text>
          </View>
          <View style={[styles.stat, styles.statSoft]}>
            <Text style={styles.statLabel}>Sales today</Text>
            <Text style={[displayText(36, 'extrabold'), styles.statNum]}>{peso(today.sales)}</Text>
          </View>
        </View>

        <View style={styles.filters}>
          <Chip label="All" selected={filter === 'all'} count={mine.length} onPress={() => setFilter('all')} />
          <Chip
            label="Paid"
            selected={filter === 'paid'}
            count={mine.filter((o) => o.status === 'paid').length}
            onPress={() => setFilter('paid')}
          />
          <Chip
            label="Void"
            selected={filter === 'voided'}
            count={mine.filter((o) => o.status === 'voided').length}
            onPress={() => setFilter('voided')}
          />
        </View>

        {list.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title={mine.length === 0 ? 'No orders yet' : 'Nothing here'}
            text={
              mine.length === 0
                ? 'Orders you charge on the POS tab show up here.'
                : 'No orders match this filter.'
            }
          />
        ) : (
          <View style={styles.grid} onLayout={grid.onLayout}>
            {grid.ready &&
              list.map((o) => {
                const voided = o.status === 'voided';
                const summary =
                  o.items
                    .slice(0, 2)
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(', ') + (o.items.length > 2 ? ` and ${o.items.length - 2} more` : '');
                return (
                  <Card key={o.id} style={[styles.order, { width: grid.itemWidth }]}>
                    <View style={styles.top}>
                      <Text style={[displayText(34, 'extrabold'), styles.queue]}>#{o.queueNo}</Text>
                      <Pill label={voided ? 'Void' : 'Paid'} tone={voided ? 'bad' : 'good'} />
                    </View>
                    <Text style={styles.summary} numberOfLines={2}>
                      {summary}
                    </Text>
                    <View style={styles.tags}>
                      <Pill label={o.orderType === 'dine_in' ? 'Dine in' : 'Take out'} />
                      <Pill label={o.payment.method} />
                    </View>
                    <Text style={styles.meta}>
                      {formatDateTime(o.createdAt)} by {o.cashierName}
                    </Text>
                    <View style={styles.bottom}>
                      <Text style={[displayText(26, 'extrabold'), styles.total, voided && styles.strike]}>
                        {peso(o.total)}
                      </Text>
                      <View style={styles.actions}>
                        <Button title="Tickets" variant="soft" style={styles.act} onPress={() => setViewing(o)} />
                        {can('orders.void') && !voided && (
                          <Button title="Void" variant="danger" style={styles.act} onPress={() => confirmVoid(o)} />
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
          </View>
        )}
      </Page>
      {viewing && <TicketPreviewModal order={viewing} onClose={() => setViewing(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.background },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 24, padding: 18, gap: 2 },
  statDark: { backgroundColor: brand.brown800 },
  statSoft: { backgroundColor: brand.accentSoft },
  statLabelOn: { fontSize: 14, color: brand.brown300, fontWeight: '700' },
  statLabel: { fontSize: 14, color: brand.accentText, fontWeight: '700' },
  statNumOn: { color: brand.white },
  statNum: { color: brand.brown800 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  order: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  queue: { color: brand.brown800 },
  summary: { fontSize: 15, color: brand.textPrimary, fontWeight: '600', minHeight: 40 },
  tags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: brand.textMuted },
  bottom: { gap: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: brand.border },
  total: { color: brand.textPrimary, marginTop: 8 },
  strike: { textDecorationLine: 'line-through', color: brand.textMuted },
  actions: { flexDirection: 'row', gap: 10 },
  act: { flex: 1 },
});
