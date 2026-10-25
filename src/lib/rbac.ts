export type Role = 'owner' | 'admin' | 'staff';

export type Permission =
  | 'pos.sell'
  | 'orders.void'
  | 'inventory.manage'
  | 'menu.manage'
  | 'analytics.view'
  | 'costs.view'
  | 'users.manage'
  | 'branches.switch';

/**
 * Who can do what. This only controls what the UI shows; the real enforcement
 * is Row-Level Security in Supabase (see supabase/migrations/001_schema.sql).
 */
const MATRIX: Record<Permission, readonly Role[]> = {
  'pos.sell': ['owner', 'admin', 'staff'],
  'orders.void': ['owner', 'admin'],
  'inventory.manage': ['owner', 'admin'],
  'menu.manage': ['owner', 'admin'],
  'analytics.view': ['owner', 'admin'],
  'costs.view': ['owner', 'admin'],
  'users.manage': ['owner'],
  'branches.switch': ['owner'],
};

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && MATRIX[permission].includes(role);
}
