# Roadmap

**Last updated:** 2026-06-12. **The entire 3-item queue is DONE** (all
verified live + deployed, suite 23 files / 161 tests green throughout):
(1) phase-3 state organization — all 5 clusters are hooks (useSaveLoad,
useAutoplay, useTutorial, useCoachHints, useBatchBuy); (2) the legacy
shell is RETIRED — all five integration tests drive v2, the
uiV2Enabled/tycoon_ui_v2 plumbing is gone, ~2,300 lines + 4 orphan files
deleted, coach ribbon ported as a floating overlay, three production v2
bugs fixed (quick-fix nav, intro-video Continue, quiz trigger),
multi-item batch checkout restored, desktop got a Year/Month indicator +
the shared Quick-actions menu (Mute + Back-to-Menu); (3) B2B classroom
packs — live offer page at /educators + docs/b2b-classroom-packs.md
playbook. App.tsx 8467 → ~4.4k lines across the whole refactor
(6082 → 4406 this session). Working tree clean; remote main == branch.
**Next session: no queued build work.** Open threads: Pieter's B2B
outreach (playbook has next actions); multiplayer polish remains
deprioritized. Late 2026-06-12: both deferred refactors landed —
keyboard-system merge + full activeTab retirement (see below).
Slice history + sunset lists below.

## Cold-start context for the next session (refreshed 2026-06-12 EOD)

- **Where the refactor stands: FINISHED.** App.tsx (~4.4k lines, from
  8,467) is state + orchestration only: modals in `components/modals/`
  (21 files), tab content in `components/tabs/` (statically imported by
  the `components/v2/` pages), five state clusters in `hooks/`
  (useSaveLoad, useAutoplay+useAutoplayScheduler, useTutorial,
  useCoachHints, useBatchBuy; useTabIntroVideo predates them). The
  legacy shell is DELETED — v2 renders unconditionally.
- **Key facts you'd otherwise rediscover the hard way:**
  - ~~`uiV2Enabled`~~ GONE (2026-06-12): no flag, no `tycoon_ui_v2` key;
    all five integration tests drive the v2 shell (AccessibilitySmoke
    stubs matchMedia per-test to pick DesktopShell vs MobileShell).
  - ~~`activeTab` mirror~~ RETIRED (late 2026-06-12): it's now a
    useMemo over the v2 router (v2Path + moneyTab/lifeTab, which are
    hoisted to App — Money/Life page layouts are controlled via
    `activeTab`/`onTabChange` props; the never-cleared `forcedTab`
    signals are gone). Type is `TabId | null` (null = Money/Reports and
    Life/Family, surfaces with no legacy TabId — coach gates never
    match there, by design). Side effects: sub-tabs persist across
    page switches; re-navigating to an already-selected sub-tab works.
  - Keyboard input is ONE system (late 2026-06-12): a single
    `createGameShortcuts` config in App.tsx feeds both
    `useKeyboardShortcuts` and the "?" overlay. Before the merge there
    were FOUR copies, and the legacy listener preventDefault-ed every
    key first — keyboard nav (i/p/b/c/e/s/l) was silently broken in
    the v2 shell. Enter confirms the turn preview; Shift+A toggles
    autoplay; unmodified letters refuse shifted presses.
  - The extracted gameplay modals are CONTROLLED components — state and
    side effects deliberately stayed in App (see the slice notes below
    for what stayed where and why). Same for the hooks: each hook's
    header comment names its deliberate quirks (TDZ call-site
    constraints, effect-order dependencies, plain-function handlers).
  - `tycoon_onboarding_seen_v1` semantics are a HARD test contract
    (5 integration tests seed it to suppress the tutorial overlay).
  - Verification workflow that works: seed localStorage
    `tycoon_authenticated=true` + `tycoon_access_tier=full` (+
    `tycoon_onboarding_seen_v1=1`, `tycoon_quick_tutorial_seen_v1=1` to
    suppress tutorials) in the preview browser, play, clean up after.
    Deploy = push to main, then poll the live bundle filename until it
    matches `ls dist/assets/index-*.js` after a local build.
  - QuestLog has a button with the same label as the claim-all confirm
    dialog's button — scripted clicks must target the modal's instance.
  - The headless preview browser reports width 0 → MobileShell; use
    preview_resize (e.g. 1440px) to exercise DesktopShell.
- **Recommended next moves:** none queued — see "Next build priorities"
  item 3 for Pieter's B2B outreach actions. (The former deferred
  refactors — keyboard-system merge, activeTab retirement — both
  landed late 2026-06-12.)

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

1. **App.tsx split, phase 3: state organization** (the M-3/L-2 question
   from `docs/implementation-plan.md`; everything else from phase 2 is
   done — modals out, tabs out, QW-3 hook, dead code, v2 feature port).
   Recommended approach: incremental hook extraction in the
   `useTabIntroVideo` mold (find a cohesive state cluster + its handlers,
   move them verbatim into a hook, one commit each). Avoid a big-bang
   context/Zustand rewrite until the hooks make the seams obvious. Same
   working rules: one slice per commit, suite green at every step,
   verify live in the preview.
   - **Slice 5, batch-buy cluster — DONE 2026-06-12 (PHASE 3 COMPLETE)**:
     `hooks/useBatchBuy.ts` owns cart mode/quantities, the priced cart
     memo, and all six handlers — moved byte-identical. Three
     load-bearing subtleties (workflow-mapped, then confirmed by a
     zero-findings adversarial review): (1) handlers stay PLAIN
     functions — InvestTab's "Buy Nx" replaces the cart then defers
     openBatchBuyConfirm via setTimeout(0), relying on fresh-per-render
     closures; (2) recordAutosave is deliberately NOT a dep — batch
     buys persist indirectly when the event-sync effect sees the
     prepended 📦 event (live-verified: purchase landed in the
     autosave); (3) hook-local formatMoneyFull copy (App's is module-
     scope; importing it would create a cycle). Raw setBatchBuyQuantities
     returned (InvestTabProps Dispatch contract). Pre-existing quirks
     left alone: closed-over totalCost can overstate the toast on
     partial buys; the v2 cart-bar activeTab gate; handlePlayAgain not
     clearing the cart. App.tsx 5682 → 5479. Suite 160 green. Verified
     live in v2: toggle ON → qty 2 → Buy 2x → confirm dialog
     (TOTAL $2,004) → cash 10,000→7,996, 2x Treasury Bills @ $1,002
     basis, 📦 event in autosave, cart cleared, mode stayed ON,
     toggle OFF cleared the qty UI; console clean.
   - **Slices 3+4, tutorial + coach-hints clusters — DONE 2026-06-12**
     (one working session, single commit — both verified together):
     `hooks/useTutorial.ts` (6 useStates: step tutorial, quick-tutorial
     auto-open with the MODE==='test' guard intact, auto-popups +
     hide-tips prefs; owns/exports the 3 storage keys —
     `tycoon_onboarding_seen_v1` is a hard contract with 5 integration
     tests; imports TUTORIAL_TIPS/QUICK_TUTORIAL_STORAGE_KEY from leaf
     modal files for cycle safety; dead `quickTutorialVideoRef`
     deleted). `hooks/useCoachHints.ts` (ribbon state + 5s auto-clear,
     5 focus refs + scroll-into-view, one-time Self Learn hint, and the
     Re-open Preview pill sub-cluster — `offerReopenPreview` is private;
     exports CoachTarget/CoachHintData types). `showTutorialVideos`
     deliberately stays in App (video-chooser modal state, couples to
     introVideo). Neither hook uses useI18n (strings are hardcoded —
     intentional deviation). App.tsx 5885 → 5682. Suite 160 green;
     adversarial review workflow: ZERO findings across 4 lenses.
     Verified live: fresh profile → quick-tutorial auto-opened → step
     tutorial → Next/Skip persists onboarding key; legacy shell →
     Self Learn coach ribbon rendered after tab switch + one-time key
     semantics confirmed (v2 run had already consumed the hint —
     ribbon is legacy-only UI, a known retirement-phase item).
     Remaining cluster: batch-buy.
   - **Slice 2, autoplay cluster — DONE 2026-06-11 (late session)**:
     `hooks/useAutoplay.ts` owns the speed state (init from per-slot
     pref), the year-in-review pause, per-slot pref persistence
     (persist-before-reload order is load-bearing: speed carries over
     on slot switch, clobbering the target slot's stored pref — a test
     now pins this), derived labels/tooltip, and a consolidated
     `toggleAutoplay` (was 7 duplicated expressions). Second export
     `useAutoplayScheduler` (the timer) is called separately after
     `advanceMonth`/`isAutoplayBlocked` exist — TDZ makes a single call
     site impossible; `isAutoplayBlocked` (~16 modal flags) stays in
     App. The old combined localStorage effect was split: autoplay-pref
     write moved to the hook, LAST_SAVE_SLOT write stays in App.
     `test/Autoplay.test.tsx` rewritten from a synthetic harness to 11
     real-hook tests (incl. i18n tooltip resolution + the carry-over
     clobber case, both proven by mutation testing to be the only
     discriminating cases). Deps arrays of unchanged App code left
     untouched (incl. the now-unneeded autoPlaySpeed in advanceMonth's
     array — prune later if wanted). App.tsx 5906 → 5885. Suite 23
     files / 160 green; verified live (Shift+A on → pref '1000', months
     auto-advanced 1→3, Shift+A off → pref 'off', month frozen, console
     clean). Workflow-mapped + adversarially reviewed (3 confirmed
     findings, all addressed). Remaining clusters: coach/tutorial,
     batch-buy.
   - **Slice 1, save/load cluster — DONE 2026-06-11 (late session)**:
     `hooks/useSaveLoad.ts` owns the 9 save/load useState hooks,
     SAVE_SLOTS, the autosave ticker effect, `recordAutosave` (incl.
     throttled cloud upload + its lastCloudUploadRef), the relative-time
     formatters + `autosaveStatus`, and all 8 slot handlers (save/load/
     delete/rename/export/import + openSaveManager + refresh) — moved
     verbatim. Hook calls `useI18n()` itself; cross-cutting deps
     (currentSaveSlot stays in App — the history storage keys and
     autoplay prefs read it; gameState; run lifecycle setters; showNotif)
     are passed in. **showNotif moved up ~520 lines** to before the hook
     call — it's a `const`, referencing it in the deps object earlier is
     a TDZ crash (the slice-1 handlePlayAgain lesson again). Bonus: dead
     `formatDateTime` deleted from App (zero call sites — the modal has
     its own copy). App.tsx 6082 → 5906 lines. Suite 23 files / 150
     green; verified live in v2 preview: save to Slot 1 with label →
     localStorage `adult:slot1` written, advance month → autosave
     updated to month 2, load Slot 1 → back to month 1 + toast + modal
     closed, console clean. Remaining clusters: autoplay (speed,
     preferences, block-list), coach/tutorial, batch-buy.

2. ~~Retire the legacy shell~~ **DONE 2026-06-12** (three commits:
   v2 nav/quiz fixes → five-test migration → deletion).
   - **Prep fixes (production v2 bugs found by the mapping workflow):**
     TurnPreview quick-fix goTo + intro-video Continue only wrote the
     legacy activeTab (silent no-op in v2) → new `navigateToTab`
     dual-writes both routers; invest-quiz trigger gated on
     activeTab===INVEST (unreachable in v2) → re-keyed on the invest
     filter changing. DesktopShell gained a Year/Month indicator.
   - **Test migration (correction: FIVE App-mount tests, not two):**
     MortgageModal + GlossaryQuiz + GameMathRegression +
     TabScrollRestore (renamed: invest state persistence; window-scroll
     restore assertions dropped — v2 never had the behavior) +
     AccessibilitySmoke (rewritten against the v2 mobile chrome).
   - **Deletion:** the ~810-line legacy fragment, the whole
     uiV2Enabled/readUiV2Preference/tycoon_ui_v2 plumbing (v2 renders
     unconditionally now), the keyboard effect's legacy arms, and the
     dead-code sweep (scroll-restore machinery, Event Lab dev tool,
     confetti-on-next-month, batch cart bar + mobile bottom stats bar
     [both redundant], TAB_SHORTCUTS, lazy tab decls, ~15 unused
     imports). Files deleted: HelpDrawer, DashboardWidget, OverviewTab,
     Confetti. App.tsx 5479 → 4421 lines.
   - **Ported:** coach ribbon → floating overlay over both shells
     (hints were firing invisibly in v2); TabErrorBoundary wraps all 8
     v2 page renders (tab crash no longer white-screens); InvestTab's
     cart strip gained Review & Buy / Clear buttons (the review found
     the deleted cart bar was the ONLY multi-item checkout — the strip
     was display-only; multi-item flow verified live, TOTAL correct).
   - **Sunset (retired with the shell, resurrectable from git):**
     HelpDrawer tips surface + hide-tips toggle UI, DashboardWidget 2x2
     grid, Event Lab (commit d9531bd has it last), per-tab scroll
     memory, confetti-on-next-month, legacy 9-tab nav + KPI header.
   - **Follow-ups:** ~~desktop-v2 utility menu~~ + ~~Back-to-Menu~~
     DONE same day — the "Quick actions" Modal is now shared by both
     shells (desktop trigger: "More options" in DesktopShell
     headerActions; state renamed overflowMenuOpen) and gained
     Mute/Unmute + Back to Menu (recordAutosave first; hidden in
     multiplayer / without onBackToMenu — the legacy conditions).
     AccessibilitySmoke now asserts the full menu on BOTH shells
     (suite 23 files / 161). ~~Still queued: merge the two keyboard
     systems, full activeTab retirement~~ — both DONE late 2026-06-12
     (see cold-start notes; the keyboard merge also fixed v2 keyboard
     nav, which the legacy listener had been swallowing).

3. **B2B classroom packs — assets SHIPPED 2026-06-12**; what remains is
   the actual outreach (Pieter's court).
   - **Live offer page**: /educators (static `public/educators.html`,
     "ledger editorial" design — Fraunces + IBM Plex Mono; netlify.toml
     redirect for the clean URL; linked from the ModeSelector footer
     "For educators"). Tiers: Free Demo / Classroom Pack $99/yr (35
     students, one code) / School License $399/yr. CTAs are mailto:
     pieter@houseofrealtors.co.za (swap if a dedicated address is made).
   - **Playbook**: `docs/b2b-classroom-packs.md` — pricing rationale,
     3-minute fulfillment runbook (ACCESS_CODES + the redeploy gotcha,
     code naming, reply snippet, sales ledger), optional $99 Gumroad
     product setup, outreach targets (NGPF community first, then
     Reddit/CTE associations/Jump$tart/credit unions) + email template
     with a free-pilot close.
   - Next actions for Pieter: (1) optionally create the $99 Gumroad
     "Classroom Pack" product, (2) post the demo to the NGPF community,
     (3) work the email template down the target list.

## Known issues / debt (refreshed 2026-06-12)

- `App.tsx` ~4.4k lines (down from ~8.5k; refactor complete).
  `App.tsx.backup`, `constants.ts.save`, `tycoon-eq-upgrade-code-only.zip`
  are junk files on disk (gitignored)
- ~~Two keyboard systems~~ MERGED late 2026-06-12 (single
  useKeyboardShortcuts config; the Shift+A double-fire quirk is fixed —
  unmodified letters refuse shifted presses).
- ~~`activeTab` mirror~~ RETIRED late 2026-06-12 (derived from the v2
  router; see cold-start notes).
- `hideTipsEverywhere` pref persists but has no UI writer since the
  legacy tips toggle sunset — if a stuck device ever suppresses the
  quick-tutorial, clear `tycoon_hide_tips_v1`; consider porting the
  toggle into AccessibilityModal.
- Build chunk-size warning (~1.1MB main bundle) — code-split candidates
  exist (recharts already split)
- Multiplayer flow exists but is unpolished; deliberately deprioritized
  (no v2 "Turn X/3" chip — sunset with the legacy shell)
- Unlock state is client-side localStorage — fine at this price point;
  revisit (signed tokens + accounts) only if piracy becomes measurable
