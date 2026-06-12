# B2B Classroom Packs — playbook

*Created 2026-06-12. The public offer lives at
https://tycoonjan22026.netlify.app/educators (static page:
`public/educators.html`; also linked from the ModeSelector footer).*

## The offer

| Tier | Price | What they get |
|---|---|---|
| Free Demo | $0 | First 36 in-game months + kids mode (existing demo wall) |
| **Classroom Pack** | **$99 / school year** | One access code, up to 35 students, full game |
| School License | $399 / school year | Codes per teacher/period, unlimited classrooms on one campus |

Pricing rationale: $99 ≈ 8 retail copies ($12) — an easy department-card
purchase that undercuts per-seat edtech (Gimkit/Blooket Pro are $60–$120/yr
per teacher) while a 35-seat class at retail would be $420. The $399 site
license anchors the $99 pack and gives principals a number. Sold as
"per school year" so renewals are built in — rotate the codes each August.

## Fulfillment runbook (manual, ~3 minutes per sale)

1. Teacher emails (CTA on the educators page) or buys via Gumroad (below).
2. Pick a code: `SCHOOLNAME-YYYY` style, e.g. `LINCOLN-HS-2026`
   (uppercase, memorable, no spaces — students type it once per device).
3. Netlify → site **tycoonjan22026** → Environment variables →
   append the code to `ACCESS_CODES` (comma-separated).
4. **Trigger a redeploy** — warm function instances cache env values;
   without a redeploy the new code won't validate.
5. Reply with the code + the one-paragraph "getting started" snippet below.
6. Log the sale in this file's ledger (bottom) with the expiry
   (start of next school year) so codes can be rotated out.

> Getting-started snippet for the reply email:
> "Have students open https://tycoonjan22026.netlify.app on any browser
> (Chromebooks are fine), click any mode, and enter the class code when
> prompted — it unlocks the full game on that device for the year. The
> Daily Challenge (same world for everyone, ~15 min) makes a great
> bell-ringer; each January the game shows every student their own
> year-in-review to debrief."

### Optional: Gumroad product (skips the email round-trip)

Create a second Gumroad product "Tycoon — Classroom Pack" at $99
(pieterrealtor.gumroad.com, same flow as the $12 product). Turn license
keys OFF for this one; instead use Gumroad's "content" field to say the
class code arrives by email within one business day, then fulfill via the
runbook above. (Automating per-sale codes needs the Supabase era —
deliberately manual for now; volume will be low and the personal email
is a feature for teachers.)

## Outreach

**Ready-to-paste drafts live in `docs/outreach-drafts.md`** (NGPF post,
Reddit post, three email variants, pilot-reply snippet, sending notes).

**Positioning line:** 26+ US states now require a personal-finance course
to graduate; teachers are hunting for materials that aren't worksheets.
Tycoon's hooks for them: sell hindsights + year-in-review (built-in
reflection), seeded Daily Challenge (fair class competition), zero
setup/no student PII (bypasses procurement).

### Targets, in order of effort-to-payoff

1. **NGPF community** (ngpf.org) — the hub of US personal-finance
   teachers; active Facebook group ("NGPF Fans") and teacher newsletters.
   Engage as a maker sharing a free demo, not an advertiser.
2. **Reddit**: r/Teachers, r/CTE, r/personalfinance (educator threads),
   r/edtech — demo-first posts ("I built a financial life sim; the first
   3 years are free — would this work for your econ unit?").
3. **State business/CTE teacher associations** — most states with a
   mandate have one (e.g. Texas, Florida, Ohio); they run listservs and
   cheap newsletter sponsorships.
4. **Jump$tart Coalition state affiliates** — directory on jumpstart.org;
   they exist to push financial literacy materials to schools.
5. **Credit unions** — community outreach teams have financial-literacy
   budgets and school relationships; pitch sponsored class packs
   ("Your CU's logo on the class leaderboard" is a future upsell).
6. **Homeschool co-ops** (HSLDA forums, local co-op directories) — the
   $12 individual copy already fits; mention the family angle.

### Email template (teacher cold/warm)

> Subject: A personal-finance sim your class will ask to keep playing
>
> Hi {name} — I'm Pieter, and I built Tycoon, a month-by-month financial
> life simulator: students earn a salary, face 80+ life events, invest
> through market cycles, and win when passive income covers 110% of their
> expenses. When a student panic-sells, the game shows them a year later
> what holding would have been worth — the debrief writes itself.
>
> The first 3 simulated years are free to try with your class today (any
> browser, no accounts, no installs): https://tycoonjan22026.netlify.app
>
> If it lands, a Classroom Pack is $99/year for up to 35 students — one
> code, two minutes of setup. Details: …netlify.app/educators
>
> Happy to set up a code for a free pilot unit with your class — just
> reply with your school name.

The "free pilot" close costs nothing (it's a code in an env var) and
converts better than a discount.

## Sales ledger

| Date | School / buyer | Code | Tier | Expires | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
