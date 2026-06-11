# Tycoon: Financial Freedom Simulator

Financial life-sim game (React 18 + TypeScript + Vite + Tailwind 4). Player advances
month-by-month building passive income; wins when passive income ≥ 110% of expenses.
Target market: **North America** (USD, FHA loans, US credit scores — intentional).

## Commands

- `npm run dev` — dev server on :5173 (Netlify functions NOT served; see Access below)
- `netlify dev` — dev server WITH functions (needed to test /api/validate-access)
- `npm run test:run` — vitest suite (18 files / 105 tests, all green as of 2026-06-11)
- `npm run build` — tsc + vite build (chunk-size warning is known/pre-existing)

## Architecture (key files)

- `App.tsx` — the entire adult game UI (~8k lines, single file; refactor candidate).
  Early returns: splash → character select → main render. Passing an
  `initialGameState` **with a character** skips character select entirely.
- `ModeSelector.tsx` — entry point: access gate → mode cards
  (adult / daily challenge / kids / multiplayer)
- `services/gameLogic.ts` — all simulation logic; `processTurn` is the monthly tick.
  All randomness flows through module-level `rand()` (seedable; see Daily Challenge).
- `services/storageService.ts` — saves in localStorage key `tycoon_saves_v2`
- `services/dailyChallenge.ts` — daily challenge seed/state factory
- `components/ChallengeShareCard.tsx` — canvas share card (1200×630)
- `constants.ts` — careers, investments, events, education, difficulty settings
- `data/events.json` — additional life events
- `components/v2/` — newer shell UI (DesktopShell sidebar / MobileShell bottom-nav)
- `KidsApp.tsx` — separate simplified kids mode
- `docs/architecture-map.md` — deeper technical map (from Dec 2025 discovery)

## Daily Challenge (built 2026-06-11, live)

- Same world for everyone each day: UTC date → FNV-1a seed → fixed character
  (`services/dailyChallenge.ts`); 120-month sprint; score = final net worth.
- Determinism: `GameState.challenge` carries `{id, seed, targetMonths}`.
  `processTurn` calls `seedSimForMonth(seed, month)` so market cycle + event
  draws re-seed per month (players stay in sync despite different choices);
  normal games call `clearSimSeed()` → true randomness. Never call
  `Math.random()` directly in gameLogic — use `rand()`.
- End: overlay in App.tsx at `month > targetMonths` (or bankruptcy) renders
  `ChallengeShareCard` (net-worth curve, 3 events from `challengeEvents`,
  download/share/copy). Early win = toast, not the blocking victory modal.
- Challenge runs **never autosave** (guard in `recordAutosave`) — adult
  autosave is safe. Demo tier hits the normal 36-month wall mid-challenge
  (Pieter's call: challenge is demo-gated; card doubles as upsell).
- Tests: `services/dailyChallenge.test.ts` (incl. headless full 120-month
  determinism playtest). Verified live 2026-06-11: seed→character matched
  prediction (Sarah Miller, $16K), events fired, console clean, adult save
  untouched.
- **Streak**: localStorage `tycoon_daily_streak_v1` (current + best);
  `recordDailyChallengePlayed` fires when the player starts today's run
  (ModeSelector daily card onClick). Card eyebrow + end overlay show the
  🔥 streak / keep-it-alive nudge.
- **OG tags**: static Open Graph/Twitter meta in `index.html` →
  `public/og-image.jpg` (1200×630). Per-run dynamic OG images need a
  server — revisit in the Supabase era.

## Access tiers / monetization (selling live since 2026-06-10)

- Free demo = 36 in-game months (`DEMO_MONTH_LIMIT` in `services/accessControl.ts`)
  + full kids mode. Full version unlocked by access code; multiplayer is full-only.
- Validation is server-side: `netlify/functions/validate-access.ts` checks
  `ACCESS_CODES` env var (comma-separated) and Gumroad license keys
  (`GUMROAD_PRODUCT_ID` env var). Setup guide: `docs/monetization-setup.md`.
- **Gumroad product live**: "Tycoon — Full Version Unlock", $12,
  https://pieterrealtor.gumroad.com/l/tycoon (PURCHASE_URL in accessControl.ts).
  License flow verified end-to-end with a real key.
- Demo wall: `advanceMonth` in App.tsx blocks past the limit and shows
  `components/UnlockModal.tsx`; unlocking mid-run continues the same game.
- Tier stored in localStorage `tycoon_access_tier`; missing key = full
  (grandfathers beta users). Gate auth flag: `tycoon_authenticated`.
- **Dev fallback**: plain `vite dev` has no functions, so DEV builds accept the
  code `Bokke` locally (see `validateAccessCode`).

## Deployment

- Netlify site **tycoonjan22026** auto-deploys `main` on push
  (github.com/Pieter2023/tycoon-step). Working branch
  `codex/game-overhaul-20260503-223748`; deploy with:
  `git push origin codex/game-overhaul-20260503-223748 codex/game-overhaul-20260503-223748:main`
- Env vars set: `ACCESS_CODES`, `GUMROAD_PRODUCT_ID`, `OPENAI_API_KEY` (secret).
- **Gotcha**: warm Netlify function instances cache env values — after changing
  an env var, trigger a redeploy or the function keeps the old value.

## Gotchas

- OpenAI key rotated 2026-06-10 (old one still in git history but revoked).
  Lives in `.env.local` (gitignored) + Netlify env.
- Tutorial videos must be H.264 mp4 (`public/videos/quick-tutorial.mov` is the
  old HEVC file — kept on disk, gitignored; don't commit it, it's 51MB).
- `public/event-images/` etc. are referenced by constants.ts — don't delete.
- Vite dev returns 500 (not 404) for unknown POST /api routes.
- First-ever `vite dev` page load can full-reload once (dep optimization) — looks
  like a "bounce to menu" bug but isn't; production is unaffected.
- Old `main` git history tracks node_modules/dist/.env.local — **never run
  `git checkout main` / `reset --hard` across that boundary locally**; it will
  try to delete those from disk. Update remote main via push (cmd above).

## Current state & next steps

Daily challenge shipped + verified live 2026-06-11; follow-ups (full-run
playtest, streak nudge, OG tags) done later that day. See `docs/roadmap.md`
for the queue: run summary card for normal games, learning counterfactuals,
Supabase accounts + daily leaderboard.
