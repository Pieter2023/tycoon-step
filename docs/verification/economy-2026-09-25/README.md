# Build 44: economy fix, Phase 0 (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

Pieter approved the fix list in assessment §1 on 2026-09-25 ("do next as suggested"). The game had been teaching the wrong lesson:
- Coffee-cart stacking won in about 6 years.
- Keeping everything in savings beat the stock market.
- An S&P 500 investor almost never reached freedom.

## Before and after

`test/StrategyRanking.test.ts` (harness `test/strategyHarness.ts`) runs four characters (Alex, Maria, Sarah, Marcus) × two seeds for up to 30 years:
- The scripted player keeps a three-month reserve and invests any surplus above it by one rule.
- In every event they avoid loans when cash allows.

| Strategy | Before: wins / 8 | Before: median win month | After: wins / 8 | After: median win month |
|---|---|---|---|---|
| Diversified index (60% S&P 500, 25% international, 15% total market) | 2 | 244 | **8** | **217** (about 18 years) |
| Coffee carts only | 8 | 76 | 0 | — |
| Savings (HYSA) only | 8 | 292 | 3 (frugal Marcus) | 358 |
| Do nothing | 0 | — | 0 | — |

Full tables: `strategy-before.json` and `strategy-after.json`. The test asserts the ranking:
- the index investor wins at least 6 of 8;
- the index investor beats carts and savings on wins;
- the index investor beats savings on median win month;
- doing nothing never wins.

## What changed (`services/gameLogic.ts`)

1. **Prices earn their expected return.**
   - Each holding drifts at its catalogue expected return minus its cash yield. For the S&P 500 that is 10% − 1.5% = 8.5% a year.
   - Noise is lognormal at the holding's own volatility, so riskier holdings have a lower typical (median) return.
   - One market-wide shock a month moves correlated holdings together (index funds .95, stocks .7, crypto .5).
   - The cycle tilts returns above or below the path, and the tilts sum to zero over a cycle.
   - The blanket 1%-a-month crash rule is gone. It was why growth stocks and bitcoin had negative median returns.
   - `expectedHeldGrowth` (hindsight) follows the same expected path with no random draw, and sold positions now keep their `marketItemId`.
   - Normal draws use the inverse normal CDF: one uniform draw each, and a low draw is always a bad month.
2. **Businesses.**
   - Each extra unit of the same business earns 75% of the one before (`businessUnits`): carts approach four carts' worth of income.
   - Profit swings with operating leverage 3 (costs are about two-thirds of sales) and with the cycle, and there is no floor, so a volatile business can lose money (SaaS in some months; a cart almost never).
   - The buy card shows what the next unit adds ("$23/mo for unit 2 (shares your customers)").
   - The portfolio range uses the same model (`businessIncomeRange`).
3. **Shortfalls become credit-card debt.**
   - A month the cash cannot cover goes on the card: 24% APR, minimum payment 3% (at least $35), `CARD_ID` `credit-card`.
   - The limit is a multiple of pay set by credit score (`creditLimit`).
   - Only the part past the limit is a missed payment (credit −25, late fees, the old bankruptcy rule).
   - Bills are never forgiven any more.
   - The turn preview explains the card.
4. **Tax is withheld monthly.**
   - `incomeTaxFor`: the simplified 2023 brackets after a $13,850 standard deduction, less $2,000 a child. Brackets and deduction rise with inflation.
   - The tax is a `taxes` line in both cash-flow calculations and inside `expenses`.
   - The April lump sum is retired. At late-career salaries it had forced an IRS payment plan that looked like huge debt.
   - The pay stub's "comes off before you see it" is now true.
5. **Financial freedom (`financialFreedom`).**
   - Market holdings (index funds, stocks, bonds) count at the 4% rule, or their cash payments if higher.
   - Savings deposits count only their interest above inflation.
   - Businesses and rentals count what they pay.
   - The target is 110% of living costs, excluding income tax on a salary.
   - The win check and every progress bar use it: dashboard, Money page, home desk, Rosa, job security.

## Checks

- **Tests:** `test/EconomyPhase0.test.ts` has 12 tests:
  - tax brackets, withholding and no April event;
  - the card inside and past its limit;
  - business saturation and losses;
  - index drift near 8.5% with fewer than 35% losing years;
  - the growth stock's median below its mean;
  - freedom counting and the win.
- **Counterfactual tests:** updated to the new expected path.
- **Balance envelope:** the 36-month demo envelope (`test/BalancePass.test.ts`) still passes unchanged.
- **Totals:** 417 tests / 73 files (`tests.log`) and the production build (`build.log`).
- **Browser (localhost:5189):**
  - Money page "Freedom target $2.9K/mo";
  - turn preview "Income tax (withheld) $624";
  - the second-cart card;
  - the page renders cleanly on a fresh load.

## For Pieter

- **Pace.** A careful index investor now reaches freedom in about 14–20 years of game time. That is realistic, but slower than the old cart rush. Phase 1's "a month is a day" is the pacing answer.
- **Existing saves.** Stacked businesses lose income when the save loads; the rebalance is intentional. A save waiting on an April tax bill still resolves it normally.
- **Not done yet from §1's smaller list:**
  - credit score climbing to 850 in about 20 months;
  - the mortgage re-roll;
  - property tax, PMI and closing costs;
  - repeatable FHA loans.
