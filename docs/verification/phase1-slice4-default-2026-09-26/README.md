# Build 63: the 3D city is the default screen (2026-09-26)

Pieter's call on 2026-09-26 ("yes" to making the city the default screen). Phase 1 slice 4 had been an opt-in setting since build 50 (`docs/verification/phase1-slice4-2026-09-25/`).

## What changed

`App.tsx`: "Start in the 3D city" is now **on unless the player switched it off**. `tycoon_start_in_city` is read as `!== '0'`; before, it was `=== '1'`.

The rules from build 50 are unchanged:
- **When it opens:** once per load (a page reload, or Back to Menu → Continue). "Back to dashboard" keeps the player on the dashboard for the rest of that load.
- **The 2D shell goes first:** anything waiting there shows before the city opens: an event card, bankruptcy, the year in review, or a side-hustle upgrade choice.
- **A new player:** stays on the dashboard for the first-steps mission (the car repair); the city opens from the next load.
- **Never in** multiplayer or the daily challenge. Kids mode is a separate app.
- **The Off switch:** Quick actions → "Start in the 3D city" → Off. It applies from the next load and is kept per browser.

Who sees the change:
- A player who never touched the setting now lands in the city.
- A player who switched it off keeps the dashboard.
- A player who switched it on sees no change.

**Not done:** the plan's "ledger" drawer, a half-height money sheet opened from inside the city (`docs/phase1-plan.md`, slice 4). The dashboard stays a full screen one tap away ("Back to dashboard").

## Checks

- `test/StartInCity.test.tsx` (8 tests): the default opens the city for a returning player; Off keeps the dashboard; a mid-game switch applies from the next load in both directions; plus the build-50 rules (first steps, year in review, waiting event).
- Full suite: 494 other tests unchanged. The integration tests start new games, which keep the dashboard for first steps.
- **Browser** (`localhost:5191`, the production fixture save at month 8 with first steps reviewed):
  - with no setting stored, Continue opened the city;
  - with `0` stored, Continue kept the dashboard.
- **Devices:** the city was checked on the real iPhone today (`phone-2026-09-26/`, `surfaces-2026-09-26/`, `phone-findings-2026-09-26/`). The Chromebook, the classroom device, is still untested. The graphics governor steps down on slow frames, and a machine without WebGL gets the city's text panels, the same as before.
