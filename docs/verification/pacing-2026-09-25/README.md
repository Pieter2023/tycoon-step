# Build 52: pacing after the economy fix (2026-09-25, branch `town-lighting-pass`)

Pieter delegated the call on 2026-09-25: "decide whatever you think works best overall and gives the best user experience".

## The numbers

`test/strategyHarness.ts` now takes a difficulty and records when freedom coverage first passes 10/25/50/75% (`reached`). The runs cover a careful index investor (a three-month reserve, the surplus invested 60/25/15 in S&P 500, international and total market, the cheapest open option in every event) with Alex, Maria, Sarah and Marcus, three seeds each, for up to 30 years. Tables: `pace-before-maria-fix.json`, `pace-after-maria-fix.json`; the experiment itself: `pace-table.test.ts.txt`.

| Difficulty | Wins | Median months to freedom | Range | 10% by month | 25% | 50% | 75% |
|---|---|---|---|---|---|---|---|
| Easy (before) | 12/12 | 151 | 104–178 | 30 | 57 | 101 | 121 |
| Normal (before) | 12/12 | 217 | 116–282 | 66 | 101 | 149 | 185 |
| Hard (before) | 9/12, **3 bankrupt** | 280 | 151–350 | 67 | 111 | 179 | 239 |
| Easy (after) | 12/12 | 113 | 104–178 | 26 | | | |
| Normal (after) | 12/12 | 193 | 116–282 | 53 | | | |
| Hard (after) | 11/12, 0 bankrupt | 274 | 151–350 | 72 | | | |

What that means for a player:
- **The arc is honest.** 15–20 game years on Normal is what steady investing at realistic returns takes, and index investing still beats carts and cash. Distorting returns to shorten it would bring back the old wrong lesson.
- **The early game was the problem, not the total.** On Normal a careful player reached even 10% freedom only after about 5½ years. The 36-month demo ended with the meter barely moved.
- **One character could not play.** `starting-cash-flow-before.txt`:
  - Maria's ladder starts at Medical Assistant ($3,000), and her nursing loans cost $284 a month. Monthly tax withholding (build 44) left her $93 a month short on Normal and $733 short on Hard.
  - Her backstory also said "Registered nurse", which is her second rung.
  - On Hard she went bankrupt in every run, even played carefully.

## The decision

1. **Keep the honest economy.** Difficulty is the pace dial, and each difficulty's description now says its pace:
   - Easy: about 10 years;
   - Normal: 15–20 years, and better pay and a lower budget get you there sooner;
   - Hard: 20+ years, with most characters starting near break-even.
2. **Give the slow meter a countdown: "Free in about 19 years at this pace"** (`services/freedomPace.ts`).
   - **What it is.** The FIRE-calculator answer. Freedom income becomes the capital it stands for (300 × a month's income, the 4% rule). Today's monthly surplus goes into an index fund, and everything grows at 6% after inflation.
   - **What it leaves out.** Raises and new expenses. So it drops faster than time passes when the player gets a raise, cuts the budget or invests: the lever the lesson is about.
   - **Deterministic.** It never draws a random number.
   - **Other states.** "No freedom date yet: spending more than you earn" when the month runs a deficit, "paused while you're between jobs" during a layoff, "Financially free" once won.
   - **Where it shows:**
     - the dashboard under "Freedom target" (compact view) and under Passive coverage (full view);
     - the city header meter on wider screens (phones hide that line already);
     - the demo wall: "At this pace you're financially free in about N years. Unlock the full game to keep building this exact run".
   - **Calibration** (`projection-calibration.txt`). Predicted win month against the actual one:
     - at month 12 it is pessimistic, because early raises aren't in it;
     - from month 36 it is usually within 10–20%;
     - `test/FreedomPace.test.ts` pins month 60 within three years for Alex.
3. **Maria starts on a student budget.** Her backstory is now "Medical assistant finishing nursing school, on a student budget until RN pay", with `startingLifestyle: 'FRUGAL'`, like Marcus. This affects new games only.
   - She now nets +$909 a month on Normal and +$420 on Hard.
   - Her RN raise at about two years makes her a fast, frugal path: median win month 166 on Normal.
   - Hard has no bankruptcies left in the runs.

Slice 5 (one milestone track) is the other half of pacing: it gives the long middle of the game frequent, meaningful goals.

## Checks

- **Tests:** `test/FreedomPace.test.ts` (6):
  - a date for a saving newcomer, with no random draws;
  - closer with a frugal budget or money invested;
  - it matches the closed form within two months;
  - the off-track, between-jobs and free states;
  - within 36 months of the real win at month 60;
  - the labels.

  452 tests / 81 files and the build pass.
- **Browser (`localhost:5191`, the production fixture save at month 8):**
  - the dashboard shows "Free in about 19 years at this pace" under "Freedom target: $4.2K/mo · 13% covered";
  - the city header shows "Freedom 13% · $563 / $4,216 a month · free in about 19 years".
