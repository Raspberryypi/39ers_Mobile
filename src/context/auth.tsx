import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { can as canRole, type Permission, type Role } from '@/lib/rbac';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthValue {
  user: User | null;
  /** Branches this user may work in (the database already filters the list by role). */
  branches: Branch[];
  branch: Branch | null;
  /** True while a saved session or the user's profile is still loading. */
  loading: boolean;
  configured: boolean;
  /** Set when sign-in worked but the account is not set up properly. */
  accountError: string | null;
  /** Resolves to an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  setBranch: (branch: Branch) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

interface ProfileRow {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(supabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // 1. Restore a saved session, then follow sign-in / sign-out.
  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // 2. Load the signed-in person's profile (role) and branches from the database.
  const uid = session?.user.id;
  const email = session?.user.email ?? '';
  useEffect(() => {
    if (!uid) {
      setUser(null);
      setBranches([]);
      setBranchId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [p, b] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role, is_active').eq('id', uid).maybeSingle(),
        supabase.from('branches').select('id, name, code').eq('is_active', true).order('name'),
      ]);
      if (cancelled) return;

      const profile = p.data as ProfileRow | null;
      if (p.error || !profile || !profile.is_active) {
        setAccountError(
          p.error?.message ?? 'This account has no role yet. Ask the owner to set it up.',
        );
        await supabase.auth.signOut();
        return;
      }
      const list = (b.data ?? []) as Branch[];
      if (list.length === 0) {
        setAccountError('This account is not assigned to any branch yet. Ask the owner.');
        await supabase.auth.signOut();
        return;
      }
      setAccountError(null);
      setBranches(list);
      setBranchId((current) => (current && list.some((x) => x.id === current) ? current : list[0].id));
      setUser({ id: profile.id, name: profile.full_name, email, role: profile.role });
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, email]);

  const signIn = useCallback(async (mail: string, password: string) => {
    if (!supabaseConfigured) {
      return 'The app is not connected to Supabase yet. Check .env.local, then restart with: npx expo start -c';
    }
    setAccountError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: mail.trim(), password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const branch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? branches[0] ?? null,
    [branches, branchId],
  );

  const setBranch = useCallback(
    (b: Branch) => {
      if (branches.some((x) => x.id === b.id)) setBranchId(b.id);
    },
    [branches],
  );

  const can = useCallback((permission: Permission) => canRole(user?.role, permission), [user]);

  const loading = booting || (!!session && !user && !accountError);

  const value = useMemo(
    () => ({
      user,
      branches,
      branch,
      loading,
      configured: supabaseConfigured,
      accountError,
      signIn,
      signOut,
      setBranch,
      can,
    }),
    [user, branches, branch, loading, accountError, signIn, signOut, setBranch, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
