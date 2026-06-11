# Roadmap

**Last updated:** 2026-06-11 (daily challenge follow-ups session)

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

## Next build priorities (in order)

1. **Test the email account flow end-to-end** (Pieter, ~3 min): Manage
   Saves → Cloud Sync → enter your email → "Link email" → click the
   confirmation link → panel should show your email; then on another
   browser "Sign in instead" → magic link → "Restore from my account".
2. **Custom SMTP (Resend)** before telling players about email login.
3. **Daily leaderboard names → accounts** (optional polish): attach
   user_id to daily_scores so names follow accounts.
4. **Finish v2 shell migration** — App.tsx still renders legacy tab UI in
   places; also consider splitting App.tsx (8k lines) per
   `docs/implementation-plan.md`.
5. **B2B classroom packs** — bulk codes via `ACCESS_CODES` already work;
   needs a one-page offer + outreach to US personal-finance teachers
   (25+ states mandate the course), credit unions, fee-only advisors.

## Known issues / debt

- `App.tsx` ~8k lines single file; `App.tsx.backup`, `constants.ts.save`,
  `tycoon-eq-upgrade-code-only.zip` are junk files on disk (now gitignored)
- Build chunk-size warning (836KB main bundle) — code-split candidates exist
- Multiplayer flow exists but is unpolished; deliberately deprioritized
- Unlock state is client-side localStorage — fine at this price point;
  revisit (signed tokens + accounts) only if piracy becomes measurable
