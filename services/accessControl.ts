// Access control for the free demo vs. full game.
//
// The full game is unlocked with an access code validated server-side by
// netlify/functions/validate-access.ts (env-managed codes and/or Gumroad
// license keys). The client only ever learns "valid or not" — no codes ship
// in the bundle.

export type AccessTier = 'demo' | 'full';

const ACCESS_TIER_KEY = 'tycoon_access_tier';

// Demo players get this many in-game months before being asked to unlock.
export const DEMO_MONTH_LIMIT = 36;

// Where players buy an access code. Leave empty to hide buy links in the UI
// until the store page exists.
export const PURCHASE_URL = '';

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
