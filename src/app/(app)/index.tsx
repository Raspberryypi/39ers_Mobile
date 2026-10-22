import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartPanel } from '@/components/pos/CartPanel';
import { ChargeModal } from '@/components/pos/ChargeModal';
import { ModifierModal } from '@/components/pos/ModifierModal';
import { TicketPreviewModal } from '@/components/pos/TicketPreviewModal';
import { Button, Chip, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import { usePos, type SavedOrder } from '@/context/pos';
import { CATEGORIES, SAMPLE_MENU, type Product } from '@/data/sampleMenu';

const CART_WIDTH = 360;
const GAP = 10;
const PAD = 12;

export default function PosScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 720; // tablet / landscape: menu and cart side by side
  const menuWidth = wide ? width - CART_WIDTH : width;
  const cols = wide ? Math.max(2, Math.floor((menuWidth - PAD * 2) / 170)) : 2;
  const itemWidth = (menuWidth - PAD * 2 - GAP * (cols - 1)) / cols;

  const { addLine, cartCount, cartSubtotal } = usePos();
  const [category, setCategory] = useState<string>('All');
  const [picking, setPicking] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [charging, setCharging] = useState(false);
  const [paid, setPaid] = useState<SavedOrder | null>(null);

  const products =
    category === 'All' ? SAMPLE_MENU : SAMPLE_MENU.filter((p) => p.category === category);

  function onPick(p: Product) {
    if (p.groups?.length) setPicking(p);
    else addLine(p, []);
  }

  function startCharge() {
    setCartOpen(false);
    setCharging(true);
  }

  const menu = (
    <View style={styles.menu}>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cats}>
          {['All', ...CATEGORIES].map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        key={cols}
        data={products}
        numColumns={cols}
        keyExtractor={(p) => p.id}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            style={({ pressed }) => [styles.item, { width: itemWidth }, pressed && styles.itemPressed]}>
            <View
              style={[
                styles.dot,
                { backgroundColor: item.station === 'bar' ? brand.stationBar : brand.stationKitchen },
              ]}
            />
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>{peso(item.price)}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Text style={styles.sample}>Sample menu for the draft. Real items and prices come next.</Text>
        }
      />
    </View>
  );

  return (
    <View style={styles.root}>
      {wide ? (
        <View style={styles.row}>
          {menu}
          <View style={styles.cartPane}>
            <CartPanel onCharge={startCharge} />
          </View>
        </View>
      ) : (
        <>
          {menu}
          {cartCount > 0 && (
            <Pressable style={styles.cartBar} onPress={() => setCartOpen(true)}>
              <Text style={styles.cartBarText}>
                🛒 View order · {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.cartBarText}>{peso(cartSubtotal)}</Text>
            </Pressable>
          )}
        </>
      )}

      {/* Phone: full-screen cart */}
      <Modal visible={cartOpen} animationType="slide" onRequestClose={() => setCartOpen(false)}>
        <SafeAreaView style={styles.cartModal}>
          <CartPanel onCharge={startCharge} />
          <View style={styles.cartModalFooter}>
            <Button title="Keep adding items" variant="outline" onPress={() => setCartOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>

      {picking && (
        <ModifierModal
          key={picking.id}
          product={picking}
          onClose={() => setPicking(null)}
          onAdd={(mods, note) => {
            addLine(picking, mods, note);
            setPicking(null);
          }}
        />
      )}

      {charging && (
        <ChargeModal
          onClose={() => setCharging(false)}
          onPaid={(order) => {
            setCharging(false);
            setPaid(order);
          }}
        />
      )}

      {paid && <TicketPreviewModal order={paid} onClose={() => setPaid(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.background },
  row: { flex: 1, flexDirection: 'row' },
  menu: { flex: 1 },
  cats: { gap: 8, padding: PAD },
  grid: { padding: PAD, paddingTop: 0, gap: GAP, paddingBottom: 90 },
  item: {
    minHeight: 110,
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  itemPressed: { backgroundColor: brand.brown100 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { fontSize: 16, fontWeight: '700', color: brand.textPrimary, marginTop: 6 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: brand.brown600, marginTop: 6 },
  sample: { textAlign: 'center', color: brand.textMuted, fontSize: 12, marginTop: 8 },
  cartPane: {
    width: CART_WIDTH,
    borderLeftWidth: 1,
    borderLeftColor: brand.border,
  },
  cartBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: brand.brown800,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartBarText: { color: brand.white, fontSize: 16, fontWeight: '800' },
  cartModal: { flex: 1, backgroundColor: brand.surface },
  cartModalFooter: { padding: 16 },
});
