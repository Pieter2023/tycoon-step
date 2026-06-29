// Lightweight, privacy-friendly analytics wrapper.
//
// Zero-PII and provider-agnostic. Supports Umami (window.umami) and Plausible
// (window.plausible) — whichever is loaded by the snippet in index.html. Until
// a provider script is added this is a safe no-op (in dev it logs to console),
// so calling track() anywhere is always safe and never throws.
//
// To turn analytics ON: create a free site at https://cloud.umami.is (no
// cookies, no PII — matches the "no student data" promise on /educators),
// then uncomment the <script> in index.html and paste your website id. No code
// changes needed here — the events below start flowing automatically.
//
// The conversion funnel these events trace (watch the drop in your dashboard):
//   app_loaded          — the app booted / page view
//   mode_selected       — player picked a mode (adult / daily / kids / multiplayer)
//   demo_started        — a demo-tier player launched the adult sim
//   demo_wall_hit       — a demo player reached the 36-month wall (your hottest lead)
//   unlock_modal_opened — the buy / unlock modal opened
//   gumroad_click       — clicked through to the Gumroad checkout
//   purchase_unlocked   — an access code / Gumroad license validated successfully

type TrackProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: { track?: (event: string, data?: TrackProps) => void };
    plausible?: (event: string, opts?: { props?: TrackProps }) => void;
  }
}

export const track = (event: string, props?: TrackProps): void => {
  try {
    if (typeof window === 'undefined') return;
    window.umami?.track?.(event, props);
    window.plausible?.(event, props ? { props } : undefined);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event, props ?? '');
    }
  } catch {
    // Analytics must never break the app.
  }
};
