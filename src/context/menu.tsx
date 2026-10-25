import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/auth';
import type { ModifierGroup, Product } from '@/data/sampleMenu';
import { supabase } from '@/lib/supabase';
import type { Station } from '@/printing/ticketBuilder';

export interface MenuCategory {
  id: string;
  name: string;
  station: Station;
}

/** A menu item as the POS and the Menu screen see it. */
export interface MenuProduct extends Product {
  categoryId: string;
  /** false = hidden from the POS (kept for order history). */
  active: boolean;
  /** Only filled for owner/admin; staff can never read costs. */
  cost: number | null;
}

export interface ProductInput {
  id?: string;
  name: string;
  categoryId: string;
  price: number;
  cost: number;
  active: boolean;
  groups: ModifierGroup[];
}

interface MenuValue {
  categories: MenuCategory[];
  products: MenuProduct[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveProduct: (input: ProductInput) => Promise<void>;
  setActive: (id: string, active: boolean) => Promise<void>;
  addCategory: (name: string, station: Station) => Promise<string>;
}

interface ModifierRow {
  group_name: string;
  name: string;
  price_delta: number | string;
  is_multi: boolean;
  sort_order: number;
  is_active: boolean;
}

interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  station: Station;
  is_active: boolean;
  category_id: string | null;
  modifiers: ModifierRow[] | null;
}

function toGroups(rows: ModifierRow[]): ModifierGroup[] {
  const groups = new Map<string, ModifierGroup>();
  for (const r of rows.filter((x) => x.is_active).sort((a, b) => a.sort_order - b.sort_order)) {
    let g = groups.get(r.group_name);
    if (!g) {
      g = { name: r.group_name, multi: r.is_multi, options: [] };
      groups.set(r.group_name, g);
    }
    g.options.push({ name: r.name, delta: Number(r.price_delta) });
  }
  return [...groups.values()];
}

const MenuContext = createContext<MenuValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const { user, can } = useAuth();
  const uid = user?.id;
  const seeCosts = can('costs.view');

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) {
      setCategories([]);
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);

    const [c, p, k] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, station')
        .eq('is_active', true)
        .order('sort_order')
        .order('name'),
      supabase
        .from('products')
        .select(
          'id, name, price, station, is_active, category_id, modifiers(group_name, name, price_delta, is_multi, sort_order, is_active)',
        )
        .order('name'),
      seeCosts
        ? supabase.from('product_costs').select('product_id, cost')
        : Promise.resolve({ data: [] as { product_id: string; cost: number | string }[], error: null }),
    ]);

    const failure = c.error ?? p.error ?? k.error;
    if (failure) {
      setError(failure.message);
      setLoading(false);
      return;
    }

    const cats = (c.data ?? []) as MenuCategory[];
    const names = new Map(cats.map((x) => [x.id, x.name]));
    const costs = new Map(
      ((k.data ?? []) as { product_id: string; cost: number | string }[]).map((x) => [
        x.product_id,
        Number(x.cost),
      ]),
    );

    setCategories(cats);
    setProducts(
      ((p.data ?? []) as ProductRow[]).map((x) => ({
        id: x.id,
        name: x.name,
        price: Number(x.price),
        station: x.station,
        category: (x.category_id && names.get(x.category_id)) || 'Other',
        categoryId: x.category_id ?? '',
        active: x.is_active,
        cost: costs.get(x.id) ?? null,
        groups: toGroups(x.modifiers ?? []),
      })),
    );
    setLoading(false);
  }, [uid, seeCosts]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProduct = useCallback(
    async (input: ProductInput) => {
      const { error: err } = await supabase.rpc('save_product', {
        p_id: input.id ?? null,
        p_name: input.name,
        p_category_id: input.categoryId,
        p_price: input.price,
        p_cost: input.cost,
        p_active: input.active,
        p_groups: input.groups.map((g) => ({
          name: g.name,
          multi: !!g.multi,
          options: g.options.map((o) => ({ name: o.name, delta: o.delta })),
        })),
      });
      if (err) throw new Error(err.message);
      await load();
    },
    [load],
  );

  const setActive = useCallback(
    async (id: string, active: boolean) => {
      const { error: err } = await supabase.from('products').update({ is_active: active }).eq('id', id);
      if (err) throw new Error(err.message);
      await load();
    },
    [load],
  );

  const addCategory = useCallback(
    async (name: string, station: Station) => {
      const { data, error: err } = await supabase
        .from('categories')
        .insert({ name: name.trim(), station, sort_order: categories.length + 1 })
        .select('id')
        .single();
      if (err) throw new Error(err.message);
      await load();
      return (data as { id: string }).id;
    },
    [categories.length, load],
  );

  const value = useMemo(
    () => ({ categories, products, loading, error, reload: load, saveProduct, setActive, addCategory }),
    [categories, products, loading, error, load, saveProduct, setActive, addCategory],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used inside <MenuProvider>');
  return ctx;
}
