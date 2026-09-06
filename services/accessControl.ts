// Access control for the free demo vs. full game.
//
// The full game is unlocked with an access code validated server-side by
// netlify/functions/validate-access.ts (env-managed codes and/or Gumroad
// license keys). The client only ever learns "valid or not" — no codes ship
// in the bundle.

export type AccessTier = 'demo' | 'full';

const ACCESS_TIER_KEY = 'tycoon_access_tier';
const ACCESS_INVITE_KEY = 'tycoon_access_invite';
let pendingInviteCode: string | null = null;

// Demo players get this many in-game months before being asked to unlock.
export const DEMO_MONTH_LIMIT = 36;

// Where players buy an access code. Leave empty to hide buy links in the UI
// until the store page exists.
export const PURCHASE_URL = 'https://pieterrealtor.gumroad.com/l/tycoon';

// Shown in-app so the price is never hidden behind a click-out (a $12 impulse
// product has to wear its price). Keep in sync with the Gumroad listing.
export const PURCHASE_PRICE = '$12';

export const getAccessTier = (): AccessTier => {
  try {
    // Missing key counts as 'full' so beta users authenticated before tiers
    // existed keep their access.
    return localStorage.getItem(ACCESS_TIER_KEY) === 'demo' ? 'demo' : 'full';
  } catch {
    return 'full';
  }
};

export const setAccessTier = (tier: AccessTier) => {
  try {
    localStorage.setItem(ACCESS_TIER_KEY, tier);
  } catch (e) {
    console.warn('localStorage.setItem failed:', ACCESS_TIER_KEY, e);
  }
};

export const getAccessInvite = (href: string): { code: string; cleanUrl: string } | null => {
  try {
    const url = new URL(href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const code = hashParams.get('access')?.trim();
    if (!code) return null;

    hashParams.delete('access');
    url.hash = hashParams.toString();
    return { code, cleanUrl: `${url.pathname}${url.search}${url.hash}` };
  } catch {
    return null;
  }
};

export const captureAccessInvite = () => {
  if (typeof window === 'undefined') return;
  const invite = getAccessInvite(window.location.href);
  if (!invite) return;

  pendingInviteCode = invite.code;
  try {
    sessionStorage.setItem(ACCESS_INVITE_KEY, invite.code);
  } catch {
    // The in-memory copy still works when storage is restricted.
  }
  try {
    window.history.replaceState(null, '', invite.cleanUrl);
  } catch {
    // The invite still works if a sandboxed browser blocks URL cleanup.
  }
};

export const getPendingAccessInvite = (): string | null => {
  if (pendingInviteCode) return pendingInviteCode;
  try {
    return sessionStorage.getItem(ACCESS_INVITE_KEY);
  } catch {
    return null;
  }
};

export const clearPendingAccessInvite = () => {
  pendingInviteCode = null;
  try {
    sessionStorage.removeItem(ACCESS_INVITE_KEY);
  } catch {
    // Nothing else to clear when storage is restricted.
  }
};

export const validateAccessCode = async (code: string): Promise<boolean> => {
  const trimmed = code.trim();
  if (!trimmed) return false;

  try {
    const res = await fetch('/api/validate-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.valid;
    }
    // Non-OK in production is a definitive no. Plain `vite dev` doesn't serve
    // Netlify functions (returns 404/500 here), so dev falls through to the
    // local fallback below.
    if (!import.meta.env.DEV) return false;
  } catch {
    // Network error — only the dev fallback below may still accept the code.
    if (!import.meta.env.DEV) return false;
  }

  return import.meta.env.DEV && trimmed.toLowerCase() === 'bokke';
};
