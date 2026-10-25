import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, peso } from '@/components/ui';
import { brand, displayText } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { lineUnitPrice, usePos } from '@/context/pos';

const NOTCH = 22;

/** The running order, drawn as a paper ticket: queue number on top, perforated edge, items below. */
export function CartPanel({ onCharge }: { onCharge: () => void }) {
  const { cart, cartSubtotal, cartCount, changeQty, removeLine, clearCart, today } = usePos();
  const { branch } = useAuth();

  return (
    <View style={styles.panel}>
      <View style={styles.ticket}>
        <View style={styles.top}>
          <View style={styles.flex}>
            <Text style={styles.topLabel}>Order number</Text>
            <Text style={[displayText(46, 'extrabold'), styles.queue]}>#{today.nextQueueNo}</Text>
          </View>
          {cart.length > 0 ? (
            <Pressable onPress={clearCart} style={styles.clearBtn} accessibilityLabel="Clear order">
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : (
            <Text style={styles.branchTag} numberOfLines={2}>
              {branch?.name}
            </Text>
          )}
        </View>

        <View style={styles.perf}>
          <View style={[styles.notch, { left: -NOTCH / 2 }]} />
          <View style={styles.dash} />
          <View style={[styles.notch, { right: -NOTCH / 2 }]} />
        </View>

        {cart.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyArt}>
              <Text style={styles.emptyEmoji}>🧋</Text>
            </View>
            <Text style={[displayText(24), styles.emptyTitle]}>Start an order</Text>
            <Text style={styles.emptyText}>Tap items on the menu to add them to this ticket.</Text>

            <View style={styles.todayBox}>
              <Text style={styles.todayLabel}>So far today</Text>
              <View style={styles.todayRow}>
                <View style={styles.todayCell}>
                  <Text style={[displayText(28, 'extrabold'), styles.todayNum]}>{today.count}</Text>
                  <Text style={styles.todayCap}>{today.count === 1 ? 'order' : 'orders'}</Text>
                </View>
                <View style={styles.todayCell}>
                  <Text style={[displayText(28, 'extrabold'), styles.todayNum]}>{peso(today.sales)}</Text>
                  <Text style={styles.todayCap}>in sales</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {cart.map((l) => (
              <View key={l.key} style={styles.line}>
                <View style={styles.flex}>
                  <Text style={styles.name}>{l.product.name}</Text>
                  {l.modifiers.length > 0 && (
                    <Text style={styles.mods}>{l.modifiers.map((m) => m.name).join(', ')}</Text>
                  )}
                  {l.note ? <Text style={styles.note}>Note: {l.note}</Text> : null}
                  <Pressable onPress={() => removeLine(l.key)} hitSlop={8}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
                <View style={styles.right}>
                  <Text style={[displayText(20), styles.price]}>{peso(lineUnitPrice(l) * l.qty)}</Text>
                  <View style={styles.stepper}>
                    <Pressable style={styles.stepBtn} onPress={() => changeQty(l.key, -1)} accessibilityLabel="Fewer">
                      <Text style={styles.stepText}>−</Text>
                    </Pressable>
                    <Text style={styles.qty}>{l.qty}</Text>
                    <Pressable style={styles.stepBtn} onPress={() => changeQty(l.key, 1)} accessibilityLabel="More">
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={[displayText(34, 'extrabold'), styles.total]}>{peso(cartSubtotal)}</Text>
          </View>
          <Button
            title={cart.length === 0 ? 'Charge' : `Charge ${peso(cartSubtotal)}`}
            variant="accent"
            size="lg"
            disabled={cart.length === 0}
            onPress={onCharge}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // The panel background matches the page, so the perforation notches look like cut-outs.
  panel: { flex: 1, backgroundColor: brand.background, padding: 12 },
  ticket: {
    flex: 1,
    backgroundColor: brand.surface,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brand.border,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: brand.brown800,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  topLabel: { fontSize: 13, color: brand.brown300, fontWeight: '700' },
  queue: { color: brand.white },
  branchTag: { maxWidth: 120, textAlign: 'right', fontSize: 13, color: brand.brown300, fontWeight: '600' },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  clearText: { color: brand.white, fontWeight: '800', fontSize: 14 },

  perf: { height: NOTCH, justifyContent: 'center', backgroundColor: brand.brown800 },
  dash: {
    marginHorizontal: NOTCH,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  notch: {
    position: 'absolute',
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: brand.background,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 6 },
  emptyArt: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: brand.brown100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { color: brand.brown800 },
  emptyText: { fontSize: 14, color: brand.textSecondary, textAlign: 'center', maxWidth: 240 },
  todayBox: {
    width: '100%',
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    backgroundColor: brand.accentSoft,
    gap: 8,
  },
  todayLabel: { fontSize: 13, fontWeight: '800', color: brand.accentText },
  todayRow: { flexDirection: 'row', gap: 12 },
  todayCell: { flex: 1 },
  todayNum: { color: brand.brown800 },
  todayCap: { fontSize: 13, color: brand.textSecondary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingVertical: 6 },
  line: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  name: { fontSize: 16, fontWeight: '800', color: brand.textPrimary },
  mods: { fontSize: 13, color: brand.textSecondary, marginTop: 2 },
  note: { fontSize: 13, color: brand.warning, marginTop: 2, fontWeight: '600' },
  remove: { fontSize: 13, color: brand.danger, fontWeight: '700', marginTop: 8 },
  right: { alignItems: 'flex-end', gap: 8 },
  price: { color: brand.brown800 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.surfaceAlt,
    borderRadius: 999,
    padding: 3,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, fontWeight: '800', color: brand.brown800, lineHeight: 24 },
  qty: { minWidth: 26, textAlign: 'center', fontSize: 16, fontWeight: '800', color: brand.textPrimary },

  footer: { padding: 20, gap: 14, borderTopWidth: 1, borderTopColor: brand.border },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, color: brand.textSecondary, fontWeight: '600' },
  total: { color: brand.brown800 },
});
