import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, Sheet, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import { usePos, type OrderType, type PaymentMethod, type SavedOrder } from '@/context/pos';

const METHODS: PaymentMethod[] = ['Cash', 'GCash', 'Maya', 'Other'];

/** Payment is recorded manually: the cashier confirms the customer has paid. */
export function ChargeModal({
  onClose,
  onPaid,
}: {
  onClose: () => void;
  onPaid: (order: SavedOrder) => void;
}) {
  const { cartSubtotal: total, checkout } = usePos();
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [tendered, setTendered] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const isCash = method === 'Cash';
  const tenderedNum = isCash ? Number.parseFloat(tendered) || 0 : total;
  const change = Math.max(0, tenderedNum - total);
  const canConfirm = total > 0 && (!isCash || tenderedNum >= total);
  const quick = [total, ...[50, 100, 200, 500, 1000].filter((v) => v > total)].slice(0, 4);

  function confirm() {
    const order = checkout({
      orderType,
      note: note.trim() || undefined,
      method,
      tendered: tenderedNum,
      reference: reference.trim() || undefined,
    });
    if (order) onPaid(order);
  }

  return (
    <Sheet
      title="Charge"
      onClose={onClose}
      footer={
        <>
          <Button title="Back" variant="outline" onPress={onClose} style={styles.flex} />
          <Button
            title="Confirm payment"
            variant="accent"
            disabled={!canConfirm}
            onPress={confirm}
            style={styles.flex2}
          />
        </>
      }>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Amount due</Text>
        <Text style={styles.totalValue}>{peso(total)}</Text>
      </View>

      <Text style={styles.label}>Order type</Text>
      <View style={styles.chips}>
        <Chip label="Dine in" selected={orderType === 'dine_in'} onPress={() => setOrderType('dine_in')} />
        <Chip label="Take out" selected={orderType === 'take_out'} onPress={() => setOrderType('take_out')} />
      </View>

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.chips}>
        {METHODS.map((m) => (
          <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />
        ))}
      </View>

      {isCash ? (
        <>
          <Text style={styles.label}>Cash received</Text>
          <TextInput
            value={tendered}
            onChangeText={setTendered}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={brand.textMuted}
            style={styles.input}
          />
          <View style={[styles.chips, styles.quick]}>
            {quick.map((v) => (
              <Chip
                key={v}
                label={v === total ? 'Exact' : peso(v)}
                onPress={() => setTendered(String(v))}
              />
            ))}
          </View>
          <View style={styles.changeRow}>
            <Text style={styles.changeLabel}>Change</Text>
            <Text style={styles.changeValue}>{peso(change)}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Reference no. (optional)</Text>
          <TextInput
            value={reference}
            onChangeText={setReference}
            placeholder="From the customer's payment screen"
            placeholderTextColor={brand.textMuted}
            style={styles.input}
          />
          <Text style={styles.hint}>
            Confirm only after you see the payment on your phone. Payments are recorded manually for now.
          </Text>
        </>
      )}

      <Text style={styles.label}>Order note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. pack separately"
        placeholderTextColor={brand.textMuted}
        style={styles.input}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  totalBox: {
    backgroundColor: brand.brown100,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 14, color: brand.textSecondary },
  totalValue: { fontSize: 34, fontWeight: '800', color: brand.brown800 },
  label: { fontSize: 14, fontWeight: '700', color: brand.textSecondary, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quick: { marginTop: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: brand.textPrimary,
    backgroundColor: brand.background,
  },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  changeLabel: { fontSize: 16, color: brand.textSecondary },
  changeValue: { fontSize: 20, fontWeight: '800', color: brand.success },
  hint: { fontSize: 13, color: brand.textMuted, marginTop: 10 },
});
