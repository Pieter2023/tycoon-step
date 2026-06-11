# Tycoon: Financial Freedom Simulator

Financial life-sim game (React 18 + TypeScript + Vite + Tailwind 4). Player advances
month-by-month building passive income; wins when passive income ≥ 110% of expenses.
Target market: **North America** (USD, FHA loans, US credit scores — intentional).

## Commands

- `npm run dev` — dev server on :5173 (Netlify functions NOT served; see Access below)
- `netlify dev` — dev server WITH functions (needed to test /api/validate-access)
- `npm run test:run` — vitest suite (17 files / 86 tests, all green as of 2026-06-10)
- `npm run build` — tsc + vite build (chunk-size warning is known/pre-existing)

## Architecture (key files)

- `App.tsx` — the entire adult game UI (~8k lines, single file; refactor candidate).
  Early returns: splash → character select → main render (starts ~line 4561).
- `ModeSelector.tsx` — entry point: access gate → mode cards (adult/kids/multiplayer)
- `services/gameLogic.ts` — all simulation logic; `processTurn` is the monthly tick
- `services/storageService.ts` — saves in localStorage key `tycoon_saves_v2`
- `constants.ts` — careers, investments, events, education, difficulty settings
- `data/events.json` — additional life events
- `components/v2/` — newer shell UI (DesktopShell sidebar / MobileShell bottom-nav)
- `KidsApp.tsx` — separate simplified kids mode
- `docs/architecture-map.md` — deeper technical map (from Dec 2025 discovery)

## Access tiers / monetization (built 2026-06-10)

- Free demo = 36 in-game months (`DEMO_MONTH_LIMIT` in `services/accessControl.ts`)
  + full kids mode. Full version unlocked by access code; multiplayer is full-only.
- Validation is server-side: `netlify/functions/validate-access.ts` checks
  `ACCESS_CODES` env var (comma-separated) and Gumroad license keys
  (`GUMROAD_PRODUCT_ID` env var). Setup guide: `docs/monetization-setup.md`.
- Demo wall: `advanceMonth` in App.tsx blocks past the limit and shows
  `components/UnlockModal.tsx`; unlocking mid-run continues the same game.
- Tier stored in localStorage `tycoon_access_tier`; missing key = full
  (grandfathers beta users). Gate auth flag: `tycoon_authenticated`.
- **Dev fallback**: plain `vite dev` has no functions, so DEV builds accept the
  code `Bokke` locally (see `validateAccessCode`).

## Gotchas

- `.env.local` holds an OpenAI key (avatar generation functions). It was untracked
  from git on 2026-06-10 but **remains in old history — rotate the key**.
- Tutorial videos must be H.264 mp4 (a previous HEVC .mov played nowhere).
- `public/event-images/` etc. are referenced by constants.ts — don't delete.
- Vite dev returns 500 (not 404) for unknown POST /api routes.
- First-ever `vite dev` page load can full-reload once (dep optimization) — looks
  like a "bounce to menu" bug but isn't; production is unaffected.

## Current state & next steps

See `docs/roadmap.md` for prioritized next work (top item: daily challenge +
shareable run-summary card) and the pending business setup steps (Gumroad
product, Netlify env vars, PURCHASE_URL).
