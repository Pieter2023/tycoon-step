// Supabase auth for Tycoon accounts.
//
// Model: every player silently gets an ANONYMOUS account the first time the
// app needs one (no signup wall). Linking an email upgrades that same account
// (updateUser sends a confirmation link), so progress is never lost. On a new
// device, a magic link signs into the existing account. Sessions persist in
// localStorage via supabase-js and refresh automatically.

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvsqnhtlwklexyijvexw.supabase.co';
// Publishable key — safe to ship in the client bundle (RLS enforced).
const SUPABASE_ANON_KEY = 'sb_publishable_CGy4zjl117ghewz_U1Pxcw_d3VYFWj3';

let client: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true // picks up magic-link tokens on redirect
      }
    });
  }
  return client;
};

export interface AccountInfo {
  userId: string;
  email: string | null;
  isAnonymous: boolean;
}

const toAccount = (session: Session | null): AccountInfo | null => {
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    email: session.user.email || null,
    isAnonymous: !!session.user.is_anonymous
  };
};

/** Current account, or null when signed out / unreachable. */
export const getAccount = async (): Promise<AccountInfo | null> => {
  try {
    const supa = getSupabase();
    const { data } = await supa.auth.getSession();
    if (!data.session?.user) return null;
    // getSession serves the cached user, which goes stale after an email is
    // confirmed in another tab — ask the server for the authoritative record.
    const { data: fresh, error } = await supa.auth.getUser();
    if (error || !fresh.user) return toAccount(data.session);
    return {
      userId: fresh.user.id,
      email: fresh.user.email || null,
      isAnonymous: !!fresh.user.is_anonymous
    };
  } catch {
    return null;
  }
};

/**
 * Returns the current account, creating a silent anonymous one if needed.
 * Null only when Supabase is unreachable.
 */
export const ensureSignedIn = async (): Promise<AccountInfo | null> => {
  try {
    const existing = await getAccount();
    if (existing) return existing;
    const { data, error } = await getSupabase().auth.signInAnonymously();
    if (error) return null;
    return toAccount(data.session);
  } catch {
    return null;
  }
};

/**
 * Upgrades the current (anonymous) account with an email. Supabase sends a
 * confirmation link; the account keeps its id, so saves carry over.
 */
export const linkEmail = async (email: string): Promise<{ ok: boolean; message: string }> => {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, message: 'That doesn\'t look like an email address.' };
  }
  try {
    await ensureSignedIn();
    const { error } = await getSupabase().auth.updateUser(
      { email: address },
      { emailRedirectTo: window.location.origin }
    );
    if (error) {
      if (/already.*registered|exists/i.test(error.message)) {
        return { ok: false, message: 'That email already has an account — use "sign in" instead.' };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, message: `Confirmation link sent to ${address} — click it to finish linking.` };
  } catch {
    return { ok: false, message: 'Couldn\'t reach the server — try again.' };
  }
};

/** Sends a magic link to sign into an EXISTING account on this device. */
export const signInWithEmail = async (email: string): Promise<{ ok: boolean; message: string }> => {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, message: 'That doesn\'t look like an email address.' };
  }
  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin }
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: `Magic link sent to ${address} — open it on this device.` };
  } catch {
    return { ok: false, message: 'Couldn\'t reach the server — try again.' };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await getSupabase().auth.signOut();
  } catch {
    // already signed out / offline — fine
  }
};
