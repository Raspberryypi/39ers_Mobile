import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { PaperPreview } from '@/components/PaperPreview';
import { Button, Chip, Sheet } from '@/components/ui';
import { brand } from '@/constants/theme';
import { toTicketOrder, usePos, type SavedOrder } from '@/context/pos';
import { buildCustomerReceipt, buildPrepTickets } from '@/printing/ticketBuilder';

/**
 * Shows what will print: the bar / kitchen prep tickets the cashier carries over,
 * or the customer receipt. Real Bluetooth printing is added in the next stage.
 */
export function TicketPreviewModal({
  order,
  onClose,
}: {
  order: SavedOrder;
  onClose: () => void;
}) {
  const { settings } = usePos();
  const [tab, setTab] = useState<'prep' | 'receipt'>('prep');

  const ticketOrder = toTicketOrder(order);
  const tickets = buildPrepTickets(ticketOrder, settings.paperWidth, settings.ticketMode);
  const receipt = buildCustomerReceipt(ticketOrder, settings.paperWidth);
  const pages = tab === 'prep' ? tickets : [receipt];
  const names = tickets.map((t) => t[0]?.text ?? '').join(' + ');

  return (
    <Sheet
      title={`Order #${order.queueNo}`}
      onClose={onClose}
      footer={
        <>
          <Button
            title="Print"
            variant="outline"
            style={styles.flex}
            onPress={() =>
              Alert.alert(
                'Printer not connected yet',
                'Bluetooth printing is added in the next stage. For now this is a preview of what will print.',
              )
            }
          />
          <Button title="Done" variant="accent" style={styles.flex} onPress={onClose} />
        </>
      }>
      <View style={styles.tabs}>
        <Chip label="Prep tickets" selected={tab === 'prep'} onPress={() => setTab('prep')} />
        <Chip label="Customer receipt" selected={tab === 'receipt'} onPress={() => setTab('receipt')} />
      </View>

      <Text style={styles.info}>
        {tab === 'prep'
          ? `${tickets.length} ticket${tickets.length === 1 ? '' : 's'} to carry: ${names}`
          : 'Itemized receipt for the customer (not an official invoice).'}
      </Text>

      {pages.map((lines, i) => (
        <View key={i} style={styles.page}>
          <PaperPreview lines={lines} width={settings.paperWidth} />
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  info: { fontSize: 14, color: brand.textSecondary, marginBottom: 12 },
  page: { marginBottom: 16, backgroundColor: brand.surfaceAlt, borderRadius: 12, padding: 12 },
});
