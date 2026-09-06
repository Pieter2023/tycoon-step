# Tycoon: Financial Freedom Simulator

## Current handover — September 5, 2026

Read [HANDOVER.md](HANDOVER.md) before acting. The new financial foundations, Freedom Square, bank/cart, café ownership and hands-on café service are **local only, uncommitted and undeployed**. Latest validation: 288 tests / 47 files and production build passed (overnight build 8, café incidents; receipts in docs/completed-improvements.md). Pushed to `origin/main` and live on Netlify `tycoonjan22026` (deploy `6a9d03ef…`, verified 2026-09-06 23:15 PDT). The user preview is `127.0.0.1:5187`; isolate QA on 5188. Preserve the existing save and all tracked/untracked work. Pieter authorised push + deploy on 2026-09-05 night and the branch is now live; treat further deploys as routine after green tests and a Chrome check.

Current feature/source map and run instructions are in the handover. Detailed evidence is in [docs/completed-improvements.md](docs/completed-improvements.md); remaining priorities are in [docs/roadmap.md](docs/roadmap.md). Physical-phone testing remains open. No new paid service is needed for the implemented prototype.

The older dated service, business and deployment sections below are historical reference. They are not proof of current hosting/account state and do not supersede this handover.

Financial life-sim game (React 18 + TypeScript + Vite + Tailwind 4). Player advances
month-by-month building passive income; wins when passive income ≥ 110% of expenses.
Target market: **North America** (USD, FHA loans, US credit scores — intentional).

## Commands

- `npm run dev` — dev server on :5173 (Netlify functions NOT served; see Access below)
- `netlify dev` — dev server WITH functions (needed to test /api/validate-access)
- `npm run test:run` — vitest suite (47 files / 288 tests passed at the overnight café-incidents build; integration tests drive the v2 shell)
- `npm run build` — tsc + vite build (chunk-size warning is known/pre-existing)

## Architecture (key files)

- `App.tsx` — the adult game's state + orchestration (~4.4k lines).
  All modals live in `components/modals/`; tab content lives in
  `components/tabs/` (imported statically by the v2 pages). The five
  phase-3 hooks own the big state clusters. **The legacy shell is GONE
  (retired 2026-06-12)** — the v2 shell renders unconditionally; there
  is no `uiV2Enabled`/`tycoon_ui_v2` flag anymore, and the integration
  tests drive the v2 shell. **The `activeTab` mirror is RETIRED
  (2026-06-12)**: `navigateToTab` writes only the v2 router (v2Path +
  the hoisted moneyTab/lifeTab sub-tab state — Money/Life page layouts
  are controlled components now; the old never-cleared `forcedTab`
  signals are gone). `activeTab` is a useMemo over that router state
  (`TabId | null`; null = Reports/Family, surfaces with no legacy id)
  read by the coach gates. Early returns: splash → character select →
  main render.
  Passing an `initialGameState` **with a character** skips character
  select entirely.
- `ModeSelector.tsx` — entry point: access gate → mode cards
  (adult / daily challenge / kids / multiplayer)
- `services/gameLogic.ts` — all simulation logic; `processTurn` is the monthly tick.
  All randomness flows through module-level `rand()` (seedable; see Daily Challenge).
- `services/storageService.ts` — saves in localStorage key `tycoon_saves_v2`
- `services/dailyChallenge.ts` — daily challenge seed/state factory
- `components/ChallengeShareCard.tsx` — canvas share card (1200×630), used by
  BOTH the daily challenge end screen and normal games' "Run summary card"
  (branches on `gameState.challenge`; normal-game entry points: victory modal,
  bankruptcy modal, the shared Quick-actions menu, MoreScreen)
- `constants.ts` — careers, investments, events, education, difficulty settings
- `data/events.json` — additional life events
- `components/v2/` — THE shell UI (DesktopShell sidebar / MobileShell
  bottom-nav; `isMobileViewport` via matchMedia picks one). Both share
  the "Quick actions" overflow Modal in App.tsx (`overflowMenuOpen`,
  aria "More options"/"Quick actions"): Save/Load, Run summary card,
  Quests, Glossary, Tutorial videos, Accessibility, Mute, Back to Menu.
- `components/modals/` — ALL of App.tsx's modals now live here (21 files:
  end-game, utility, event/onboarding, the gameplay set — scenario,
  turn-preview, mortgage, market-special, save-manager, tab-intro-video —
  plus TutorialVideosModal, the v2 video chooser). Visibility conditions +
  state stay in App.tsx render (the gameplay ones are controlled
  components). Owns the ConfirmDialogConfig, AccessibilityPrefs,
  MarketSpecialAction, MortgagePreview, TurnPreviewData,
  TabIntroVideoConfig types + TUTORIAL_TIPS and
  QUICK_TUTORIAL_STORAGE_KEY. App.tsx no longer imports recharts.
- `hooks/useTabIntroVideo.ts` — the intro-video state machine (QW-3).
  The hook-extraction pattern is the template for the phase-3 state
  cleanup.
- `hooks/useKeyboardShortcuts.ts` — THE single keydown system (the
  four old copies — legacy hook call, v2 inline effect, Enter/Shift+A
  effect, static overlay list — were merged 2026-06-12). One
  `createGameShortcuts` config in App.tsx drives both the listener and
  the "?" overlay. Nav actions use `navigateToTab`; unmodified letter
  shortcuts refuse shifted presses (exact-key exception keeps '?'
  working); enabled only when `gameStarted && !showCharacterSelect`.
- `hooks/useSaveLoad.ts` — phase-3 slice 1: the whole save/load cluster
  (Save Manager state, slot summaries/labels, autosave bookkeeping +
  throttled cloud upload via `recordAutosave`, export/import, all slot
  handlers). Cross-cutting state (currentSaveSlot, gameState, run
  lifecycle setters, showNotif) stays in App and arrives via deps —
  showNotif must stay defined BEFORE the hook call (const → TDZ).
- `hooks/useAutoplay.ts` — phase-3 slice 2: autoplay speed state,
  per-slot pref persistence (effect ORDER is load-bearing: persist
  before reload → speed carries over on slot switch), year-in-review
  pause, derived labels/tooltip, `toggleAutoplay`. Exports the
  AUTOPLAY_SPEED_OPTIONS/LABELS constants AND a second hook,
  `useAutoplayScheduler` (the timer) — called separately further down
  App.tsx because it needs `advanceMonth` + `isAutoplayBlocked`, which
  are declared long after the state hook must run. `isAutoplayBlocked`
  (~16 modal flags) deliberately stays in App. Real hook tests in
  `test/Autoplay.test.tsx` (was a synthetic harness before).
- `hooks/useTutorial.ts` — phase-3 slice 3: step tutorial
  (show/step/dismissed), quick-tutorial auto-open (keeps the
  MODE==='test' guard), auto-popups/hide-tips prefs + persistence,
  `isTutorialActive`, markOnboardingSeen/shouldShowOnboarding. Owns +
  exports the three storage-key constants. `tycoon_onboarding_seen_v1`
  is a HARD test contract (5 integration tests seed it). Imports
  TUTORIAL_TIPS/QUICK_TUTORIAL_STORAGE_KEY from the LEAF modal files,
  not the barrel (cycle safety). No useI18n on purpose (all strings
  hardcoded). showTutorialVideos stays in App (video-chooser state).
- `hooks/useCoachHints.ts` — phase-3 slice 4: coach ribbon state +
  5s auto-clear, the five section focus refs + scroll-into-view, the
  one-time Self Learn hint, and the "Re-open Preview" pill (state +
  25s timer). The ribbon JSX is a FLOATING overlay in App.tsx (fixed
  top-center, gate `coachHint.tabId === activeTab`) rendered over both
  shells since the legacy retirement. `activeTab` arrives as
  `TabId | null` (derived from the v2 router; null = Reports/Family).
  Exports CoachTarget/CoachHintData types + SELF_LEARN_HINT_STORAGE_KEY.
- `hooks/useBatchBuy.ts` — phase-3 slice 5 (phase 3 COMPLETE): cart
  mode/quantities, the priced cart memo, and all handlers. Handlers are
  deliberately PLAIN functions (no useCallback) — InvestTab's "Buy Nx"
  defers openBatchBuyConfirm via setTimeout(0) and relies on
  fresh-per-render closures. No recordAutosave on purpose: batch buys
  persist indirectly via the event-sync effect seeing the prepended
  📦 event. Has a local formatMoneyFull copy (importing App's would be
  a cycle). Checkout UI lives in InvestTab's cart strip (Review & Buy /
  Clear) — the old fixed cart bar died with the legacy shell.
- `KidsApp.tsx` — separate simplified kids mode
- `public/educators.html` — standalone B2B offer page at /educators
  (netlify.toml redirect; linked from the ModeSelector footer);
  playbook in `docs/b2b-classroom-packs.md`, ready-to-paste outreach
  copy (NGPF/Reddit posts + email variants) in `docs/outreach-drafts.md`
- `docs/architecture-map.md`, `docs/implementation-plan.md`,
  `docs/ui-refactor-map.md` — HISTORICAL (pre-refactor snapshots; each
  carries a banner). `HANDOVER.md` is the current starting point; `docs/roadmap.md` separates current priorities from history.

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

## Deployment reference — verify before use

The historical host is Netlify site `tycoonjan22026`, associated with
`github.com/Pieter2023/tycoon-step`. The local branch remains
`codex/game-overhaul-20260503-223748`, but the new game work is uncommitted.
No remote branch comparison or public-site verification was performed for
this handover. Read HANDOVER.md for the release boundary and inspect the
actual hosting project before publishing. The old direct branch-to-main
push recipe is intentionally removed so it cannot be mistaken for the next step.

Function configuration uses server environment variables. Do not copy their
values into documentation. Historical gotcha: changing an environment value
may require redeployment to replace warm function instances.

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
  try to delete those from disk. Use a separately reviewed release workflow; see HANDOVER.md.

## Conversion / GTM funnel work (2026-06-28)

Context: zero sales since the store went live. Diagnosis (multi-agent GTM
analysis) = a distribution problem, not a product problem: the game is
North-America-localized but the only channel activated was Pieter's SA
friends list, the whole outreach kit was written but never sent, AND there
was **zero analytics** so the funnel was invisible. This session fixed the
in-app funnel leaks the analysis found + built the missing teacher asset.
**Code changes are LOCAL ONLY — not committed/pushed/deployed yet** (Pieter's
call). All verified: `tsc --noEmit` clean, 22 files/159 tests green, cold-visitor
flow + unlock modal + analytics events confirmed live in the preview browser.

Code:
- `services/analytics.ts` (NEW) — provider-agnostic, zero-PII `track()` helper
  (supports Umami + Plausible; safe no-op until a script is added; dev logs to
  console). Funnel events wired: `app_loaded` (index.tsx), `mode_selected`
  (each ModeSelector card), `demo_started` (auto on first load), `demo_wall_hit`
  + `unlock_modal_opened` (App.tsx advanceMonth wall; ModeSelector banner/
  multiplayer), `gumroad_click` + `purchase_unlocked` (UnlockModal).
  **To turn ON: uncomment the Umami snippet in `index.html` and paste a website
  id from cloud.umami.is** — events flow automatically, no code change.
- **Password gate removed** (`ModeSelector.tsx` mount effect): first-time
  visitors now auto-start in the free demo and land on the mode picker in one
  click (was a 🔐 "Unlock the Full Game" password wall — the biggest leak). The
  old login JSX is retained but unreachable (kept as a fallback; still compiles,
  so no unused-var errors). Access-code entry now lives in the UnlockModal.
- **Price shown in-app** (`$12` was hidden until Gumroad): added
  `PURCHASE_PRICE` to `accessControl.ts`; demo banner + UnlockModal now show
  "$12 one-time". **`UnlockModal.tsx` redesigned buy-first**: price callout +
  primary "Get the full game — $12" (fires `gumroad_click`), access-code field
  demoted to a secondary "I already have an access code →" toggle.
- **Share card made viral-shaped** (`ChallengeShareCard.tsx`): `shareText` is
  now multi-line, copy-pasteable, spoiler-free, with a Wordle-style emoji
  net-worth trajectory (`▁▂▃▅▆▇█` sparkline) + a 1:1 dare; **"Copy result" is
  now the primary button**, "Save image" demoted (pasted text travels, PNGs
  don't).

New marketing assets:
- `docs/teacher-packet.md` + `public/teacher-packet.html` (live at
  **/teacher-packet** via netlify.toml redirect; linked from the /educators
  hero). A print-ready "Teach Tycoon in 45 minutes" lesson plan (objectives
  mapped to the National Standards strands, minute-budgeted run-of-show,
  debrief tied to Hindsight + Year-in-Review, facilitation key). The critic's
  highest-leverage asset: teachers buy time saved.
- `docs/gumroad-classroom-setup.md` — step-by-step to stand up the $99
  Classroom Pack as a buyable Gumroad product. Key reasoning baked in: Gumroad
  is merchant-of-record, so a SA solo seller sidesteps W-9/PO/DPA — make
  "buy → expense the receipt" the only paid path; don't chase district POs.

⚠️ **Open decision flagged for Pieter**: the GTM analysis recommends making the
Daily Challenge completable in the free demo (to feed the viral loop + pass
daily-game directory rules), but CLAUDE.md records the demo-gating as Pieter's
deliberate call ("challenge is demo-gated; card doubles as upsell"). **Left
unchanged** — needs Pieter's decision before reversing.

Next (Pieter, human GTM — see the GTM plan + `docs/outreach-drafts.md`):
1. Downgrade Supabase (ref `bvsqnhtlwklexyijvexw`) to Free to stop the ~$10/mo
   bleed (game is Netlify-static; leaderboard/saves degrade gracefully).
2. Turn on analytics (uncomment Umami snippet + paste id), then deploy.
3. Post to **FinLit Fanatics** (NOT "NGPF Fans" — the drafts have the name
   wrong), email teachers/Jump$tart affiliates, attach the lesson plan.

## Archived state & next steps (2026-06-13)

**Historical June snapshot only:** that earlier roadmap queue was reported shipped and deployed, with a clean tree and matching branches. This does not describe the September working tree. The feature surface:
daily challenge (+ streaks, OG tags, leaderboard with account linking),
run summary card, learning counterfactuals (sell hindsights +
year-in-review), cloud saves (sync code + accounts), email login with
custom SMTP — all from 2026-06-11. From 2026-06-12: the App.tsx refactor
finished (modals → `components/modals/`, tabs → `components/tabs/`, five
state clusters → `hooks/`, **legacy shell deleted**; 8467 → ~4.4k lines),
three production v2 bugs fixed along the way (TurnPreview quick-fix nav,
intro-video Continue, invest-quiz trigger), the shared Quick-actions menu
(both shells: Save/Load…Mute, Back to Menu), desktop Year/Month indicator,
multi-item batch checkout in InvestTab, and the **B2B educator offer**
(live page at /educators + `docs/b2b-classroom-packs.md` playbook).
Late 2026-06-12: both deferred refactors landed — the keyboard merge
(four binding copies → one; this FIXED keyboard nav in production, the
legacy listener had been swallowing i/p/b/c/e/s/l before the v2-aware
one ran) and the activeTab retirement (derived from v2Path + hoisted
moneyTab/lifeTab; forcedTab signals gone; sub-tabs persist across page
switches now). Both verified live via the preview browser. Also removed
the orphaned `services/tabState.ts` + its test (suite 23→22 files,
161→159 tests) and wrote the B2B outreach copy
(`docs/outreach-drafts.md`). App.tsx is now ~4.35k lines.

**Historical June queue, superseded by HANDOVER.md.** Its open threads were:
1. **B2B outreach (Pieter, not code)** — ready-to-paste copy is in
   `docs/outreach-drafts.md`; strategy/fulfillment in
   `docs/b2b-classroom-packs.md`. Next actions: optionally create the
   $99 Gumroad "Classroom Pack" product, post the demo to the NGPF
   teacher community, then work the email list. Fulfillment = add code
   to `ACCESS_CODES` + redeploy (warm functions cache env!).
2. Small optional code polish if a build session is wanted: port the
   `hideTipsEverywhere` toggle into AccessibilityModal (pref persists
   but has no UI writer); code-split the ~1.1MB main bundle.
3. Multiplayer polish — deliberately deprioritized.

If something looks broken at cold start: `docs/roadmap.md` has the full
slice-by-slice history (what moved where and why, sunset list, every
verification), and `git log --oneline -30` reads as a narrative.

Day-to-day workflow that worked well: build → test (`npm run test:run`) →
verify live in the preview browser (seed localStorage
`tycoon_authenticated=true` + `tycoon_access_tier=full`, plus
`tycoon_onboarding_seen_v1=1` + `tycoon_quick_tutorial_seen_v1=1` to
suppress tutorials; clean up keys after) → update CLAUDE.md + roadmap →
commit → push to main (auto-deploys) → confirm the new bundle is served
(poll the live HTML for the new `dist/assets/index-*.js` filename).

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
