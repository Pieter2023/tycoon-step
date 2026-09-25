# Build 50: Phase 1, slice 4 as an opt-in setting, "Start in the 3D city" (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

Plan: `docs/phase1-plan.md`. Making the city the default for everyone, and the dashboard as a "ledger" drawer, are still Pieter's call. This build only adds the setting so he can try it.

## What it does

- **The setting.** Quick actions (⋯) → "Start in the 3D city", an On/Off tile (`aria-pressed`). It is saved in localStorage `tycoon_start_in_city` (`1`/`0`) and is off by default. It is hidden in multiplayer and the daily challenge. Spanish: "Empezar en la ciudad 3D", Sí/No.
- **When the city opens by itself.** Once per load, that is, once per App mount: a page reload, or Back to Menu → Continue. After "Back to dashboard" the player stays on the dashboard for the rest of that load.
- **A mid-game switch waits for the next load** (the §1b bug). Turning it on used to open the city at once, underneath the open menu. Now `toggleStartInCity` marks the load as used before it changes the setting.
- **The 2D shell goes first.** If a load has any of these waiting, the dashboard shows it and the city opens once it is dealt with:
  - an event card;
  - bankruptcy;
  - the year in review;
  - a side-hustle upgrade choice.

  These are the same things that close the city when a month ends.
- **A new player's first steps stay on the dashboard.** The car-repair mission (`firstSteps`) is on the dashboard, so a load that starts with it unfinished stays there for the whole load, even after the mission is finished. That way "Compare first investments" still lands on Invest. From the next load the city opens, as the plan says ("after the first-steps journey"). Saves from before the mission existed have no `firstSteps` and open the city.
- **Code.** `App.tsx`: `startInCity`, `autoOpenedCity`, `toggleStartInCity`, and the effect below the `showCharacterSelect` state. The tile is in the Quick actions modal, which both shells share.

## Checks

- **Tests:** `test/StartInCity.test.tsx` (6 tests):
  1. opens the city on load when the setting is on;
  2. keeps the dashboard when it is off;
  3. a mid-game switch applies from the next load;
  4. a new player's first-steps mission keeps the dashboard, even once finished;
  5. an unread year in review shows first;
  6. a waiting event shows first.

  Mutation check: removing the §1b fix, turning the first-steps rule into a plain wait, or dropping the year-in-review guard each fails its own test. 443 tests / 79 files, TypeScript and the production build pass.
- **Browser (`localhost:5191`, a fresh Alex save on the demo tier).** Port 5189 still belonged to the previous chat's server, so this check used a new `tycoon-qa-5191` launch config.
  1. New game with the setting off: the dashboard showed, with first steps 1/3.
  2. Quick actions → Start in the 3D city → On. Storage held `1`, only the menu dialog was open, and there was no canvas: the city did not open.
  3. Reload → Continue: the dashboard stayed ("A surprise bill. Your first decision.").
  4. Paid the repair from cash, advanced to month 2 and chose "Continue building my buffer". The save held `reviewed: true`, and the city did not open.
  5. Reload → Continue: **the city opened by itself** (the "Freedom Square 3D neighbourhood" dialog and a `role=application` canvas). `__town.advance(90)` rendered the square at month 2 in winter, with 698 draw calls.
  6. "Back to dashboard" returned to the dashboard, and the city stayed closed.
  7. Turned it Off (`0`) → reload → Continue: the dashboard showed.
  8. Turned it On → Back to Menu → Continue, with no page reload: the city opened.
  9. At 375×812, Continue opened the city (canvas 375×558, renders), and the menu tile fits: 309×50 px, no sideways scroll.

  The console showed no errors throughout.

## How Pieter can try it

Open Quick actions (⋯ in the header), switch on "Start in the 3D city", then reload the page (or Back to Menu → Continue). To go back to the old behaviour, switch it off.
