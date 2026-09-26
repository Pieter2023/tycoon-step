# Tycoon: Financial Freedom Simulator

## Current handover — September 26, 2026 (09:25 PDT)

Read [HANDOVER.md](HANDOVER.md) sections 1–6 before acting. It has the state, the decisions waiting on Pieter, the next steps in order, the run/QA recipes and the latest gotchas. The assessment and improvement plan are in [docs/assessment-2026-09-25.md](docs/assessment-2026-09-25.md).

- **Production:** builds 40–66 are live after ten releases. Four were on 2026-09-25, and builds 60–65 followed on 2026-09-26:
  - 40–51 at 17:21 PDT, deploy `6ab70fda`;
  - 52–54 at 18:19 PDT, deploy `6ab71d6d`;
  - 55–57 at 21:01 PDT, deploy `6ab743ad`;
  - 58–59 at 22:27 PDT, deploy `6ab757c4`;
  - 60 on 2026-09-26 at 06:45 PDT, deploy `6ab7cc8d`;
  - 61 on 2026-09-26 at 07:13 PDT, deploy `6ab7d2f2`;
  - 62 on 2026-09-26 at 07:41 PDT, deploy `6ab7d981`;
  - 63–64 on 2026-09-26 at 08:02 PDT, deploy `6ab7de71`;
  - 65, analytics on, on 2026-09-26 at 08:40 PDT, deploy `6ab7e74f`;
  - **66, the sound audit and upgrade, on 2026-09-26 at 09:16 PDT: `origin/main` = `6bb25f1`, deploy `6ab7efe0`.**

  Both were fast-forwards from the branch. Receipts and rollbacks: `docs/verification/release-2026-09-25/`. (Before that, production was a Sept-13 CLI deploy, not `origin/main`.)
- **Work branch `town-lighting-pass`:** checked out and pushed to `origin`. `main` is fast-forwarded to it for each release, and later commits wait here for the next one. It holds, all now live:
  - the Sept-13 atelier work, committed as found;
  - the sky-lit lighting pass and a longer camera lens (build 40);
  - the skinned townspeople from `scripts/build-town-people.py` (build 41). Every joint must keep an identity rest rotation.
  - the AI-modelled Alex (build 42): Meshy 7 from concept 2 (38 Higgsfield credits), rigged onto the town skeleton by `scripts/build-town-hero.py`, loaded only when the character is Alex. Clips for both come from `scripts/town_rig.py`.
  - the walk-bob fix (build 43), an opt-in `?stats` readout and the first real-phone check (60 fps on Pieter's iPhone);
  - the economy fix, Phase 0 (build 44): prices earn expected returns, saturating businesses that can lose money, shortfalls on a credit card, monthly tax withholding, freedom at the 4% rule (`financialFreedom` in `services/gameLogic.ts` drives the win check and every progress bar). Ranking test: `test/StrategyRanking.test.ts`.
  - the traffic-deadlock fix (build 45);
  - Phase 1 slices 1–3 (builds 46–47): wealth you can see (header freedom meter, Main Street window displays, the Freedom Fountain, milestone moments), sleep at home to end the month, events open over the city. Plan: `docs/phase1-plan.md`;
  - lighter sign lettering (build 48) and property costs, PMI, one FHA loan, no lender re-roll, a slower credit climb (build 49; `services/propertyCosts.ts`).
  - Phase 1 slice 4 as an opt-in setting (build 50): Quick actions → "Start in the 3D city" (localStorage `tycoon_start_in_city`) opens the city once per load, after the first-steps mission and anything waiting in the 2D shell. Test: `test/StartInCity.test.tsx`.
  - unique asset ids and a real production save as a migration test (build 51): `test/fixtures/save-production-2026-09-13-month7.json`, `test/ProductionSaveMigration.test.tsx`. Run it after any economy or save change.
  - pacing (build 52): "free in about N years at this pace" (`services/freedomPace.ts`, `components/FreedomPaceLine.tsx`), Maria's student-budget start, each difficulty's description states its measured pace.
  - Phase 1 slice 5 (build 53), the Freedom Track (`FREEDOM_TRACK` in `constants.ts`, the chapter logic in `updateQuests`, `services/freedomTrack.ts`, `components/FreedomTrack.tsx`):
    - the core quests in four chapters, run inside the quest engine, with story and side goals in two slots (`MAX_ACTIVE_QUESTS` 5);
    - new `FREEDOM_COVERAGE` milestones (coast 17%, 25/50/75%);
    - the goals log, the dashboard card, the notice board and the city strip all read it;
    - month-close milestones are celebrated (App's `seenReady` ref);
    - energy and stress lead the Life tab and Profile.
  - events staged at their place in 3D (build 54, `components/town/townEventStage.ts`): a marker, a letter on the doorstep, hazard lights on the parked car.
- **Build 55, live** (`3364c54`): the course rewards. Receipt: `docs/verification/course-rewards-2026-09-25/`.
  - A pass pays a lasting raise instead of cash: Negotiations +5%, Sales +3%, EQ +3% (`services/courseRewards.ts`). It is stored as `GameState.courseRaises` and applied after the education premium by `getCourseRaiseMultiplier`, so promotions keep it. Saves that claimed the old cash get no raise.
  - A third miss costs a $150 retake fee and buys three more tries.
  - Also fixed: the negotiation growth bonus was monthly (~27% a year) and is now yearly; the EQ 1.5× XP perk now applies; Finish counts once per quiz run.
  - Test: `test/CourseRewards.test.tsx`.
- **Builds 56–57, live:**
  - the hero Alex blinks (`e135de3`): eyelid meshes on the Head joint from `build_eyelids()` in `scripts/build-town-hero.py`, driven by `createBlink`; dev handle `__town.blink(amount)`;
  - a cleaner face texture (`e09ec4b`): `repair_face()` replaces Meshy's seam lines with the local 3D skin tone.
  - Receipts: `docs/verification/hero-blink-2026-09-25/`, `docs/verification/hero-face-2026-09-25/`.
- **Builds 58–59, live:**
  - a real wave, a Sit clip, tapered hair and a `sitHips` fix (`a36d1b8`, `docs/verification/characters-polish-2026-09-25/`);
  - baked ambient occlusion for the city (`6bde70f`, `docs/verification/city-ao-2026-09-25/`). The AO step is in `scripts/build-town-assets.py`; the strength is `TOWN_AO_STRENGTH` in `createTownScene.ts`.
- **Phone check of builds 52–59: passed** (2026-09-26, `docs/verification/phone-2026-09-26/`). 56–60 fps on Detailed over 3 minutes, 60 on Auto; the café shift and sleep-at-home work on the iPhone.
- **Build 60, live since 2026-09-26 06:45 PDT:** dialogs fit a phone. The shared `components/Modal.tsx` centred every dialog in a fixed, non-scrolling overlay, so on a phone the Sales quiz and Save and load lost their close and action buttons off-screen. A phone player couldn't take the certification.
  - The overlay now scrolls, and the dialog has auto top/bottom margins (centred when it fits, top-aligned when it doesn't).
  - `TutorialModal` keeps its bottom sheet (margins 0). The city modals pass `overflow: 'hidden'`.
  - Test: `test/Modal.test.tsx`. Checked on the iPhone.
- **Build 61, live since 2026-09-26 07:13 PDT:** tileable paving, brick and asphalt (`components/town/townSurfaces.ts`, applied by `dressTown`).
  - Painted at runtime with normal maps; no download.
  - The city model gives the building walls their own `wall*` materials, and `MODEL_VERSION` is `20260926b`.
  - iPhone: 58–60 fps on Detailed.
  - Receipt: `docs/verification/surfaces-2026-09-26/`. Test: `test/TownSurfaces.test.ts`.
- **Build 62, live since 2026-09-26 07:41 PDT:** the phone check's findings (`docs/verification/phone-findings-2026-09-26/`).
  - Events take their place by id first (`EVENT_PLACES` in `services/townEvents.ts`), with a new Property & Co. place for rentals.
  - The destination row gets ‹ › buttons when it overflows.
  - On phones, rooms swap the destination row for a one-row room bar ("?", walk-to, "Exit ↗"), and the journey strip is one row. The bank's 3D view goes from 305 to 467 px at 393×659.
- **Pieter's three calls, "yes to all 3" (2026-09-26):**
  - **Build 63, live:** the 3D city is the default screen. `tycoon_start_in_city` is on unless it is `'0'`; `docs/verification/phase1-slice4-default-2026-09-26/`. The ledger drawer is not built.
  - **Build 64, live:** the hero's cheek. `smooth_face_normals()` in `scripts/build-town-hero.py` relaxes the skin's shading normals (custom normals; no vertex moves), and `HERO_VERSION` is `20260926a`; `docs/verification/hero-cheek-2026-09-26/`.
  - **The daily challenge's demo gate stays.** Pieter confirmed on 2026-09-26.
- **Build 66, live since 2026-09-26 09:16 PDT (release 10): the sound audit and upgrade** (`docs/verification/sound-2026-09-26/`). Pieter heard the city "tweet loudly like a broken speaker" at the bank teller.
  - The cause: the night-cricket layer in `townAtmosphere.ts` fed a 27 Hz square LFO straight into its volume, so a 4.3 kHz whine played at −10.5 dBFS RMS everywhere whenever city sound was on. It is fixed and guarded by `test/Sound.test.ts`, which fails on the old code.
  - A second bug: an envelope's gain started at 1.0 before its first event, which could let a full-scale one-sample crack through. `envelope()` now zeroes it first.
  - There is one engine (`services/audioService.ts`): one AudioContext, a limiter, a room reverb, `ui` and `world` buses, and no audio before the first click. It pauses when the tab is hidden and when muted, and the toast chime no longer doubles an action sound.
  - Every UI sound is redesigned (`services/soundDesign.ts`: ka-ching, a coin that grows with the amount, a fanfare…).
  - The city soundscape is rebuilt (`townSfx`): gusting wind, rain, a babbling fountain, real cricket rhythms, three birds, varied footsteps, Doppler car passes, firework booms, café bells.
  - **The city's Sound button is now the game's sound setting** (the same as Quick actions → Mute), so the city soundscape plays by default when sound is on, from the first click. Pieter can reverse this default.
  - Dev meter: `window.__audio.output`.
  - **Not ear-tested:** the listening files are in the receipt's `audio/`.
- **Validation:** 518 tests / 89 files, `tsc` and the production build pass on the branch.
- **The branch is ahead of `main` only by docs** (the release-10 receipt). There is no unreleased code.
- **Next session, first:**
  - a Chromebook check (needs a Chromebook), which matters more now that the city is the first screen;
  - the ledger drawer, only if Pieter wants it;
  - the visual items never started (assessment §3): a modular building kit, splitting the city for culling, the male hip/waist ratio, and the hero's remaining texture lines.
- **Waiting on Pieter:** his ear on build 66's sounds (live, or the receipt's `audio/`): what to change; whether to build the ledger drawer.
- **Analytics: ON since 2026-09-26** (build 65, release 9).
  - Umami Cloud, Hobby plan ($0), in Pieter's account. Site "Tycoon", Website ID `a8297643-15e9-4122-95b8-0b49cf4a7f98`.
  - Dashboard: https://cloud.umami.is/analytics/us/websites/a8297643-15e9-4122-95b8-0b49cf4a7f98
  - The snippet in `index.html` has `data-domains="tycoonjan22026.netlify.app"`, so local and LAN QA never counts. The funnel events come from `services/analytics.ts`.
  - To exclude a browser on the live site: `localStorage.setItem('umami.disabled','1')`. The browser pane's production origin already has it.
- **Visual QA:** the town scene is a code-split chunk, so verify town deploys by grepping `TownModal-*.js`/`createTownScene-*.js`, not `index-*.js`. When the browser pane is hidden, use the dev handle `__town.advance(frames)` with `scripts/qa/capture-receiver.py` (HANDOVER §5).
- **Ports and saves:**
  - The user preview is `127.0.0.1:5187`.
  - QA runs on `tycoon-qa-5191`, which holds the production fixture save.
  - `tycoon-lan-preview` serves `dist/` on `0.0.0.0:5190` for the phone. Both were left running on 2026-09-26.
  - Older chats' servers may still hold 5188 and 5189.
  - The capture receiver uses 5199, or 5198 if that is held; see HANDOVER §5.
  - Preserve the user's save and all tracked and untracked work.
- **Pushing:** pushing the backup branch is fine. Merging to `main`, which deploys, needs Pieter's go-ahead; earlier deploys were authorised case by case. The release recipe (fast-forward only, verify the live bundle and a real save) is in `docs/verification/release-2026-09-25/`.

Current feature/source map and run instructions are in the handover. Detailed evidence is in [docs/completed-improvements.md](docs/completed-improvements.md); remaining priorities are in [docs/roadmap.md](docs/roadmap.md). The iPhone is checked; a Chromebook check remains open. No new paid service is needed for the implemented prototype.

The older dated service, business and deployment sections below are historical reference. They are not proof of current hosting/account state and do not supersede this handover.

Financial life-sim game (React 18 + TypeScript + Vite + Tailwind 4). Player advances
month-by-month building passive income; wins when passive income ≥ 110% of expenses.
Target market: **North America** (USD, FHA loans, US credit scores — intentional).

## Commands

- `npm run dev` — dev server on :5173 (Netlify functions NOT served; see Access below)
- `netlify dev` — dev server WITH functions (needed to test /api/validate-access)
- `npm run test:run` — vitest suite (89 files / 518 tests on `town-lighting-pass`, 2026-09-26 build 66; integration tests drive the v2 shell)
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
- `components/v2/` — THE shell UI (DesktopShell sidebar / MobileShell; the June SidebarShell/DashboardScreen/DashboardScreenEnhanced files were dead and were removed 2026-09-07
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
- `KidsApp.tsx` — separate simplified kids mode; "Visit your square" opens `components/town/KidsSquareModal.tsx` (same 3D scene, four kid stops)
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
  **ON since 2026-09-26 (build 65):** Umami Cloud Hobby, Website ID
  `a8297643-15e9-4122-95b8-0b49cf4a7f98`, snippet live in `index.html`.
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

✅ **Decision (2026-09-26): kept demo-gated.** Pieter confirmed: "keep the daily challenge demo-gated". History: the GTM analysis recommends making the
Daily Challenge completable in the free demo (to feed the viral loop + pass
daily-game directory rules), but CLAUDE.md records the demo-gating as Pieter's
deliberate call ("challenge is demo-gated; card doubles as upsell"). **Left
unchanged** — needs Pieter's decision before reversing.

Next (Pieter, human GTM — see the GTM plan + `docs/outreach-drafts.md`):
1. Downgrade Supabase (ref `bvsqnhtlwklexyijvexw`) to Free to stop the ~$10/mo
   bleed (game is Netlify-static; leaderboard/saves degrade gracefully).
2. ✅ Analytics on (2026-09-26, build 65): Umami Cloud Hobby, live on the site.
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
