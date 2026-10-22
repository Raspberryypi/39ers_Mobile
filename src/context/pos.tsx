import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth';
import type { ModifierOption, Product } from '@/data/sampleMenu';
import type { Order, OrderItem, PaperWidth, TicketMode } from '@/printing/ticketBuilder';

export type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'Other';
export type OrderType = 'dine_in' | 'take_out';

export interface CartLine {
  key: string;
  product: Product;
  qty: number;
  modifiers: ModifierOption[];
  note?: string;
}

export interface SavedOrder {
  id: string;
  branchId: string;
  branchName: string;
  receiptNo: string;
  queueNo: string;
  createdAt: Date;
  cashierName: string;
  orderType: OrderType;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment: { method: PaymentMethod; tendered: number; change: number; reference?: string };
  status: 'paid' | 'voided';
}

export interface PrintSettings {
  paperWidth: PaperWidth;
  ticketMode: TicketMode;
}

export interface CheckoutInput {
  orderType: OrderType;
  note?: string;
  method: PaymentMethod;
  tendered?: number;
  reference?: string;
}

interface PosValue {
  cart: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  addLine: (product: Product, modifiers: ModifierOption[], note?: string) => void;
  changeQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  orders: SavedOrder[];
  checkout: (input: CheckoutInput) => SavedOrder | null;
  voidOrder: (id: string) => void;
  settings: PrintSettings;
  updateSettings: (patch: Partial<PrintSettings>) => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number, len: number) => String(n).padStart(len, '0');
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export const lineUnitPrice = (l: CartLine) =>
  l.product.price + l.modifiers.reduce((sum, m) => sum + m.delta, 0);

/** Adapts a saved order to the shape the ticket/receipt builders expect. */
export function toTicketOrder(o: SavedOrder): Order {
  return {
    receiptNo: o.receiptNo,
    queueNo: o.queueNo,
    branchName: o.branchName,
    cashierName: o.cashierName,
    createdAt: o.createdAt,
    orderType: o.orderType,
    note: o.note,
    items: o.items,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    payment: {
      method: o.payment.method.toLowerCase(),
      tendered: o.payment.tendered,
      change: o.payment.change,
    },
  };
}

const PosContext = createContext<PosValue | null>(null);

/**
 * DRAFT STATE: everything lives in memory and resets when the app reloads.
 * In the next stage this moves to the on-device SQLite database (PowerSync),
 * with the same function names, so screens will not need to change.
 */
export function PosProvider({ children }: { children: ReactNode }) {
  const { user, branch } = useAuth();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [settings, setSettings] = useState<PrintSettings>({
    paperWidth: 58,
    ticketMode: 'split_by_station',
  });

  const addLine = useCallback((product: Product, modifiers: ModifierOption[], note?: string) => {
    const cleanNote = note?.trim() || undefined;
    const key = [product.id, modifiers.map((m) => m.name).sort().join(','), cleanNote ?? ''].join('|');
    setCart((prev) => {
      if (prev.some((l) => l.key === key)) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { key, product, qty: 1, modifiers, note: cleanNote }];
    });
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((n, l) => n + l.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () => round2(cart.reduce((sum, l) => sum + lineUnitPrice(l) * l.qty, 0)),
    [cart],
  );

  const checkout = useCallback(
    (input: CheckoutInput): SavedOrder | null => {
      if (!user || !branch || cart.length === 0) return null;

      const now = new Date();
      const items: OrderItem[] = cart.map((l) => ({
        name: l.product.name,
        quantity: l.qty,
        station: l.product.station,
        modifiers: l.modifiers.map((m) => m.name),
        note: l.note,
        unitPrice: lineUnitPrice(l),
        lineTotal: round2(lineUnitPrice(l) * l.qty),
      }));
      const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
      const tendered = input.method === 'Cash' ? (input.tendered ?? subtotal) : subtotal;

      const branchOrders = orders.filter((o) => o.branchId === branch.id);
      const todays = branchOrders.filter((o) => isSameDay(o.createdAt, now));

      const order: SavedOrder = {
        id: `${branch.id}-${now.getTime()}-${branchOrders.length + 1}`,
        branchId: branch.id,
        branchName: branch.name,
        // Real build: <BRANCH>-<DEVICE>-<SEQ>, with the sequence kept per device.
        receiptNo: `${branch.code}-D1-${pad(branchOrders.length + 1, 6)}`,
        // Short number the cashier calls out; restarts each day per branch.
        queueNo: pad(todays.length + 1, 3),
        createdAt: now,
        cashierName: user.name,
        orderType: input.orderType,
        note: input.note,
        items,
        subtotal,
        discount: 0,
        total: subtotal,
        payment: {
          method: input.method,
          tendered,
          change: round2(Math.max(0, tendered - subtotal)),
          reference: input.reference,
        },
        status: 'paid',
      };

      setOrders((prev) => [order, ...prev]);
      setCart([]);
      return order;
    },
    [user, branch, cart, orders],
  );

  const voidOrder = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'voided' } : o)));
  }, []);

  const updateSettings = useCallback((patch: Partial<PrintSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      cartSubtotal,
      addLine,
      changeQty,
      removeLine,
      clearCart,
      orders,
      checkout,
      voidOrder,
      settings,
      updateSettings,
    }),
    [
      cart,
      cartCount,
      cartSubtotal,
      addLine,
      changeQty,
      removeLine,
      clearCart,
      orders,
      checkout,
      voidOrder,
      settings,
      updateSettings,
    ],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos(): PosValue {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used inside <PosProvider>');
  return ctx;
}
