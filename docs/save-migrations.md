Save Migrations
- Current save schema version: 3
- Schema 3 adds: `SaveSummary.difficulty` and normalized adult state on load.
- Migration behavior: older save entries are upgraded on read and written back to `tycoon_saves_v2`.
- Export format version: 1 (payload includes `formatVersion`, `exportedAt`, and the migrated entry).

Import rules
- Accepts exported payloads (preferred) or raw `GameState` JSON.
- Imported saves are normalized, summarized, and written into the selected slot.
