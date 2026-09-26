# Build 55: course rewards become a raise (2026-09-25, branch `town-lighting-pass`)

Pieter approved it on 2026-09-25: "I will do the course rewards as you recommended in next session". The Self Learn certifications now pay a lasting salary raise instead of one-time cash, and a third miss costs a small retake fee. **Not released.** It changes live rewards, so it waits for Pieter's go-ahead.

## What was there

The mapping pass found more than the cash:

| Course | Pass | Miss | Perks |
|---|---|---|---|
| Master Negotiations | +$50,000 once | −$25,000 on the third miss | 5% off property/business buys, 3% more on sales, better promotion odds, **and +up to 2% salary growth a month** |
| Sales Accelerator | +$25,000 once | **−$25,000 on every miss**, even in practice after certifying; three misses locked the course for good | the college promised "sharper side-hustle income": **no code behind it** |
| EQ | +$25,000 once | third miss: $10,000 fee **and a demotion to the first rung** (a permanent pay cut) | "1.5× career XP": **never applied anywhere** |
| Compound Interest | +$1,500 and +15 credit | none | unchanged |

- **The monthly growth bug.** `getNegotiationRaiseBonus` (certified +1%, score up to +1%) was added straight to the monthly salary growth rate. That compounds to about 27% a year. In the 30-year harness, certification alone cut the median time to freedom from 191 to 109 months. The $50k barely mattered on top of it (105).
- **Double counting.** The Negotiations and EQ quiz panels stay clickable while they fade out, so a quick second click on Finish counted a second miss. Under the old rules, a double click could turn a second miss into the $25k penalty.

## The change

- **A lasting raise** (`services/courseRewards.ts`): Negotiations +5%, Sales +3%, EQ +3%. All three together come to about 11%. That is less than a paid certificate (Coding Bootcamp +15% for $15k), because these are free.
  - It is a multiplier after the education premium (`getCourseRaiseMultiplier` in `calculateEffectiveMonthlySalary`), not a one-off `salaryChangePct`.
  - Why not `salaryChangePct`: a promotion sets pay to max(current, next rung's base), so a one-off raise vanishes at the first promotion. The multiplier stays through promotions and job changes, like a degree.
  - The pay stub, taxes, the freedom pace and the Career tab all see it. The pay stub has a "Certification raise" line and still reconciles to the dollar.
  - Stored as `GameState.courseRaises` (percent per course) and sanitised on load.
  - Saves that already claimed the cash keep it and get no raise (`rewardClaimed` gates the grant). There is no claw-back.
- **Retakes:** 3 tries are included. A third miss costs **$150** (cash first, the rest on the credit card) and buys 3 more. This is the same for all three courses.
  - EQ no longer demotes.
  - Sales no longer charges per miss or in practice.
  - The save loader reopens Sales courses locked by three misses (they had already paid up to $75k).
- **Negotiation growth** counts as a yearly figure (÷12): a certified 15/15 negotiator gets about +2 points a year of extra raises. The promotion-odds bonus is unchanged.
- **The EQ perk works:** career experience builds 1.5× faster, and the fraction carries to the next month (`processTurn` step 10). The promotion outlook's "N more months" uses the same rate.
- **Finish counts once per run** (a ref guard in both quiz tabs).
- **Copy:**
  - course intros, results and notifications (English; these two tabs have no Spanish);
  - the Sales strings in `en.json` and `es.json` (`rewardEarned`, and the new `stakes` and `retakeFeeCharged`);
  - the college certificate perks in English and Spanish;
  - "REAL_ESTATE/BUSINESS" became "property and business".

## Measured

This uses `test/strategyHarness.ts` (which gained an optional `prepare` hook) with a careful index investor, Alex, Sarah, Marcus and Maria, 2 seeds each, for up to 30 years on Normal. The script is `measure-courses.test.ts.txt`. The raw output is `measure-before.txt` (old rules) and `measure-after.txt`.

| Case | Median months to freedom, before | After |
|---|---|---|
| No courses | 191 | 191 |
| Negotiations passed | 109 (105 with the $50k) | 158 |
| An old save that took the $50k (no raise) | 105 | 171 |
| EQ passed | 191 (the perk did nothing) | 181 |
| Sales passed | n/a | 179 |
| All three | n/a | 151 |

Passing all three courses brings freedom about 3 years closer on a 16-year path. The courses are now worth doing without being the whole game.

**For Pieter:** saves that were already certified in Negotiations lose most of the old monthly growth (the ~27%-a-year bug). Their past raises stay. Only the future growth rate changes.

## Checks

- **`test/CourseRewards.test.tsx`** (13 tests):
  - the raise stacks and is granted once;
  - old cash saves get no raise;
  - it survives a promotion;
  - the pay stub reconciles;
  - the pace comes closer;
  - the fee takes cash first and puts the rest on the card;
  - EQ experience is 1.5×, and the outlook uses the same rate;
  - negotiation growth stays under 5% a year;
  - the save loader keeps valid raises and reopens Sales;
  - the Sales panel is clicked through a pass and through three misses.
- **Suite:** 481 tests / 85 files pass, including `StrategyRanking`, `FreedomPace` and `ProductionSaveMigration`. TypeScript and the production build pass.
- **Browser** (`localhost:5191`, the production fixture save, Alex at month 8):
  - Sales passed through the real quiz: "Reward earned: a 3% raise that stays with you, +10 FIQ, +5 happiness". Cash stayed at $10,141.
  - The city header went from "free in about **19** years" to "**18** years", and the dashboard shows the same.
  - The pay stub at Main Street Offices: base $5,574, Certification raise $167 (3%), Alex's own perk $287, gross $6,028.
  - Negotiations: misses showed "Miss 1 of 3" and "Miss 2 of 3". The third showed "Retake fee: −$150. You have 3 more tries".
  - Three rapid Finish clicks, which counted three misses before the guard, now count one.
  - The intro cards for Negotiations and EQ show the new copy.
  - No console errors on a fresh page after a miss. An earlier React "update while rendering" warning from this change was fixed by moving the tab's own state out of the game-state updater.
