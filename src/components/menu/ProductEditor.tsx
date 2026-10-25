import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Chip, Sheet } from '@/components/ui';
import { brand } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useMenu, type MenuProduct } from '@/context/menu';
import type { ModifierGroup } from '@/data/sampleMenu';
import type { Station } from '@/printing/ticketBuilder';

// Text-field friendly versions of the option groups (prices are typed as text while editing).
interface OptionDraft {
  name: string;
  delta: string;
}
interface GroupDraft {
  name: string;
  multi: boolean;
  options: OptionDraft[];
}

const PRESETS: { label: string; group: GroupDraft }[] = [
  {
    label: '＋ Size',
    group: {
      name: 'Size',
      multi: false,
      options: [
        { name: 'Medium', delta: '0' },
        { name: 'Large', delta: '15' },
      ],
    },
  },
  {
    label: '＋ Sugar level',
    group: {
      name: 'Sugar level',
      multi: false,
      options: ['100%', '75%', '50%', '25%', '0%'].map((p) => ({ name: `${p} sugar`, delta: '0' })),
    },
  },
  {
    label: '＋ Add-ons',
    group: { name: 'Add-ons', multi: true, options: [{ name: '', delta: '' }] },
  },
];

const toDrafts = (groups: ModifierGroup[] | undefined): GroupDraft[] =>
  (groups ?? []).map((g) => ({
    name: g.name,
    multi: !!g.multi,
    options: g.options.map((o) => ({ name: o.name, delta: String(o.delta) })),
  }));

/** Add or edit a menu item, including its sizes / sugar levels / add-ons. Owner and admin only. */
export function ProductEditor({
  product,
  onClose,
}: {
  product: MenuProduct | null; // null = new item
  onClose: () => void;
}) {
  const { can } = useAuth();
  const { categories, saveProduct, addCategory } = useMenu();

  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [cost, setCost] = useState(product?.cost != null ? String(product.cost) : '');
  const [active, setActive] = useState(product?.active ?? true);
  const [groups, setGroups] = useState<GroupDraft[]>(() => toDrafts(product?.groups));
  const [saving, setSaving] = useState(false);

  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatStation, setNewCatStation] = useState<Station>('bar');

  const category = categories.find((c) => c.id === categoryId);

  // ---- option group editing ----
  const patchGroup = (gi: number, patch: Partial<GroupDraft>) =>
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const patchOption = (gi: number, oi: number, patch: Partial<OptionDraft>) =>
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g,
      ),
    );
  const removeGroup = (gi: number) => setGroups((prev) => prev.filter((_, i) => i !== gi));
  const removeOption = (gi: number, oi: number) =>
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g)),
    );
  const addOption = (gi: number) =>
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, options: [...g.options, { name: '', delta: '' }] } : g)),
    );

  async function createCategory() {
    if (!newCatName.trim()) return;
    try {
      const id = await addCategory(newCatName, newCatStation);
      setCategoryId(id);
      setNewCatName('');
      setNewCatOpen(false);
    } catch (e) {
      Alert.alert('Could not add category', e instanceof Error ? e.message : String(e));
    }
  }

  async function save() {
    const priceNum = Number.parseFloat(price);
    const costNum = cost.trim() === '' ? 0 : Number.parseFloat(cost);
    if (!name.trim()) return Alert.alert('Name needed', 'Type the item name.');
    if (!categoryId) return Alert.alert('Category needed', 'Pick a category (or add a new one).');
    if (!Number.isFinite(priceNum) || priceNum < 0) return Alert.alert('Price needed', 'Type the selling price.');
    if (!Number.isFinite(costNum) || costNum < 0) return Alert.alert('Check the cost', 'Cost must be a number.');

    const cleaned: ModifierGroup[] = [];
    for (const g of groups) {
      const options = g.options
        .filter((o) => o.name.trim() !== '')
        .map((o) => ({ name: o.name.trim(), delta: Number.parseFloat(o.delta) || 0 }));
      if (options.length === 0) continue; // ignore empty groups
      if (!g.name.trim()) return Alert.alert('Group name needed', 'Give each option group a name (e.g. Size).');
      cleaned.push({ name: g.name.trim(), multi: g.multi, options });
    }

    setSaving(true);
    try {
      await saveProduct({
        id: product?.id,
        name: name.trim(),
        categoryId,
        price: priceNum,
        cost: costNum,
        active,
        groups: cleaned,
      });
      onClose();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      title={product ? 'Edit item' : 'Add menu item'}
      onClose={onClose}
      footer={
        <>
          <Button title="Cancel" variant="outline" onPress={onClose} style={styles.flex} />
          <Button
            title={saving ? 'Saving…' : 'Save'}
            variant="accent"
            disabled={saving}
            onPress={save}
            style={styles.flex2}
          />
        </>
      }>
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Wintermelon Milktea"
        placeholderTextColor={brand.textMuted}
        style={styles.input}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} selected={c.id === categoryId} onPress={() => setCategoryId(c.id)} />
        ))}
        <Chip label="＋ New category" onPress={() => setNewCatOpen((v) => !v)} />
      </View>
      {category && (
        <Text style={styles.hint}>
          Prints on the {category.station === 'bar' ? 'BAR (drinks)' : 'KITCHEN (food)'} ticket.
        </Text>
      )}

      {newCatOpen && (
        <View style={styles.box}>
          <TextInput
            value={newCatName}
            onChangeText={setNewCatName}
            placeholder="Category name, e.g. Frappe"
            placeholderTextColor={brand.textMuted}
            style={styles.input}
          />
          <Text style={styles.sub}>Which ticket should these items print on?</Text>
          <View style={styles.chips}>
            <Chip label="Bar (drinks)" selected={newCatStation === 'bar'} onPress={() => setNewCatStation('bar')} />
            <Chip
              label="Kitchen (food)"
              selected={newCatStation === 'kitchen'}
              onPress={() => setNewCatStation('kitchen')}
            />
          </View>
          <Button title="Add category" variant="outline" onPress={createCategory} style={styles.mt} />
        </View>
      )}

      <View style={styles.row2}>
        <View style={styles.flex}>
          <Text style={styles.label}>Price (₱)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={brand.textMuted}
            style={styles.input}
          />
        </View>
        {can('costs.view') && (
          <View style={styles.flex}>
            <Text style={styles.label}>Cost (₱)</Text>
            <TextInput
              value={cost}
              onChangeText={setCost}
              keyboardType="decimal-pad"
              placeholder="optional"
              placeholderTextColor={brand.textMuted}
              style={styles.input}
            />
          </View>
        )}
      </View>
      {can('costs.view') && <Text style={styles.hint}>Cost is private. Cashiers never see it.</Text>}

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.switchTitle}>Available on the POS</Text>
          <Text style={styles.hint}>Turn off to hide it without deleting.</Text>
        </View>
        <Switch value={active} onValueChange={setActive} trackColor={{ true: brand.brown600 }} />
      </View>

      <Text style={[styles.label, styles.mtLg]}>Sizes, sugar levels, add-ons</Text>
      {groups.map((g, gi) => (
        <View key={gi} style={styles.box}>
          <View style={styles.groupHead}>
            <TextInput
              value={g.name}
              onChangeText={(t) => patchGroup(gi, { name: t })}
              placeholder="Group name, e.g. Size"
              placeholderTextColor={brand.textMuted}
              style={[styles.input, styles.flex]}
            />
            <Pressable onPress={() => removeGroup(gi)} hitSlop={8}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.sub}>Customer can pick more than one</Text>
            <Switch
              value={g.multi}
              onValueChange={(v) => patchGroup(gi, { multi: v })}
              trackColor={{ true: brand.brown600 }}
            />
          </View>
          {g.options.map((o, oi) => (
            <View key={oi} style={styles.optionRow}>
              <TextInput
                value={o.name}
                onChangeText={(t) => patchOption(gi, oi, { name: t })}
                placeholder="Option"
                placeholderTextColor={brand.textMuted}
                style={[styles.input, styles.flex2]}
              />
              <TextInput
                value={o.delta}
                onChangeText={(t) => patchOption(gi, oi, { delta: t })}
                keyboardType="decimal-pad"
                placeholder="+₱"
                placeholderTextColor={brand.textMuted}
                style={[styles.input, styles.flex]}
              />
              <Pressable onPress={() => removeOption(gi, oi)} hitSlop={8}>
                <Text style={styles.x}>✕</Text>
              </Pressable>
            </View>
          ))}
          <Pressable onPress={() => addOption(gi)}>
            <Text style={styles.link}>＋ Add option</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.chips}>
        {PRESETS.map((p) => (
          <Chip
            key={p.label}
            label={p.label}
            onPress={() =>
              setGroups((prev) => [...prev, { ...p.group, options: p.group.options.map((o) => ({ ...o })) }])
            }
          />
        ))}
        <Chip label="＋ Custom group" onPress={() => setGroups((prev) => [...prev, { name: '', multi: false, options: [{ name: '', delta: '' }] }])} />
      </View>
      <Text style={styles.hint}>The "+₱" is the extra price added when the option is chosen (leave blank for free).</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  label: { fontSize: 14, fontWeight: '700', color: brand.textSecondary, marginTop: 14, marginBottom: 8 },
  sub: { fontSize: 14, color: brand.textSecondary, marginVertical: 8 },
  hint: { fontSize: 13, color: brand.textMuted, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: brand.textPrimary,
    backgroundColor: brand.background,
  },
  box: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    backgroundColor: brand.surfaceAlt,
  },
  row2: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  switchTitle: { fontSize: 16, fontWeight: '700', color: brand.textPrimary },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  remove: { color: brand.danger, fontWeight: '700', fontSize: 14 },
  x: { color: brand.textMuted, fontSize: 18, paddingHorizontal: 4 },
  link: { color: brand.brown600, fontWeight: '800', fontSize: 15, marginTop: 12 },
  mt: { marginTop: 12 },
  mtLg: { marginTop: 24 },
});
