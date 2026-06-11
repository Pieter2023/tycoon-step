# Roadmap

**Last updated:** 2026-06-11 (post-marathon follow-up: leaderboard→accounts
linking shipped + verified live). Suite: 23 files / 150 tests green.
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

## Next build priorities (in order)

1. **Finish v2 shell migration / split App.tsx** (the big one — plan it
   first, likely multiple sessions). App.tsx is ~8.2k lines and still
   renders the legacy tab UI in places; `components/v2/` (DesktopShell /
   MobileShell) is the target shell. See `docs/implementation-plan.md` and
   `docs/architecture-map.md` before touching anything. Suggested approach:
   extract the big inline modals first (victory/bankruptcy/annual-report/
   challenge-end are self-contained), then per-tab components, keeping the
   145-test suite green at every step. Don't mix this with feature work.

2. **B2B classroom packs** (business + light code). Bulk access codes
   already work via the `ACCESS_CODES` Netlify env var (comma-separated —
   add e.g. `SPRINGFIELD2026` for a school; remember warm functions cache
   env, so redeploy after changing). Needs: a one-page offer (positioning:
   25+ US states mandate personal-finance courses), pricing for class sets,
   outreach list (teachers, credit unions, fee-only advisors). The learning
   counterfactuals + year-in-review features are the teacher-facing hook;
   the run summary card is the shareable artifact.

## Known issues / debt

- `App.tsx` ~8k lines single file; `App.tsx.backup`, `constants.ts.save`,
  `tycoon-eq-upgrade-code-only.zip` are junk files on disk (now gitignored)
- Build chunk-size warning (836KB main bundle) — code-split candidates exist
- Multiplayer flow exists but is unpolished; deliberately deprioritized
- Unlock state is client-side localStorage — fine at this price point;
  revisit (signed tokens + accounts) only if piracy becomes measurable
