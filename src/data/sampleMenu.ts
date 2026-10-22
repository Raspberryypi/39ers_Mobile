import type { Station } from '@/printing/ticketBuilder';

/**
 * SAMPLE DATA ONLY. Item names, prices, sizes and add-ons below are placeholders so
 * the draft can be tried end to end. Replace with the real 39ers menu (it will later
 * come from the Supabase `products` / `modifiers` tables).
 *
 * `station` decides which printed ticket an item lands on: drinks -> 'bar', food -> 'kitchen'.
 */

export interface ModifierOption {
  name: string;
  delta: number;
}

export interface ModifierGroup {
  name: string;
  /** true = pick any number (add-ons); false/undefined = pick exactly one. */
  multi?: boolean;
  options: ModifierOption[];
}

export const CATEGORIES = ['Milktea', 'Coffee', 'Snacks'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  station: Station;
  groups?: ModifierGroup[];
}

const SIZE: ModifierGroup = {
  name: 'Size',
  options: [
    { name: 'Medium', delta: 0 },
    { name: 'Large', delta: 15 },
  ],
};

const SUGAR: ModifierGroup = {
  name: 'Sugar level',
  options: ['100%', '75%', '50%', '25%', '0%'].map((p) => ({ name: `${p} sugar`, delta: 0 })),
};

const TEA_ADDONS: ModifierGroup = {
  name: 'Add-ons',
  multi: true,
  options: [
    { name: 'Pearls', delta: 10 },
    { name: 'Nata', delta: 10 },
    { name: 'Cream cheese', delta: 20 },
  ],
};

const COFFEE_ADDONS: ModifierGroup = {
  name: 'Add-ons',
  multi: true,
  options: [
    { name: 'Extra shot', delta: 20 },
    { name: 'Oat milk', delta: 25 },
  ],
};

const FLAVOR: ModifierGroup = {
  name: 'Flavor',
  options: [
    { name: 'Plain', delta: 0 },
    { name: 'Cheese', delta: 5 },
    { name: 'Sour cream', delta: 5 },
    { name: 'BBQ', delta: 5 },
  ],
};

const tea = (id: string, name: string, price: number): Product => ({
  id,
  name,
  price,
  category: 'Milktea',
  station: 'bar',
  groups: [SIZE, SUGAR, TEA_ADDONS],
});

const coffee = (id: string, name: string, price: number): Product => ({
  id,
  name,
  price,
  category: 'Coffee',
  station: 'bar',
  groups: [SIZE, COFFEE_ADDONS],
});

const snack = (id: string, name: string, price: number, groups?: ModifierGroup[]): Product => ({
  id,
  name,
  price,
  category: 'Snacks',
  station: 'kitchen',
  groups,
});

export const SAMPLE_MENU: Product[] = [
  tea('mt-wintermelon', 'Wintermelon Milktea', 85),
  tea('mt-classic', 'Classic Milktea', 80),
  tea('mt-okinawa', 'Okinawa Milktea', 95),
  tea('mt-taro', 'Taro Milktea', 90),
  coffee('cf-americano', 'Iced Americano', 75),
  coffee('cf-latte', 'Cafe Latte', 95),
  coffee('cf-macchiato', 'Caramel Macchiato', 110),
  snack('sn-fries', 'French Fries', 70, [FLAVOR]),
  snack('sn-nuggets', 'Chicken Nuggets', 85),
  snack('sn-siomai', 'Siomai (4 pcs)', 60),
];
