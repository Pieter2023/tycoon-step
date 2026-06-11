// Cross-device cloud saves via a private sync code (no account needed yet).
//
// Each device generates a UUID sync code; backing up uploads the adult
// autosave to Supabase keyed by that code, and entering the code on another
// device pulls it down. Server side, the cloud_saves table is locked down
// (RLS, no policies) — access only through SECURITY DEFINER RPCs that demand
// the exact code, so saves can't be enumerated. Real accounts (Supabase auth)
// can layer on top later without changing this shape.

import { GameState } from '../types';

const SUPABASE_URL = 'https://bvsqnhtlwklexyijvexw.supabase.co';
// Publishable key — safe to ship in the client bundle (RPC-only access).
const SUPABASE_ANON_KEY = 'sb_publishable_CGy4zjl117ghewz_U1Pxcw_d3VYFWj3';

const RPC = `${SUPABASE_URL}/rest/v1/rpc`;
const SYNC_CODE_KEY = 'tycoon_sync_code';
const SYNC_ENABLED_KEY = 'tycoon_cloud_sync';

const CODE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface CloudSaveSummary {
  name?: string;
  month?: number;
  netWorth?: number;
}

export interface CloudSave {
  state: GameState;
  summary: CloudSaveSummary | null;
  updated_at: string;
}

const headers = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
});

export const isValidSyncCode = (code: string): boolean => CODE_RE.test(code.trim().toLowerCase());

/** This device's sync code (generated once, persisted). */
export const getSyncCode = (): string => {
  try {
    let code = localStorage.getItem(SYNC_CODE_KEY);
    if (!code || !CODE_RE.test(code)) {
      code = crypto.randomUUID();
      localStorage.setItem(SYNC_CODE_KEY, code);
    }
    return code;
  } catch {
    return '';
  }
};

/** Adopt another device's code (after a successful restore) so future backups land in the same slot. */
export const adoptSyncCode = (code: string): void => {
  const normalized = code.trim().toLowerCase();
  if (!CODE_RE.test(normalized)) return;
  try {
    localStorage.setItem(SYNC_CODE_KEY, normalized);
  } catch {
    // non-fatal
  }
};

export const isCloudSyncEnabled = (): boolean => {
  try {
    return localStorage.getItem(SYNC_ENABLED_KEY) === '1';
  } catch {
    return false;
  }
};

export const setCloudSyncEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SYNC_ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    // non-fatal
  }
};

/** Uploads a game state to this device's cloud slot. Returns the server timestamp or null. */
export const uploadCloudSave = async (
  state: GameState,
  summary?: CloudSaveSummary
): Promise<string | null> => {
  const code = getSyncCode();
  if (!code) return null;
  try {
    const res = await fetch(`${RPC}/put_cloud_save`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ code, save: state, save_summary: summary ?? null })
    });
    if (!res.ok) return null;
    return (await res.json()) as string;
  } catch {
    return null;
  }
};

/** Fetches the cloud save behind a code (this device's by default). Null if none/unreachable. */
export const fetchCloudSave = async (code: string = getSyncCode()): Promise<CloudSave | null> => {
  const normalized = code.trim().toLowerCase();
  if (!CODE_RE.test(normalized)) return null;
  try {
    const res = await fetch(`${RPC}/get_cloud_save`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ code: normalized })
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CloudSave | null;
    if (!data || !data.state) return null;
    return data;
  } catch {
    return null;
  }
};
