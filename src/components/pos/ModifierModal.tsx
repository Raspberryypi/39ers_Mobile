import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, Sheet, peso } from '@/components/ui';
import { brand } from '@/constants/theme';
import type { ModifierGroup, ModifierOption, Product } from '@/data/sampleMenu';

/** Popup for choosing size, sugar level and add-ons before a drink or snack is added. */
export function ModifierModal({
  product,
  onAdd,
  onClose,
}: {
  product: Product;
  onAdd: (modifiers: ModifierOption[], note?: string) => void;
  onClose: () => void;
}) {
  const groups = product.groups ?? [];

  // Single-choice groups start on their first option; add-on groups start empty.
  const [picked, setPicked] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map((g) => [g.name, g.multi ? [] : [g.options[0].name]])),
  );
  const [note, setNote] = useState('');

  const chosen = groups.flatMap((g) => g.options.filter((o) => picked[g.name]?.includes(o.name)));
  const price = product.price + chosen.reduce((sum, o) => sum + o.delta, 0);

  function toggle(group: ModifierGroup, option: ModifierOption) {
    setPicked((prev) => {
      const current = prev[group.name] ?? [];
      if (!group.multi) return { ...prev, [group.name]: [option.name] };
      return {
        ...prev,
        [group.name]: current.includes(option.name)
          ? current.filter((n) => n !== option.name)
          : [...current, option.name],
      };
    });
  }

  return (
    <Sheet
      title={product.name}
      onClose={onClose}
      footer={
        <>
          <Button title="Cancel" variant="outline" onPress={onClose} style={styles.flex} />
          <Button
            title={`Add · ${peso(price)}`}
            variant="accent"
            onPress={() => onAdd(chosen, note)}
            style={styles.flex2}
          />
        </>
      }>
      {groups.map((g) => (
        <View key={g.name} style={styles.group}>
          <Text style={styles.label}>
            {g.name}
            {g.multi ? ' (optional)' : ''}
          </Text>
          <View style={styles.chips}>
            {g.options.map((o) => (
              <Chip
                key={o.name}
                label={o.delta ? `${o.name}  +₱${o.delta}` : o.name}
                selected={picked[g.name]?.includes(o.name)}
                onPress={() => toggle(g, o)}
              />
            ))}
          </View>
        </View>
      ))}
      <Text style={styles.label}>Note for the barista / kitchen</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. less ice, no onions"
        placeholderTextColor={brand.textMuted}
        style={styles.input}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  group: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: brand.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brand.textPrimary,
    backgroundColor: brand.background,
  },
});
