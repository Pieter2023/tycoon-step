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
