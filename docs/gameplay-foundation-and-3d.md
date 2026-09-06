# Gameplay foundation and Freedom Square

Current overview: September 5, 2026. **Implemented and tested locally; not publicly deployed.** Read [the current handover](../HANDOVER.md) first. [The chronological receipt](completed-improvements.md) preserves each earlier stage and its validation.

## Financial learning foundations

- Save each committed single-player decision and expose failed saves with a downloadable backup.
- Separate distributions from price gains: spot crypto pays no passive cash, savings principal stays nominal, knowledge does not manufacture returns, and older holdings migrate without changing quantities/cash/cost basis/completed goals.
- Teach actual downside and clearly disclose Easy-mode protection and illustrative hindsight.
- Begin with a playable repair choice and a simpler dashboard/investment introduction; keep the full catalogue available.
- Require earned reserve progress and a buffer; fresh borrowing cannot satisfy the saving goal.

## Playable city

The optional Three.js scene opens from Play, including during pending events. Exploration is allowed while pending financial decisions still block spending. It supports camera-relative keyboard movement, tap-to-walk, joystick, follow/overview camera, obstacle-aware city routes and saved city viewpoint. Destinations connect to the existing investment/portfolio flow. Dashboard shortcuts and autoplay pause while the city is open.

The opening journey connects reserve planning, coffee-cart ownership, a trading permit, an extra owner shift and a monthly review. Ownership/upgrades appear in the scene; the entrepreneur badge persists without paying a reward.

The bank has a walkable interior and animated teller, savings deposits/withdrawals and existing loan comparisons. The cart has price/stock decisions, service animation and a receipt. The café has a walkable room, lease, furnishing upgrades, monthly price/stock/staff plans, trading receipts and net-worth accounting. Rain, puddles, residents and optional ambience add activity to the square.

## Hands-on café activity

Visit café → Enter café → Play a shift. Free practice works before ownership. Walk to the counter to take an order, make the drink at the machine, carry it and serve the guest at a table or the takeaway counter. The next-action button walks first and acts after arrival; E and manual movement are also available.

Guests arrive, queue, sit, wait and react. Price, stock, helper and pace affect the outcome. Receipts distinguish sales, waste, committed supplies, wages, operating costs and profit/loss. Practice changes no money. A paid extra owner shift charges costs at the start and credits each completed sale once; it is separate from normal monthly trading and limited to one per month. Saved paid service resumes paused; hiding/leaving pauses time. Month advance ends unfinished service without another payout.

## Art and tools

Original editable Blender city and character assets are included. Character clips: Idle, Walk, Run, Serve, Wave, Celebrate. Bank/café furniture, seated poses, carried cups, coffee steam, labels, rain and lighting are implemented at runtime. See [the art workflow](../assets/town/README.md).

No extra account or subscription was needed for the implemented work. Additional required subscription cost: **$0/month**. Existing hosting/cloud/AI expenses are separate. Blender is already installed; no Higgsfield subscription or integration was made. Recheck current pricing before proposing a future paid tool.

## Verified and still open

Latest code-stage verification: **236 tests in 38 files**, TypeScript and production build passed, with existing chunk-size warnings. Browser playtests covered desktop 1280×720 and phone-sized 390×844, financial actions, save/reload, complete practice service and paid shift outcomes; final consoles were clear. See [QA checklist](qa-checklist.md) and [logs](verification/gameplay-2026-09-05/tests.log).

Physical-phone performance/multitouch remains untested. New town copy is largely English-only. Full accessibility review, precise hand/foot contact, crowd collision, free furniture placement, additional interiors and broader dialogue remain open. This is a local playable preview with simplified fictional economics; authentication, cloud services, payments and public deployment were not validated in this upgrade stage.
