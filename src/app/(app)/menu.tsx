import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ProductEditor } from '@/components/menu/ProductEditor';
import { Button, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import { useMenu, type MenuProduct } from '@/context/menu';

/** Menu management for owner and admin: add items, change prices, hide items. */
export default function MenuScreen() {
  const { categories, products, loading, error, reload, setActive } = useMenu();
  // undefined = closed, null = adding a new item, otherwise the item being edited
  const [editing, setEditing] = useState<MenuProduct | null | undefined>(undefined);

  const sections = [
    ...categories.map((c) => ({ id: c.id, title: c.name, items: products.filter((p) => p.categoryId === c.id) })),
    { id: 'other', title: 'Other', items: products.filter((p) => !categories.some((c) => c.id === p.categoryId)) },
  ].filter((s) => s.items.length > 0);

  async function toggle(p: MenuProduct, value: boolean) {
    try {
      await setActive(p.id, value);
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={brand.brown800} />}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.title}>Menu</Text>
            <Text style={styles.sub}>{products.length} items · changes show on every device</Text>
          </View>
          <Button title="＋ Add item" variant="accent" onPress={() => setEditing(null)} />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Could not load the menu: {error}</Text>
            <Button title="Try again" variant="outline" onPress={reload} />
          </View>
        )}

        {!error && !loading && products.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No menu items yet</Text>
            <Text style={styles.emptyText}>Tap “Add item” to create your first one.</Text>
          </View>
        )}

        {sections.map((s) => (
          <View key={s.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.items.map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => setEditing(p)}>
                <View
                  style={[styles.dot, { backgroundColor: p.station === 'bar' ? brand.stationBar : brand.stationKitchen }]}
                />
                <View style={styles.flex}>
                  <Text style={[styles.name, !p.active && styles.hidden]}>{p.name}</Text>
                  <Text style={styles.meta}>
                    {peso(p.price)}
                    {p.groups && p.groups.length > 0 ? ` · ${p.groups.length} option group${p.groups.length > 1 ? 's' : ''}` : ''}
                    {!p.active ? ' · hidden' : ''}
                  </Text>
                </View>
                <Switch value={p.active} onValueChange={(v) => toggle(p, v)} trackColor={{ true: brand.brown600 }} />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      {editing !== undefined && (
        <ProductEditor key={editing?.id ?? 'new'} product={editing} onClose={() => setEditing(undefined)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.background },
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: brand.brown800 },
  sub: { fontSize: 13, color: brand.textSecondary },
  errorBox: { backgroundColor: '#FBE6E4', borderRadius: 14, padding: 14, gap: 10 },
  errorText: { color: brand.danger, fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: brand.textPrimary },
  emptyText: { fontSize: 14, color: brand.textSecondary },
  section: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    padding: 14,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 16, fontWeight: '700', color: brand.textPrimary },
  hidden: { color: brand.textMuted },
  meta: { fontSize: 13, color: brand.textSecondary, marginTop: 2 },
});
