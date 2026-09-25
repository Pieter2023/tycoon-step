# Build 46: Phase 1, slice 1, wealth you can see (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

Plan: `docs/phase1-plan.md`. The city now reflects the player's money and progress, all derived from the same `financialFreedom()` figure the win check uses.

- **Freedom meter in the city header.** It sits next to "Cash available": "Freedom 37%", a bar, and "$1,060 / $2,867 a month". The tooltip explains the 4% rule. On phones the dollar line hides.
- **Window displays on Main Street.** `components/town/townWindows.ts`, data in `services/townWealth.ts`. A lit sign in the shop window beside each door (`window-displays.jpg`):
  - "YOUR SAVINGS" and its interest at the bank;
  - "YOUR PORTFOLIO" and this month's move at the Exchange;
  - "YOUR BUSINESSES" and their profit at Main Street Co.;
  - "YOUR PROPERTIES" and their rent at Property & Co.
  
  With nothing held there, a sign is dim with a one-line nudge. Bilingual.
- **The Freedom Fountain.** `setFountain`, from `fountainLevel()`. A trickle at 0%, a jet at 50%, a tall plume at 100% or on Freedom Day. A translucent central jet and more, bigger drops (`freedom-fountain.jpg`: 0, 0.5, 1).
- **Milestone moments.** `services/townMilestones.ts` derives five milestones from the state:
  - the first business;
  - the first money earned by money;
  - freedom at 25%, 50% and 75%.
  
  The city celebrates the biggest new one once, with the badge overlay plus a moment in the world:
  - a ribbon burst over Main Street Co.;
  - a coin burst at the Exchange;
  - or a short fireworks show.
  
  All new ones are recorded in `townProgress.milestones` (App `recordMilestones`), so each fires once, even for milestones reached while away from the city (`milestone-moments.jpg`).
- **Freedom Day fireworks fixed.** Since the longer lens of build 40, the shells burst above the frame and washed out in daylight; they were invisible in the square view. They now burst over the street in front of the shopfronts, in solid saturated colours, with bigger sparks. They are clearly visible at night and visible by day.
- **Badge fix.** Every celebration badge now clears itself after 5 s. A state change while one was showing could leave it on screen for good.
- **Dev handle** (stripped from production): `__town.fountain(level)` and `__town.moment('ribbon'|'coins'|'fireworks')`.

## Checks

- **Tests:** `test/TownMilestones.test.ts` (3) and `test/TownWealth.test.ts` (3). 428 tests / 76 files and the build pass.
- **Browser (localhost:5189):**
  - entering the city with a cart owned fired "Open for business";
  - the header showed "Freedom 0% · $0 / $2,867 a month";
  - the window displays and fountain levels were captured with `__town`;
  - the ribbon, coin and fireworks moments were captured.
