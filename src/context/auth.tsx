import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { can as canRole, type Permission, type Role } from '@/lib/rbac';

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

// DEMO DATA: replaced by Supabase auth and the `branches` table in the next stage.
// Branch names are placeholders until the real ones are provided.
export const BRANCHES: Branch[] = [
  { id: 'b1', name: '39ers Aklan - Branch 1', code: 'B1' },
  { id: 'b2', name: '39ers Aklan - Branch 2', code: 'B2' },
];

export const DEMO_USERS: User[] = [
  { id: 'u-owner', name: 'Owner', role: 'owner' },
  { id: 'u-admin', name: 'Admin', role: 'admin' },
  { id: 'u-staff', name: 'Cashier', role: 'staff' },
];

interface AuthValue {
  user: User | null;
  branch: Branch | null;
  signIn: (user: User, branch: Branch) => void;
  signOut: () => void;
  setBranch: (branch: Branch) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [branch, setBranchState] = useState<Branch | null>(null);

  const signIn = useCallback((u: User, b: Branch) => {
    setUser(u);
    setBranchState(b);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setBranchState(null);
  }, []);

  const can = useCallback((permission: Permission) => canRole(user?.role, permission), [user]);

  // Only the owner can switch branches after signing in.
  const setBranch = useCallback(
    (b: Branch) => {
      if (canRole(user?.role, 'branches.switch')) setBranchState(b);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, branch, signIn, signOut, setBranch, can }),
    [user, branch, signIn, signOut, setBranch, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
