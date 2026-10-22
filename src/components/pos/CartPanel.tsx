import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import { lineUnitPrice, usePos } from '@/context/pos';

/** The running order: items, quantities, total and the Charge button. */
export function CartPanel({ onCharge }: { onCharge: () => void }) {
  const { cart, cartSubtotal, cartCount, changeQty, removeLine, clearCart } = usePos();

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Current order</Text>
        {cart.length > 0 && (
          <Pressable onPress={clearCart} hitSlop={10}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧋</Text>
          <Text style={styles.emptyText}>Tap an item to start an order</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {cart.map((l) => (
            <View key={l.key} style={styles.line}>
              <View style={styles.lineInfo}>
                <Text style={styles.name}>{l.product.name}</Text>
                {l.modifiers.length > 0 && (
                  <Text style={styles.mods}>{l.modifiers.map((m) => m.name).join(', ')}</Text>
                )}
                {l.note ? <Text style={styles.mods}>Note: {l.note}</Text> : null}
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => changeQty(l.key, -1)}
                    accessibilityLabel="Decrease quantity">
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{l.qty}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => changeQty(l.key, 1)}
                    accessibilityLabel="Increase quantity">
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                  <Pressable onPress={() => removeLine(l.key)} hitSlop={8}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.price}>{peso(lineUnitPrice(l) * l.qty)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </Text>
          <Text style={styles.totalValue}>{peso(cartSubtotal)}</Text>
        </View>
        <Button
          title={cart.length === 0 ? 'Charge' : `Charge ${peso(cartSubtotal)}`}
          variant="accent"
          disabled={cart.length === 0}
          onPress={onCharge}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: brand.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: brand.textPrimary },
  clear: { fontSize: 15, fontWeight: '700', color: brand.danger },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: brand.textMuted },
  list: { flex: 1 },
  line: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  lineInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: brand.textPrimary },
  mods: { fontSize: 13, color: brand.textSecondary },
  price: { fontSize: 16, fontWeight: '700', color: brand.textPrimary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: brand.brown300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, fontWeight: '700', color: brand.brown800, lineHeight: 26 },
  qty: { fontSize: 18, fontWeight: '800', minWidth: 22, textAlign: 'center', color: brand.textPrimary },
  remove: { fontSize: 13, color: brand.danger, marginLeft: 6 },
  footer: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: brand.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 15, color: brand.textSecondary },
  totalValue: { fontSize: 24, fontWeight: '800', color: brand.textPrimary },
});
