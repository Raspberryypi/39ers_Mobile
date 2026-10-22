import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { TicketPreviewModal } from '@/components/pos/TicketPreviewModal';
import { Button, Card, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePos, type SavedOrder } from '@/context/pos';
import { formatDateTime } from '@/printing/ticketBuilder';

export default function OrdersScreen() {
  const { orders, voidOrder } = usePos();
  const { branch, can } = useAuth();
  const [viewing, setViewing] = useState<SavedOrder | null>(null);

  const list = orders.filter((o) => o.branchId === branch?.id);

  function confirmVoid(o: SavedOrder) {
    Alert.alert('Void this order?', `Order #${o.queueNo} will be marked as void.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Void', style: 'destructive', onPress: () => voidOrder(o.id) },
    ]);
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={list}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet. Orders you charge on the POS tab appear here.</Text>
        }
        renderItem={({ item: o }) => {
          const count = o.items.reduce((n, i) => n + i.quantity, 0);
          const voided = o.status === 'voided';
          return (
            <Card style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.queue}>#{o.queueNo}</Text>
                <Text style={[styles.status, voided ? styles.voided : styles.paid]}>
                  {voided ? 'VOID' : 'PAID'}
                </Text>
              </View>
              <Text style={styles.meta}>
                {o.receiptNo} · {formatDateTime(o.createdAt)}
              </Text>
              <Text style={styles.meta}>
                {count} {count === 1 ? 'item' : 'items'} · {o.payment.method} ·{' '}
                {o.orderType === 'dine_in' ? 'Dine in' : 'Take out'} · {o.cashierName}
              </Text>
              <Text style={[styles.total, voided && styles.strike]}>{peso(o.total)}</Text>
              <View style={styles.actions}>
                <Button
                  title="Tickets / receipt"
                  variant="outline"
                  style={styles.action}
                  onPress={() => setViewing(o)}
                />
                {can('orders.void') && !voided && (
                  <Button title="Void" variant="danger" style={styles.action} onPress={() => confirmVoid(o)} />
                )}
              </View>
            </Card>
          );
        }}
      />
      {viewing && <TicketPreviewModal order={viewing} onClose={() => setViewing(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.background },
  list: { padding: 12, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  empty: { textAlign: 'center', color: brand.textMuted, marginTop: 48, fontSize: 15, paddingHorizontal: 24 },
  card: { gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queue: { fontSize: 24, fontWeight: '800', color: brand.brown800 },
  status: { fontSize: 12, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  paid: { color: brand.success, backgroundColor: '#E3F2E9' },
  voided: { color: brand.danger, backgroundColor: '#FBE6E4' },
  meta: { fontSize: 13, color: brand.textSecondary },
  total: { fontSize: 20, fontWeight: '800', color: brand.textPrimary, marginTop: 6 },
  strike: { textDecorationLine: 'line-through', color: brand.textMuted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: { flex: 1 },
});
