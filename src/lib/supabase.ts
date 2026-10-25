import 'react-native-url-polyfill/auto';
import './storage'; // picks the right storage setup for phone vs. web

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for the 39ers POS.
 *
 * Settings come from `.env.local` in the 39ers_mobile folder (see `.env.example`).
 * Only the PUBLISHABLE key belongs in the app. Never put the secret / service_role key here.
 * Security comes from the database's Row-Level Security rules, not from hiding this key.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** False until .env.local has a real key; the login screen explains what to do. */
export const supabaseConfigured = !!url && !!key && !key.startsWith('PASTE_');

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'missing-key', {
  auth: {
    // Guarded so nothing breaks if this file is ever run outside a browser / phone.
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
