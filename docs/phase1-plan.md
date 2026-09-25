# Phase 1: the city as the game (plan, 2026-09-25)

This plan comes from assessment §2 ("Why the city feels disconnected"). Pieter said "do next as suggested" on 2026-09-25. The work runs in slices. Each slice is additive and ships on the branch with tests, a browser check and a phone check where the layout changes. Slices 1–3 extend today's city. Slices 4–5 change the core flow, so they are prepared as options for Pieter to try before they become the default.

Status markers: ✅ done · 🔨 in progress · ⬜ not started · 🗳 needs Pieter's call.

## Slice 1: wealth you can see ✅ (build 46)

Done: the header meter, window displays (in place of the Exchange facade board and property flags), the Freedom Fountain, and milestone moments. Extra carts in the world were dropped: the square has no room outside the walkable area, and piles of carts are exactly what the economy now discourages. Receipt: `docs/verification/phase1-slice1-2026-09-25/`.

The city looks the same whether the player is broke or free. This slice ties the world to the same `financialFreedom()` figure the win check uses.

- **Header.** The city header shows progress to freedom (a bar and a percentage) next to cash.
- **The Freedom Fountain.** The square's fountain runs higher and fuller as freedom coverage grows: a trickle at 0%, full jets at 100%. Freedom Day keeps its fireworks.
- **Holdings in the world:**
  - Each coffee cart you own stands on the square (up to four). Extra carts beyond four still count, but the square only has room for four.
  - A vending route puts machines on the promenade.
  - The Exchange's facade board shows your own portfolio value and today's change.
  - The bank window shows your savings.
  - Property you own flies a small "owned" flag on the estate office's listings.
- **Milestone moments** (each fires once):
  - a ribbon-cutting at your first business;
  - a coin burst at the Exchange door for your first dividend or interest payment;
  - a caption and short fireworks the first time freedom passes 25%, 50% and 75%.

## Slice 2: sleep to advance the month ✅ (build 47)

Done as planned; the time-lapse shows outside (rooms keep fixed light), so going to bed also plays a short good-night fade. Receipt: `docs/verification/phase1-slices2-3-2026-09-25/`.

- **Sleep.** The home desk gets a bed action: "Sleep until next month" runs the same turn as the notice board's close-month button.
- **Time-lapse.** The night passes as a sky time-lapse.
- **Mail.** The month's report waits as mail on the home desk rather than as a pop-up (the 2D shell still shows it when the player isn't in the city).

## Slice 3: events happen in the world ✅ (build 47)

Done: cards open over the city with a place line (`services/townEvents.ts`). Not yet: a world moment staged at the place (the car at the garage bay, a letter prop on the doormat); the card's place line is the first step.

- Today a life event forces the player back to the 2D shell. Instead, the event card opens inside the city, framed by a world moment:
  - the car's breakdown at the garage bay;
  - a bill on the doormat;
  - Rosa knocking;
  - a letter from the bank.
- The choice and its outcome stay exactly as they are; only where they appear changes.

## Slice 4: the city as the main screen 🔨 opt-in (build 50) · 🗳 default

Done as a setting: Quick actions → "Start in the 3D city" (off by default) opens the city once per load, after the first-steps mission, with anything waiting in the 2D shell (an event, the year in review) shown first. Switching it on mid-game applies from the next load. Receipt: `docs/verification/phase1-slice4-2026-09-25/`. Still Pieter's call: making it the default, and the ledger drawer.

- The game opens in the city after the first-steps journey.
- The dashboard becomes a "ledger" drawer (a half-height sheet on phones).
- This changes the whole game's first impression, so it ships first as a setting ("Start in the city") for Pieter to try.

## Slice 5: one milestone track 🗳

- Merge quests, notice-board challenges and the guided journeys into one track.
- Cut the ~20 meters down to energy and stress.
- This is design-heavy, and needs Pieter's review of what to keep.

## Pacing note

After the economy fix, a careful index investor needs about 14–20 game years to reach freedom. A month becoming a day (slice 2's sleep, plus the existing ten-minute day cycle) is the natural pace. Autoplay remains for players who want the years to fly.
