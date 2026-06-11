# Tycoon: Financial Freedom Simulator

Financial life-sim game (React 18 + TypeScript + Vite + Tailwind 4). Player advances
month-by-month building passive income; wins when passive income ≥ 110% of expenses.
Target market: **North America** (USD, FHA loans, US credit scores — intentional).

## Commands

- `npm run dev` — dev server on :5173 (Netlify functions NOT served; see Access below)
- `netlify dev` — dev server WITH functions (needed to test /api/validate-access)
- `npm run test:run` — vitest suite (23 files / 145 tests, all green as of 2026-06-11)
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
- `components/ChallengeShareCard.tsx` — canvas share card (1200×630), used by
  BOTH the daily challenge end screen and normal games' "Run summary card"
  (branches on `gameState.challenge`; normal-game entry points: victory modal,
  bankruptcy modal, HUD menu, mobile overflow, MoreScreen)
- `constants.ts` — careers, investments, events, education, difficulty settings
- `data/events.json` — additional life events
- `components/v2/` — newer shell UI (DesktopShell sidebar / MobileShell bottom-nav)
- `components/modals/` — end-game modals extracted from App.tsx (victory,
  bankruptcy, challenge-end, run-summary, annual-report); visibility
  conditions still live in App.tsx render
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

Everything through the Supabase milestone is **shipped, verified live, and
deployed** as of end-of-day 2026-06-11: daily challenge (+ streaks, OG tags,
leaderboard), run summary card, learning counterfactuals (sell hindsights +
year-in-review), cloud saves (sync code + accounts), email login with custom
SMTP. Working tree clean; remote main == working branch.

Leaderboard→accounts linking also shipped 2026-06-11 (later session); suite
now 23 files / 150 tests. App.tsx split slice 1 (end-game modals →
`components/modals/`) shipped the same session.

**The queue (details + cold-start context in `docs/roadmap.md`):**
1. v2 shell migration / App.tsx split (big refactor — read
   `docs/implementation-plan.md` first; extract inline modals, then tabs)
2. B2B classroom packs (one-page offer + outreach; bulk codes already work)

Day-to-day workflow that worked well: build → test (`npm run test:run`) →
verify live in the preview browser (seed localStorage
`tycoon_authenticated=true` + `tycoon_access_tier=full`, clean up after) →
update CLAUDE.md + roadmap → commit → push to main (auto-deploys) → confirm
the new bundle is served (grep a new string in the live JS).

## Daily leaderboard / Supabase (built 2026-06-11)

- Supabase project **tycoon** (ref `bvsqnhtlwklexyijvexw`, us-east-1, $10/mo
  on Pieter's org). Table `public.daily_scores`: one row per
  (challenge_id, client_id) — unique constraint = one score per device/day.
- Client talks straight to PostgREST with the **publishable** key (hardcoded
  in `services/leaderboard.ts` — safe by design). RLS: SELECT + INSERT only;
  UPDATE/DELETE have no policies (verified live: PATCH/DELETE are no-ops).
  Value sanity enforced by CHECK constraints (name ≤20 chars, score bounds,
  outcome enum, challenge_id date format).
- **Scores link to accounts (2026-06-11)**: nullable `user_id` column
  (FK auth.users, on delete set null). Signed-in submits send the session
  access token as the PostgREST Bearer + include user_id; insert policy is
  `user_id is null or user_id = auth.uid()` so it can't be spoofed with the
  bare anon key (all 4 paths verified live). On 401/403 (stale token) the
  client retries unlinked. `getSessionAuth` in `services/auth.ts`; name
  input prefills from the account email's local part when nothing is saved.
- UI: `components/DailyLeaderboard.tsx` inside the challenge end overlay —
  name input (persisted `tycoon_player_name`), submit once
  (`tycoon_client_id` device id), today's top 10 + "You're #N today" rank.
  Degrades gracefully offline ("Leaderboard unavailable").
- Tests: `services/leaderboard.test.ts`, `components/DailyLeaderboard.test.tsx`.
- **Cloud saves (sync-code, no accounts yet)**: `public.cloud_saves` keyed by a
  private UUID sync code; table has RLS with NO policies — access ONLY via
  SECURITY DEFINER RPCs `put_cloud_save`/`get_cloud_save` (exact code
  required, no enumeration; 2MB payload cap; direct table reads verified 401).
  Client: `services/cloudSave.ts` (`tycoon_sync_code`, `tycoon_cloud_sync`
  localStorage keys). UI: ☁️ Cloud Sync panel in ModeSelector's Save Manager
  (toggle, copy code, Back up now, Restore from code → lands in Autosave +
  adopts the code); fresh devices get a "Played before? Restore from Cloud"
  button since Manage Saves is hidden without local saves. `recordAutosave`
  auto-uploads when enabled (60s throttle). Round-trip verified live.
- **Accounts (Supabase auth, built 2026-06-11)**: dashboard configured by
  Pieter (Site URL, redirect URLs, anonymous sign-ins ON). `services/auth.ts`
  (supabase-js client, sessions persist + auto-refresh, detectSessionInUrl
  for magic links). Model: silent ANONYMOUS account is created when cloud
  sync is enabled; "Link email" upgrades the same user (updateUser →
  confirmation email, id and saves carry over); "Sign in instead" sends a
  magic link for existing accounts on new devices. `public.user_saves`:
  one row per user, real RLS via auth.uid() (cross-user read/write verified
  blocked live). `uploadCloudSave` prefers the account slot, falls back to
  the sync code; Save Manager shows account status, link/sign-in/sign-out,
  and "Restore from my account" (email accounts).
- **Email flow verified end-to-end 2026-06-11** with a real inbox
  (pieterhouseofrealtors@gmail.com — that's the Gmail connected to Claude's
  MCP): link-email confirmation upgraded a guest account, magic link signed
  into a second browser, account restore worked. Test user deleted after.
- **Custom SMTP (Resend) — LIVE 2026-06-11**: auth emails send from
  `Tycoon <noreply@prismaiservices.ca>` via smtp.resend.com:465 (username
  `resend`, password = Resend API key `tycoon-supabase-smtp`, set in
  Supabase → Authentication → Emails → SMTP Settings). Verified live.
  Rate limit 30 emails/hr (adjustable under Auth → Rate Limits). Resend
  verified domains: prismaiservices.ca, rentalpropdocs.co.za
  (houseofrealtors.co.za failed verification — fix DNS if it's ever wanted
  as the sender). Email login is production-ready.

## Learning counterfactuals (built 2026-06-11)

- **Sell hindsights**: `handleSellAsset` (App.tsx) records a "ghost holding"
  in `GameState.soldPositions`; `updateSoldPositions` (gameLogic) grows it on
  the market's *expected* path — deliberately NO `rand()` calls so
  daily-challenge worlds stay in sync (regression test proves it). At
  +12 months a 🎓 Hindsight event (type NEWS) lands in the feed.
- **Year-in-review**: `GameState.yearStats` accumulates market gains
  (in `updateAssetPrices`) + passive income (in `processTurn`); at each
  January boundary `processTurn` emits transient `GameState.annualReport`
  (normal games only — never for challenges). App.tsx shows the modal,
  pauses autoplay, clears the field on dismiss; processTurn also clears it
  every turn so a saved-undismissed report can't reappear forever.
- Tests: `services/counterfactuals.test.ts`.
