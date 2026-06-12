# Paid Unlock — Setup Guide

The game now ships with a free demo + paid full-version unlock. This doc covers
the one-time setup to start selling.

## How it works

- **Free demo**: anyone can play 36 in-game months (3 years) of the adult
  simulation plus all of kids mode, no code needed. At month 37 an in-game
  modal asks for an access code — on success the same run continues.
- **Full game**: unlocked by an access code, validated server-side by
  `netlify/functions/validate-access.ts`. Codes never ship in the JS bundle.
- **Multiplayer**: full version only.
- Existing beta users (already logged in) are grandfathered into the full game.

## 1. Netlify environment variables

In Netlify → Site settings → Environment variables, set:

| Variable | Purpose | Example |
|---|---|---|
| `ACCESS_CODES` | Comma-separated list of valid codes (case-insensitive). Use for beta testers, manual sales, and bulk/classroom packs. | `Bokke, SCHOOL-PACK-001, FRIEND-2026` |
| `GUMROAD_PRODUCT_ID` | Optional. When set, Gumroad license keys for this product are also accepted as codes. | `abcDEF123==` |

Keep `Bokke` in `ACCESS_CODES` so current beta testers' codes keep working.

## 2. Gumroad product (recommended store)

1. Create a product on Gumroad (digital product, ~$9–15 USD).
2. In the product settings, enable **"Generate a unique license key per sale"**.
3. Copy the product ID from the product's settings page into the
   `GUMROAD_PRODUCT_ID` env var on Netlify.
4. In the product description, tell buyers: *"Your license key is your access
   code — paste it into the game's unlock screen."*
5. Put the product URL into `PURCHASE_URL` in `services/accessControl.ts` —
   the unlock screens then show a "Don't have a code? Get one here" link.

Refunded or charged-back purchases are rejected automatically on validation.

Lemon Squeezy works similarly if preferred (license API differs — the function
would need a second branch).

## 3. Classroom / bulk sales (B2B)

No extra infrastructure needed: generate a batch of codes (e.g.
`RIVERSIDE-HS-01` … `-30`), append them to `ACCESS_CODES`, invoice the school
directly. One code per seat or one shared code per classroom — your choice.

**As of 2026-06-12 this is a real offer**: live page at
https://tycoonjan22026.netlify.app/educators (Classroom Pack $99/yr for
35 students, School License $399/yr) — full pricing rationale,
fulfillment runbook, and outreach plan in `docs/b2b-classroom-packs.md`.

## 4. Local development

Plain `vite dev` doesn't serve Netlify functions. In dev builds only, the code
`Bokke` is accepted as a local fallback (see `services/accessControl.ts`).
Run `netlify dev` instead to exercise the real function locally.

## Notes / future hardening

- The unlock result is stored client-side (`tycoon_access_tier` in
  localStorage). A technical user could flip it in dev tools — acceptable for
  a low-price indie title; revisit with signed tokens + accounts if piracy
  ever becomes measurable.
- Validation endpoint: `POST /api/validate-access` with `{ "code": "..." }` →
  `{ "valid": true|false }`.
