# Roadmap

**Last updated:** 2026-06-11, late session (leaderboard→accounts linking +
the FULL modal-extraction phase of the App.tsx split shipped, verified
live, and deployed; App.tsx 8467 → 6348 lines). Suite: 23 files / 150
tests green.
**Next session starts at "Next build priorities" below.**

## Recently shipped (2026-06-10)

- Restored ~180 deleted public assets (event/EQ/quiz images, tutorial videos)
- Quick Tutorial video: HEVC .mov → H.264 .mp4 (now plays in all browsers)
- AI risk badge reflects current threat (phase pressure / disruption ramp),
  not static career vulnerability
- **Free demo + paid unlock gate** (see `docs/monetization-setup.md`):
  server-validated access codes, Gumroad license support, 36-month demo,
  unlock-mid-run modal, multiplayer gated to full version
- Repo hygiene: untracked node_modules/dist/.env.local from git

## Business setup — DONE 2026-06-10 (selling is live)

1. ~~Create Gumroad product~~ ✓ "Tycoon — Full Version Unlock", $12 USD,
   per-sale license keys ON: https://pieterrealtor.gumroad.com/l/tycoon
   (product edit: gumroad.com/products/mziiqp/edit; payouts connected)
2. ~~Netlify env vars~~ ✓ `ACCESS_CODES=Bokke` and `GUMROAD_PRODUCT_ID`
   set on site tycoonjan22026; `/api/validate-access` verified live (Bokke → valid)
3. ~~PURCHASE_URL~~ ✓ set in `services/accessControl.ts` (commit e013f7f,
   made via GitHub web UI; deployed + verified in live bundle)
4. ~~Rotate the OpenAI API key~~ ✓ rotated; new key in `.env.local` and in
   Netlify env (`OPENAI_API_KEY`, secret, production + deploy-preview).
   Avatar generation verified live (200 + image). Gotcha: Netlify functions
   cache env on warm instances — trigger a redeploy after changing env vars.

License flow tested end-to-end 2026-06-10: $0 creator test purchase via
single-use 100%-off code → real key issued → `/api/validate-access`
returned `{valid:true, source:'gumroad'}`.

## Recently shipped (2026-06-11)

- **Daily challenge + share card** (built, needs push/deploy + playtest):
  - `services/dailyChallenge.ts` — UTC-date challenge id → FNV-1a seed →
    fixed daily character; 120-month run; `challenge` field on GameState.
  - All sim randomness now flows through seedable `rand()` in gameLogic
    (`seedSimForMonth` re-seeds per month from the challenge seed, so market
    cycle + event draws match for all players; normal games stay Math.random).
  - `components/ChallengeShareCard.tsx` — canvas 1200×630 card: outcome,
    score, net-worth curve, 3 defining events, game link; download/share/copy.
  - App.tsx: challenge end overlay at month 120 (or bankruptcy), win toast
    instead of blocking victory modal, autosave disabled in challenge runs
    (never clobbers adult autosave). ModeSelector: 4th card "Daily Challenge".
  - Demo tier hits the standard 36-month wall mid-challenge (per Pieter:
    challenge is demo-gated; share card doubles as upsell).
  - Tests: services/dailyChallenge.test.ts (11) — suite now 18 files / 97.

## Recently shipped (2026-06-11, follow-ups session)

- **Daily challenge follow-ups** (former priority 1) — all done:
  - Full 120-month run playtested headlessly: new vitest case runs the entire
    sprint twice and asserts determinism + finite final net worth
    (`services/dailyChallenge.test.ts`). Suite now 18 files / 105 tests.
  - **Daily streak**: `getDailyStreak`/`recordDailyChallengePlayed` in
    `services/dailyChallenge.ts` (localStorage `tycoon_daily_streak_v1`,
    tracks current + best, recorded on challenge start). Mode card shows
    "🔥 N-day streak" / "keep your streak!" nudge; end overlay shows the
    streak with a come-back-tomorrow line.
  - **OG meta tags** in `index.html` (Open Graph + Twitter card) pointing at
    new `public/og-image.jpg` (1200×630, derived from the hero image), so
    shared links unfurl properly. Per-run dynamic OG images need a server —
    revisit with Supabase (priority 3).
  - Leaderboard still arrives with Supabase (priority 3).

- **Run summary card for normal games** (former priority 1) — done same day:
  `ChallengeShareCard` generalized (header/outcome/footer/share-text branch on
  `gameState.challenge`; `pickRunEvents` falls back to the event feed minus
  NEWS/DECISION/WARNING noise). Reachable from the victory modal
  ("Send this to someone who needs it"), the bankruptcy modal ("Share the
  damage report"), and anytime via HUD menu + mobile overflow + MoreScreen
  ("Run summary card"). Tests in `components/ChallengeShareCard.test.ts`
  (suite 19 files / 110 tests).

- **Learning counterfactuals** (former priority 1) — done same day:
  - **Sell hindsights**: selling an asset creates a "ghost holding"
    (`GameState.soldPositions`) that tracks what it would be worth if held,
    on the market's expected path (no rand() draws — daily-challenge
    determinism proven by test). 12 months later a 🎓 Hindsight one-liner
    lands in the event feed ("would be worth $X today (+45%). Selling in a
    downturn locks in losses").
  - **Year-in-review modal** (normal games only): each January, net worth
    start→end, market gains + passive income for the year, and the benchmark
    "without your investments you'd have ended at $X — your money earned $Y
    on its own". Hindsights resolved during the year are repeated there.
    Autoplay pauses while it's up. Powered by `GameState.yearStats`
    accumulators (reset each January) + transient `annualReport`.
  - Tests: `services/counterfactuals.test.ts` (13) — suite 20 files / 123.
    Verified live in dev: modal math correct, hindsight event fired at +12mo.

- **Daily-challenge leaderboard** (the 80%-value slice of the Supabase
  milestone) — done same day: Supabase project `tycoon`
  (ref bvsqnhtlwklexyijvexw, us-east-1, $10/mo), `daily_scores` table with
  insert/select-only RLS + one-score-per-device-per-day unique constraint
  (PATCH/DELETE verified blocked live). `services/leaderboard.ts` (publishable
  key, PostgREST direct), `components/DailyLeaderboard.tsx` in the challenge
  end overlay: submit name + score, today's top 10, "You're #N today".
  14 new tests; suite 22 files / 137.

- **Cloud saves via sync code** (cross-device play, no accounts needed) —
  done same day: `cloud_saves` table locked to SECURITY DEFINER RPCs
  (exact UUID code required, no enumeration, 2MB cap). ☁️ Cloud Sync panel
  in the Save Manager: toggle auto-backup (autosave uploads, 60s throttle),
  copy your code, back up now, restore on any device ("Played before?
  Restore from Cloud" button on fresh devices). Full backup→wipe→restore
  round-trip verified against production Supabase. 8 new tests; suite
  23 files / 145.

- **Supabase auth accounts** — done same day (Pieter configured the
  dashboard): silent anonymous accounts on cloud-sync enable, email linking
  (anonymous-upgrade via confirmation link), magic-link sign-in on new
  devices, `user_saves` table with auth.uid() RLS (cross-user access
  verified blocked). Cloud backups prefer the account slot; sync codes stay
  as fallback/sharing. supabase-js added. NOTE: built-in mailer is rate
  limited (~2-4 emails/hr) — add custom SMTP (Resend) before promoting
  email login. Email flow needs a real-inbox test by Pieter.

- **Email flow + custom SMTP** — both verified live 2026-06-11. Real-inbox
  round-trip (guest → link email → magic link on 2nd browser → account
  restore) passed; auth emails now send from `Tycoon
  <noreply@prismaiservices.ca>` via Resend (30/hr, adjustable). Two fixes
  landed from testing: emailRedirectTo uses window.location.origin, and
  getAccount uses getUser() for freshness. Email login is production-ready.

- **Daily leaderboard names → accounts** — done 2026-06-11 (later session):
  migration `daily_scores_user_id` adds nullable `user_id uuid references
  auth.users on delete set null`; insert policy tightened to
  `user_id is null or user_id = auth.uid()`. `submitDailyScore` sends the
  session access token as Bearer + user_id when signed in (new
  `getSessionAuth` in `services/auth.ts`), retries unlinked on 401/403;
  signed-out flow unchanged. Name input prefills from the account email's
  local part when no saved name. All four RLS paths verified against
  production (anon+spoof 401, anon plain 201, own-uid 201, foreign-uid 403);
  test rows + throwaway anon user cleaned up. Suite 23 files / 150 tests.
  Skipped optional extras (per-user uniqueness, streak column) — revisit if
  multi-device dupes ever show up on the board.

- **App.tsx split, slice 1: end-game modals extracted** — done 2026-06-11
  (same later session): new `components/modals/` (VictoryModal,
  BankruptcyModal, ChallengeEndModal, RunSummaryModal, AnnualReportModal +
  barrel). Visibility conditions stay in App.tsx; contents moved verbatim.
  The duplicated restart block in win/bankruptcy collapsed into one
  `handlePlayAgain` useCallback (placed AFTER `shouldShowOnboarding` —
  it's a useCallback, so referencing it earlier in a deps array is a TDZ
  crash). App.tsx 8467 → ~8240 lines. Suite still 23 files / 150 green;
  run-summary modal verified in the preview browser (HUD menu → card
  renders, console clean). Next slices: remaining inline modals
  (mortgage / emergency-cash / quick-tutorial...), then per-tab extraction.

- **App.tsx split, slice 2: utility modals** — done 2026-06-11 (same
  session): ConfirmDialogModal (+ ConfirmDialogConfig type moved),
  AccessibilityModal (+ AccessibilityPrefs type; calls useI18n itself),
  ImageLightboxModal, EmergencyCashModal (sale math in component, state
  mutation stays in App's onSell), GlossaryModal. App.tsx 8240 → 7889
  lines. Verified in preview: accessibility modal (i18n strings resolve,
  prefs toggle round-trips), glossary, confirm dialog via quest Claim All
  (gotcha: QuestLog has a button with the SAME label as the dialog's
  confirm — match the modal's button, not the first DOM hit). Suite 150
  green. Still inline: scenario, turn-preview, mortgage, market-special,
  side-hustle-upgrade, save-manager, tutorials, intro-video, dashboard
  detail — the gameplay-coupled ones, each needs its own pass.

- **App.tsx split, slice 3** — done 2026-06-11 (same session):
  SideHustleUpgradeModal (formatUpgradeEffects moved in),
  MarketSpecialModal (controlled — selection state + execute handlers stay
  in App; MarketSpecialAction type moved + re-exported),
  DashboardDetailModal (pure display; recharts now imported ONLY there —
  App.tsx no longer imports recharts at all), QuickTutorialModal (owns
  dont-show checkbox + video ref + storage key, exported as
  QUICK_TUTORIAL_STORAGE_KEY), TutorialModal (owns the static TUTORIAL_TIPS
  array, exported — App reads .length for isTutorialActive). App.tsx
  7889 → 7241 lines. Verified in preview as a FRESH user (localStorage
  cleared): quick-tutorial video modal auto-opens → close → step tutorial
  appears → Next advances → Skip persists tycoon_onboarding_seen_v1.
  Dashboard-detail is compile-verified only (its tiles render in the
  legacy md: overview, unreachable in the v2 shell). Suite 150 green.
  Still inline: scenario, turn-preview, mortgage, save-manager,
  intro-video — the truly gameplay-coupled set.

- **App.tsx split, slices 4–8: gameplay modals, one commit each** — done
  2026-06-11 (same session). MortgageModal (presentational; App keeps
  buildMortgagePreview + the confirm-dialog step; covered by the
  existing integration test), TurnPreviewModal (Quick Fixes UI in the
  component; goTo/useAction side effects stay as an App prelude;
  verified live — Next → preview → Advance Month), ScenarioModal
  (category emoji/bg ternary chains → lookup maps; coach ref + dead
  parallax ref passed as props; verified live — event fired, image
  lightbox opened, choice resolved into the timeline),
  TabIntroVideoModal (fully controlled; the 8-hook video state machine
  stays in App pending the QW-3 useVideoPlayer consolidation;
  compile-verified — Watch entry points only render in month-1/legacy
  states), SaveManagerModal (controlled; label drafts + import state
  stay in App because handleImportSave reads them; verified live —
  save to slot, load, manager closes). **All modals are now out of
  App.tsx: 7241 → 6348 lines** (8467 at day start; 19 files in
  components/modals/). Dead code spotted for a future sweep: the
  scenarioImage parallax springs/handlers in App.tsx are defined but
  never attached to any element. (Correction discovered while updating
  docs: tab content was already fully extracted + lazy-loaded in
  components/tabs/ — the next phase is the v2 shell decision and state
  organization, not tabs; see "Next build priorities".)

## Next build priorities (in order)

- **App.tsx split, phase 2 mechanical wins** — done 2026-06-11 (same
  session): dead scenarioImage parallax code deleted (incl. the unused
  imageContainerRef prop on ScenarioModal), and **QW-3 shipped** — the
  8-hook intro-video state machine is now `hooks/useTabIntroVideo.ts`
  (helpers, autoplay effect, and <video> handlers moved verbatim; App
  consumes one hook object). App.tsx 6348 → 6082 lines. Suite 150 green.
  **Shell investigation findings** (for the decision below): `uiV2Enabled`
  defaults TRUE in prod with no in-app toggle (override: localStorage
  `tycoon_ui_v2` or env `VITE_UI_V2`); `MODE === 'test'` forces it FALSE,
  so the integration tests run against the LEGACY shell — it is the test
  harness. DashboardWidget drill-downs and intro-video Watch/Replay
  affordances exist ONLY in the legacy branch, i.e. no production user
  can reach them today.

- **Orphaned legacy features ported to v2** — done 2026-06-11 (same
  session, Pieter's call: port rather than retire). (1) Dashboard
  drill-downs: CommandDashboard metric cards (Cash/Net Worth/Passive) are
  now clickable → DashboardDetailModal, which gained an internal
  switcher row so all four charts (net worth / cash flow / credit / AI)
  are reachable from any entry point. (2) Tutorial videos: new
  `TutorialVideosModal` lists every TAB_INTRO_VIDEO_CONFIG entry
  (title/description/duration/poster) and plays them via
  `introVideo.open(tabId, {autoplay:true})`; reachable from the desktop
  HUD menu, the mobile overflow, and MoreScreen. Verified live in v2:
  card → modal → all four charts; menu → chooser → video AUTOPLAYS.
  Legacy shell stays as the test harness (retire-later candidate).
  Found while testing: `/images/financial-planner-poster-16x9.jpg` 404s
  (lost in the asset restoration) — chooser hides broken thumbnails
  gracefully; restoring the file is a spawned follow-up task.

1. **App.tsx split, phase 2: v2 shell decision + state organization**
   (plan it first, likely multiple sessions). The modal phase is DONE
   (2026-06-11 — all 20 modals in `components/modals/`, App.tsx
   8467 → 6348 lines; see "Recently shipped" above for the slice-by-slice
   record and what stayed controlled vs. moved). Tab content was ALREADY
   fully extracted and lazy-loaded (`components/tabs/`, 9 files) before
   this push — don't re-plan that. What actually remains in App.tsx:
   - the **legacy-vs-v2 shell duality**: an ~800-line legacy header +
     tab-nav + main-content branch renders when `uiV2Enabled` is false;
     DashboardWidget tiles and tab-header Watch buttons only exist there.
     Decide whether v2 absorbs those affordances or the legacy branch is
     retired/extracted wholesale.
   - ~4.4k lines of state + handlers (44+ useState hooks) — the M-3/L-2
     state-management question from `docs/implementation-plan.md`.
   - the 8-hook video state machine (QW-3 `useVideoPlayer` consolidation,
     now feeding TabIntroVideoModal via props).
   - dead scenarioImage parallax code (safe delete).
   Same working rules: one slice per commit, suite green at every step,
   verify live in the preview, don't mix with feature work.

2. **B2B classroom packs** (business + light code). Bulk access codes
   already work via the `ACCESS_CODES` Netlify env var (comma-separated —
   add e.g. `SPRINGFIELD2026` for a school; remember warm functions cache
   env, so redeploy after changing). Needs: a one-page offer (positioning:
   25+ US states mandate personal-finance courses), pricing for class sets,
   outreach list (teachers, credit unions, fee-only advisors). The learning
   counterfactuals + year-in-review features are the teacher-facing hook;
   the run summary card is the shareable artifact.

## Known issues / debt

- `App.tsx` ~6.3k lines (down from ~8.5k; legacy shell branch + state
  organization pending);
  `App.tsx.backup`, `constants.ts.save`, `tycoon-eq-upgrade-code-only.zip`
  are junk files on disk (now gitignored)
- Dead code in App.tsx: scenarioImage parallax motion values/springs/
  handlers are defined but never attached (feature was removed upstream)
- Build chunk-size warning (836KB main bundle) — code-split candidates exist
- Multiplayer flow exists but is unpolished; deliberately deprioritized
- Unlock state is client-side localStorage — fine at this price point;
  revisit (signed tokens + accounts) only if piracy becomes measurable
