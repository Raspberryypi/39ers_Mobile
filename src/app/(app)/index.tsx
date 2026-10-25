import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartPanel } from '@/components/pos/CartPanel';
import { ChargeModal } from '@/components/pos/ChargeModal';
import { ModifierModal } from '@/components/pos/ModifierModal';
import { TicketPreviewModal } from '@/components/pos/TicketPreviewModal';
import { Button, Chip, EmptyState, ScreenHeader, emojiFor, peso } from '@/components/ui';
import { Radius, brand, displayText } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useMenu, type MenuProduct } from '@/context/menu';
import { usePos, type SavedOrder } from '@/context/pos';

const CART_WIDTH = 392;
const GAP = 12;
const PAD = 16;
const TILE_MIN = 168;

export default function PosScreen() {
  // Measure the space this screen really gets (the side rail takes some on tablets and browsers).
  const { width: windowWidth } = useWindowDimensions();
  const [availWidth, setAvailWidth] = useState(0);
  const width = availWidth || windowWidth;
  const wide = width >= 680; // menu and ticket side by side
  const menuWidth = wide ? width - CART_WIDTH : width;
  const cols = Math.max(2, Math.floor((menuWidth - PAD * 2 + GAP) / (TILE_MIN + GAP)));
  const itemWidth = Math.floor((menuWidth - PAD * 2 - GAP * (cols - 1)) / cols);

  const { addLine, cartCount, cartSubtotal } = usePos();
  const { products: allProducts, categories, loading: menuLoading, error: menuError } = useMenu();
  const { can, branch } = useAuth();

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState<MenuProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [charging, setCharging] = useState(false);
  const [paid, setPaid] = useState<SavedOrder | null>(null);

  const sellable = allProducts.filter((p) => p.active);
  const q = query.trim().toLowerCase();
  const products = sellable.filter(
    (p) => (category === 'All' || p.category === category) && (q === '' || p.name.toLowerCase().includes(q)),
  );

  function onPick(p: MenuProduct) {
    if (p.groups?.length) setPicking(p);
    else addLine(p, []);
  }

  function startCharge() {
    setCartOpen(false);
    setCharging(true);
  }

  const emptyMessage = menuError
    ? { emoji: '⚠️', title: 'Could not load the menu', text: menuError }
    : menuLoading
      ? { emoji: '⏳', title: 'Loading the menu', text: 'Just a moment.' }
      : sellable.length === 0
        ? {
            emoji: '🍽️',
            title: 'The menu is empty',
            text: can('menu.manage')
              ? 'Open the Menu tab and tap “Add item” to create your first one.'
              : 'Ask the owner or admin to add menu items.',
          }
        : { emoji: '🔍', title: 'Nothing matches', text: 'Try a different word or category.' };

  const menu = (
    <View style={styles.menu}>
      <View style={styles.tools}>
        <View style={styles.search}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search the menu"
            placeholderTextColor={brand.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {query !== '' && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          <Chip label="All" selected={category === 'All'} count={sellable.length} onPress={() => setCategory('All')} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={category === c.name}
              count={sellable.filter((p) => p.category === c.name).length}
              onPress={() => setCategory(c.name)}
            />
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
        ListEmptyComponent={<EmptyState {...emptyMessage} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name}`}
            style={({ pressed }) => [styles.tile, { width: itemWidth }, pressed && styles.tilePressed]}>
            <View
              style={[
                styles.art,
                { backgroundColor: item.station === 'bar' ? brand.barSoft : brand.kitchenSoft },
              ]}>
              <Text style={styles.artEmoji}>{emojiFor(item.name, item.category)}</Text>
            </View>
            <Text style={styles.tileName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.tileFoot}>
              <Text style={[displayText(22), styles.tilePrice]}>{peso(item.price)}</Text>
              <View style={styles.plus}>
                <Text style={styles.plusText}>+</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );

  return (
    <View style={styles.root} onLayout={(e) => setAvailWidth(e.nativeEvent.layout.width)}>
      {!wide && <ScreenHeader title="Point of sale" subtitle={branch?.name} />}

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
            <Pressable style={styles.cartBar} onPress={() => setCartOpen(true)} accessibilityRole="button">
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartBarText}>View order</Text>
              <Text style={[displayText(24, 'extrabold'), styles.cartBarTotal]}>{peso(cartSubtotal)}</Text>
            </Pressable>
          )}
        </>
      )}

      {/* Phone: full-screen ticket */}
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

  tools: { paddingTop: 16, gap: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: PAD,
    paddingHorizontal: 16,
    minHeight: 50,
    borderRadius: Radius.pill,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, color: brand.textPrimary, paddingVertical: 10 },
  searchClear: { fontSize: 14, color: brand.textMuted, fontWeight: '800' },
  cats: { gap: 8, paddingHorizontal: PAD },

  grid: { padding: PAD, gap: GAP, paddingBottom: 110 },
  tile: {
    backgroundColor: brand.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 12,
    gap: 10,
  },
  tilePressed: { transform: [{ scale: 0.97 }], borderColor: brand.brown300 },
  art: { height: 84, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  artEmoji: { fontSize: 44 },
  tileName: { fontSize: 16, fontWeight: '800', color: brand.textPrimary, minHeight: 40 },
  tileFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tilePrice: { color: brand.brown800 },
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { fontSize: 22, fontWeight: '800', color: brand.onAccent, lineHeight: 26 },

  cartPane: { width: CART_WIDTH },
  cartBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: brand.brown800,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: brand.brown700,
  },
  cartBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 8,
    backgroundColor: brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: brand.onAccent, fontWeight: '800', fontSize: 15 },
  cartBarText: { flex: 1, color: brand.white, fontSize: 16, fontWeight: '800' },
  cartBarTotal: { color: brand.white },

  cartModal: { flex: 1, backgroundColor: brand.background },
  cartModalFooter: { padding: 16, paddingTop: 0 },
});
