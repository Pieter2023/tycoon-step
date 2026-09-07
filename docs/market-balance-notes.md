# Market Balance Notes (Mid-Tier Assets)

## September 5 learning model update

The guidelines below describe the older mid-tier catalogue, not a blanket promise of investment income. `services/investmentModel.ts` now distinguishes actual cash distributions from expected price growth; spot crypto/commodities have no automatic cash yield. `nominalPrice` keeps savings/bond unit pricing nominal. Use `incomeYield` and the appropriate income label when quoting an investment.

The café economy and extra owner shifts use separate, explicit fictional cost/demand models in `services/townCafe.ts` and `services/cafeService.ts`. Normal café net profit already includes costs; owner-shift opening costs/sales settle separately and exactly once. See [HANDOVER.md](../HANDOVER.md) for amounts/invariants and [receipt](completed-improvements.md) for tested outcomes.

Goals
- Fill the gap between starter investments and large purchases.
- Provide meaningful monthly cashflow without trivializing late-game assets.
- Encourage diversification across asset types and risk profiles.

Guidelines
- Mid-tier price band: $2k–$25k base price.
- Annual yield target: ~6%–18% for mid-tier; no single item >20%.
- Risk ratings: LOW / MEDIUM / HIGH to reinforce volatility tradeoffs.

Sanity Checks
- Automated: `test/MarketBalance.test.ts` validates mid-tier count and yield bounds.
- Manual: ensure at least one low-risk mid-tier and one high-risk mid-tier per category spread.

## City mechanics balance (2026-09-07)

Headless 36-month runs (Normal, 8 characters × 6 seeds), means per run:

| Player | Bankrupt | Net worth | Shocks paid | Premiums | Notes |
|---|---|---|---|---|---|
| Coaster (does nothing) | 11/48 | $39,399 | $4,685 | $0 | Marcus 6/6, Maria 2/6 |
| Saver (health cover $2,000 deductible, index fund, one certificate) | 0/48 | $44,779 | $1,435 | $5,760 | 7 of 9 graduate; salary +$440/mo |
| Driver (finances the $9,000 hatchback in month 2) | 13/48 | $27,147 | $5,556 | $0 | car interest $790 |
| Spender (Comfortable living + financed $32,000 EV) | 39/48 | $8,664 | $2,039 | $0 | the lifestyle, not the car |

Health cover priced at $240/$160/$110 a month by deductible; home & car $80 + $45 a vehicle + $60 a rental; business $80 + 0.5% a year of business value. Insured event options require the policy.

Marcus Johnson (2026-09-07): starts Frugal on a $2,400 founder's draw. Do-nothing runs over twelve seeds: 12/12 bankrupt before, 3/12 after (early heavy shocks), mean final cash $25,348.
