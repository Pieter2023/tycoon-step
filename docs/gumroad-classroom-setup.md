# Stand up the $99 Classroom Pack on Gumroad — step by step

*Created 2026-06-28. Goal: give a convinced teacher a **buy button** at the
moment of intent, instead of a `mailto:` thread. Code delivery stays manual
(env-var + redeploy) for now — only the checkout becomes self-serve.*

## Why Gumroad is the right rail (read this first)

You are a solo seller based in South Africa. You **cannot** issue a US W-9,
sign a district data-privacy agreement as a vendor, or fulfill a purchase
order — and many districts won't transact with an unincorporated foreign
individual. **Gumroad is the merchant of record**: it takes the card, handles
sales tax/VAT, and emails the teacher a receipt they can expense. That sidesteps
the entire foreign-vendor problem. So:

- **Make "buy on Gumroad → expense the receipt" the only paid path.** Don't
  chase POs/invoices you can't fulfill.
- Keep the personal email option for teachers who want a free pilot first
  (it converts better than any discount and costs one env-var line).

## Create the product (~10 minutes)

1. Gumroad → **pieterrealtor.gumroad.com** → **New product** → type **Digital
   product**.
2. Name: **Tycoon — Classroom Pack (up to 35 students, 1 school year)**.
   Price: **$99**.
3. **Turn license keys OFF** for this product (the $12 consumer product uses
   them; the classroom code is issued by you manually, so you don't want
   Gumroad generating a key here).
4. **Content / "Receipt" section** — paste this so the buyer knows what happens
   next:
   > Thanks! Your class access code will be emailed to the address on this
   > receipt within one business day (usually much sooner). It unlocks the full
   > game for up to 35 students for the full school year. Questions:
   > pieter@houseofrealtors.co.za
5. **Custom fields** (Settings → "Ask customers for additional information"):
   add **School name** and **Class start date** so you have what you need to
   mint the code without a back-and-forth.
6. **Receipt note / redirect**: optionally set the post-purchase note to link
   the lesson plan: `https://tycoonjan22026.netlify.app/teacher-packet`.
7. Publish. Copy the product URL (it'll look like
   `https://pieterrealtor.gumroad.com/l/tycoon-classroom`).

## Wire it into the site (~5 minutes)

- In `public/educators.html`, the **Classroom Pack** tier CTA is currently a
  `mailto:` link (the `.tier.featured` block). Change its `href` to the new
  Gumroad product URL and the label to **"Buy a Classroom Pack — $99"**. Keep a
  smaller "or email for a free pilot first" link beneath it (the free pilot is
  still your best opener).
- Leave the **School License ($399)** CTA as `mailto:` for now — those are rare
  and worth a conversation.
- The footer's "Individual copies $12" link already points at the consumer
  product; leave it.

## Fulfill a sale (~3 minutes, manual — same runbook as a pilot)

When Gumroad emails you that a Classroom Pack sold:

1. Pick a code: `SCHOOLNAME-YYYY` (uppercase, memorable), e.g. `LINCOLN-HS-2026`.
2. Netlify → site **tycoonjan22026** → Environment variables → append the code
   to **`ACCESS_CODES`** (comma-separated).
3. **Trigger a redeploy** — warm function instances cache env values; without a
   redeploy the new code won't validate. *(This is the #1 footgun.)*
4. Reply to the buyer with the code + the getting-started snippet
   (`docs/outreach-drafts.md` §6) and the lesson plan link
   (`/teacher-packet`).
5. Log it in the sales ledger at the bottom of `docs/b2b-classroom-packs.md`
   with the expiry (start of next school year) so codes can be rotated each
   August.

> Volume will be low at first, so manual is fine — and the personal email is a
> feature for teachers, not a bug. Automating per-sale codes is a later job
> (needs the Supabase era); don't build it until manual actually hurts.

## A note on the pilot → paid mechanism

Pilot codes don't expire on their own, so there's no built-in "moment of
decision" that nudges a free pilot to a $99 purchase. Cheap fix for now: when
you issue a pilot, tell the teacher in the email that **the pilot code is good
through a set date** (e.g. "active through Oct 15"), then send one "your pilot's
wrapping up — keep it for the class for $99: <Gumroad link>" note near that
date. That single follow-up is where most conversions will actually happen.
