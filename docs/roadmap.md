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

## Next build priorities (in order)

1. **Run summary card for normal games** — same artifact on win/bankruptcy/quit;
   put a "Send this to someone who needs it" CTA on the victory screen.
2. **Learning counterfactuals** — after big decisions show the one-line
   "what would have happened" (e.g. sold in a trough vs held); end-of-year
   report comparing player vs a sensible benchmark. This is the feature
   teachers/parents will share.
3. **Cloud save + accounts (Supabase)** — unlocks daily-challenge leaderboard,
   cross-device play, and knowing who players are. Park real-time multiplayer;
   async leaderboard competition is 80% of the value for 5% of the work.
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
