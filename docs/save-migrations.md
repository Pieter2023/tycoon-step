Save Migrations

## September 5 additions and invariants

Schema remains **3**, export format remains **1**, localStorage database remains `tycoon_saves_v2`. There was no blanket save reset. See [HANDOVER.md](../HANDOVER.md) for origin isolation and last-observed snapshots.

- Adult normalization applies `migrateInvestmentAssets` from `services/investmentModel.ts`; holdings use `incomeModelVersion: 2` to distinguish cash distributions from growth. Preserve cash, quantities, cost basis and completed goals. Do not migrate by creating new payouts.
- Optional adult state: `firstSteps`, `townProgress`, `townView`, `lastMonthlyReport`, `cafe`. Older saves without these fields remain usable. Café state contains lease/furnishings, monthly plan/receipt and optional `service`.
- Paid `cafe.service` stores the month, plan, guest statuses/deadlines, elapsed time, brewing/cup state and served outcomes. Opening costs and each sale are already in cash. Reload/finish/month advance must not reapply them. Restored active service starts paused.
- Practice stays in component state, is repeatable and is intentionally absent from saved finances. Reloading discards practice.
- City viewpoint is captured when leaving/disposal, not on every walking frame. Optional follow/overview preference is included.
- A paid active shift blocks café plan/upgrade/lease changes. Advancing a month finalizes unfinished service before the normal monthly settlement; paid service then becomes eligible for the next month.
- Decision autosaves report storage failure; downloadable backup captures current memory state when storage fails. Import failure must not be reported as a successful save. Existing daily-challenge autosave exclusions remain.

Regression evidence: `test/DecisionAutosave.test.tsx`, `test/FinancialLearning.test.ts`, `test/TownCafe.test.ts`, `test/CafeService.test.ts`, `test/CafeServiceResume.test.tsx` and storage tests. The latest suite passed; cloud synchronization was not revalidated for this build.
- Current save schema version: 3
- Schema 3 adds: `SaveSummary.difficulty` and normalized adult state on load.
- Migration behavior: older save entries are upgraded on read and written back to `tycoon_saves_v2`.
- Export format version: 1 (payload includes `formatVersion`, `exportedAt`, and the migrated entry).

Import rules
- Accepts exported payloads (preferred) or raw `GameState` JSON.
- Imported saves are normalized, summarized, and written into the selected slot.
