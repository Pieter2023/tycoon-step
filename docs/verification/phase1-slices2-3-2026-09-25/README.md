# Build 47: Phase 1, slices 2 and 3, sleep and events in the world (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

Plan: `docs/phase1-plan.md`.

## Slice 2: sleep to advance the month

- **The bed.** The home desk has "Go to bed" (`HomePanel` `onSleep`, then TownModal, then App `handleSleep`). It closes the month without the turn preview (going to bed is the decision) and without leaving the city.
  - App's `advanceMonth` has a `sleepInTown` flag. The city closes only when the 2D shell must show something first: the annual report, bankruptcy, a side-hustle upgrade choice, or a fresh win.
  - The demo wall and the daily challenge's end close the city first, so their screens show.
- **The night.** A "Good night · Month N begins at sunrise" fade covers the change (2.6 s; still under reduced motion). The sky outside time-lapses to the next sunrise (`controller.timeLapse`), and the day continues from that morning (`phaseShift`). Rooms keep their fixed interior light, so the sky change shows when the player walks out.
- **Morning mail.** Once a month has closed, the home desk shows "This morning's mail":
  - money in, and the part from investments and businesses;
  - money out, tax included;
  - cash now;
  - how investment prices moved, with the reminder that price moves change worth, not cash.

## Slice 3: events happen in the world

- **Over the city.** A life event that arrives while the player is in the city opens over it instead of sending them to the 2D shell. The overlay is lighter and at z-index 1100.
- **The place line.** The card carries a "📍" line from `services/townEvents.ts`:
  - the garage bay for vehicle events;
  - home for housing, family, relationships and health;
  - a letter on the doormat for tax and legal;
  - the office for career and AI news;
  - the Exchange for the economy;
  - Main Street for business;
  - the bank for windfalls;
  - Rosa knocking for social events;
  - the square otherwise.
- **Unchanged.** The choice and its outcome are exactly as before.
- **Closing from the notice board** now reopens the city even when an event arrives, and the card shows over it.
- **"Explore now" still works.** A player who picks "Explore now" on an event card still walks the city with the card waiting (`exploringEvent`), and "Return to event" brings it back.

## Checks

- **Tests:** `test/TownSleep.test.tsx` (4): the bed calls `onSleep`, it is disabled while a turn runs, the mail appears only for the month just closed, and event places. 432 tests / 77 files and the build pass.
- **Browser (localhost:5189):**
  - went home and pressed "Go to bed": month 1 → 2 in the city, and the mail showed $5,775 in, $3,234 out with tax, $11,037 cash;
  - kept sleeping: months 2 → 3 → 4, and in month 4 "Open Source Shoutout" opened over the city with "📍 AT THE OFFICE";
  - chose "Decline politely": the city stayed open and the bed was usable again.
