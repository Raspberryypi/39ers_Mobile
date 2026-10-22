/**
 * Ticket layout for the 39ers cashier printer.
 *
 * Pure functions only: no Bluetooth, no React. They turn an order into a list of
 * `Line`s. A separate renderer (escpos.ts) turns the lines into printer bytes,
 * and `renderPreview` turns them into plain text for on-screen preview/tests.
 *
 * Paper width: 58mm paper holds ~32 characters per line, 80mm holds ~48.
 * Many cheap Bluetooth printers are 58mm, but we let the owner pick and test.
 */

export type Station = 'bar' | 'kitchen';
export type PaperWidth = 58 | 80;
export type TicketMode = 'split_by_station' | 'single_copy';

export interface OrderItem {
  name: string;
  quantity: number;
  station: Station;
  modifiers?: string[];
  note?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  receiptNo: string;
  queueNo: string; // short daily number the cashier calls out, e.g. "014"
  branchName: string;
  cashierName: string;
  createdAt: Date;
  orderType?: 'dine_in' | 'take_out';
  note?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment?: { method: string; tendered?: number; change?: number };
}

export interface Line {
  text: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  /** 'double' doubles width and height, so it fits only half as many characters. */
  size?: 'normal' | 'double';
}

export const columnsFor = (width: PaperWidth): number => (width === 58 ? 32 : 48);

const STATION_LABEL: Record<Station, string> = { bar: 'BAR (DRINKS)', kitchen: 'KITCHEN (FOOD)' };

// ---------- helpers ----------
const pad2 = (n: number) => String(n).padStart(2, '0');

export function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Word-wrap to `cols` characters, hard-breaking words longer than a line. */
export function wrap(text: string, cols: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let word = raw;
    while (word.length > cols) {
      if (line) { out.push(line); line = ''; }
      out.push(word.slice(0, cols));
      word = word.slice(cols);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= cols) line += ' ' + word;
    else { out.push(line); line = word; }
  }
  if (line) out.push(line);
  return out;
}

/** "left ........ right" on one line; left text wraps if it does not fit. */
export function twoColumn(left: string, right: string, cols: number): string[] {
  const room = cols - right.length - 1;
  if (room < 4) return [...wrap(left, cols), right.padStart(cols)];
  const parts = wrap(left, room);
  const last = parts.pop() ?? '';
  return [...parts, last.padEnd(cols - right.length) + right];
}

const rule = (cols: number, ch = '-'): Line => ({ text: ch.repeat(cols) });

// ---------- prep tickets (no prices) ----------
const SECTION_LABEL: Record<Station, string> = { bar: 'DRINKS', kitchen: 'FOOD' };

function itemLines(items: OrderItem[], cols: number): Line[] {
  const L: Line[] = [];
  for (const it of items) {
    for (const [i, row] of wrap(`${it.quantity} x ${it.name}`, cols).entries()) {
      L.push({ text: i === 0 ? row : '  ' + row, bold: true });
    }
    if (it.modifiers?.length) for (const row of wrap(it.modifiers.join(', '), cols - 3)) L.push({ text: '   ' + row });
    if (it.note) for (const row of wrap('NOTE: ' + it.note, cols - 3)) L.push({ text: '   ' + row });
  }
  return L;
}

/**
 * `sections` = true groups the items under DRINKS / FOOD headings, used by the
 * combined ticket when an order has both.
 */
function prepTicket(
  order: Order,
  items: OrderItem[],
  title: string,
  cols: number,
  sections = false,
): Line[] {
  const L: Line[] = [];
  L.push({ text: title, align: 'center', bold: true, size: 'double' });
  L.push({ text: `#${order.queueNo}`, align: 'center', bold: true, size: 'double' });
  L.push(rule(cols));
  L.push({ text: order.branchName });
  L.push({ text: order.receiptNo });
  L.push({ text: formatDateTime(order.createdAt) });
  if (order.orderType) L.push({ text: order.orderType === 'dine_in' ? 'DINE IN' : 'TAKE OUT', bold: true });
  L.push(rule(cols));
  const present = (['bar', 'kitchen'] as Station[]).filter((s) => items.some((i) => i.station === s));
  if (sections && present.length > 1) {
    for (const s of present) {
      L.push({ text: `-- ${SECTION_LABEL[s]} --`, align: 'center', bold: true });
      L.push(...itemLines(items.filter((i) => i.station === s), cols));
    }
  } else {
    L.push(...itemLines(items, cols));
  }
  L.push(rule(cols));
  if (order.note) {
    for (const row of wrap('ORDER NOTE: ' + order.note, cols)) L.push({ text: row, bold: true });
    L.push(rule(cols));
  }
  L.push({ text: `Cashier: ${order.cashierName}` });
  return L;
}

/**
 * One ticket per station that has items. Food + drink -> 2 tickets (bar, kitchen).
 * In 'single_copy' (combined) mode everything goes on one ticket, with the items
 * grouped under DRINKS and FOOD headings when the order has both.
 */
export function buildPrepTickets(
  order: Order,
  width: PaperWidth,
  mode: TicketMode = 'split_by_station',
): Line[][] {
  const cols = columnsFor(width);
  if (mode === 'single_copy') return [prepTicket(order, order.items, 'ORDER', cols, true)];
  const stations: Station[] = ['bar', 'kitchen'];
  return stations
    .map((s) => ({ s, items: order.items.filter((i) => i.station === s) }))
    .filter((g) => g.items.length > 0)
    .map((g) => prepTicket(order, g.items, STATION_LABEL[g.s], cols));
}

// ---------- customer receipt (with prices; NOT a BIR invoice) ----------
export function buildCustomerReceipt(order: Order, width: PaperWidth, footer?: string): Line[] {
  const cols = columnsFor(width);
  const L: Line[] = [];
  L.push({ text: '39ers', align: 'center', bold: true, size: 'double' });
  L.push({ text: 'Milktea, Coffee and Snacks', align: 'center' });
  L.push({ text: order.branchName, align: 'center' });
  L.push(rule(cols));
  L.push({ text: `Receipt: ${order.receiptNo}` });
  L.push({ text: formatDateTime(order.createdAt) });
  L.push({ text: `Cashier: ${order.cashierName}` });
  L.push(rule(cols));
  for (const it of order.items) {
    for (const row of twoColumn(`${it.quantity} x ${it.name}`, money(it.lineTotal), cols)) L.push({ text: row });
    if (it.modifiers?.length) for (const row of wrap(it.modifiers.join(', '), cols - 3)) L.push({ text: '   ' + row });
  }
  L.push(rule(cols));
  for (const row of twoColumn('Subtotal', money(order.subtotal), cols)) L.push({ text: row });
  if (order.discount > 0) for (const row of twoColumn('Discount', '-' + money(order.discount), cols)) L.push({ text: row });
  for (const row of twoColumn('TOTAL', money(order.total), cols)) L.push({ text: row, bold: true });
  if (order.payment) {
    for (const row of twoColumn(`Paid (${order.payment.method})`, money(order.payment.tendered ?? order.total), cols)) L.push({ text: row });
    if (order.payment.change && order.payment.change > 0) for (const row of twoColumn('Change', money(order.payment.change), cols)) L.push({ text: row });
  }
  L.push(rule(cols));
  L.push({ text: 'This is not an official invoice.', align: 'center' });
  L.push({ text: footer ?? 'Thank you! See you again.', align: 'center' });
  return L;
}

// ---------- calibration ----------
/** Printed from Settings > Printer > Test print so the owner can pick 58mm vs 80mm. */
export function buildTestPage(width: PaperWidth): Line[] {
  const cols = columnsFor(width);
  const ruler = '1234567890'.repeat(5).slice(0, cols);
  return [
    { text: 'PRINTER TEST', align: 'center', bold: true, size: 'double' },
    { text: `Selected: ${width}mm (${cols} chars)`, align: 'center' },
    { text: ruler },
    { text: '|' + ' '.repeat(cols - 2) + '|' },
    { text: 'If the right "|" is cut off or', },
    { text: 'text wraps oddly, switch the', },
    { text: 'paper width in Settings.' },
  ];
}

/** Plain-text rendering for on-screen preview and automated tests. */
export function renderPreview(lines: Line[], width: PaperWidth): string {
  const cols = columnsFor(width);
  return lines
    .map((l) => {
      const eff = l.size === 'double' ? Math.floor(cols / 2) : cols;
      const t = l.text.slice(0, eff);
      const pad = l.align === 'center' ? Math.floor((eff - t.length) / 2) : l.align === 'right' ? eff - t.length : 0;
      return ' '.repeat(Math.max(0, pad)) + t;
    })
    .join('\n');
}
