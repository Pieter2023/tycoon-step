# Release: builds 40–51 to production (2026-09-25, 17:21 PDT = 2026-09-26 00:21 UTC)

Pieter's go-ahead on 2026-09-25: "merge to main deploy".

## What shipped

`origin/main` was fast-forwarded from `073f397` to `15c4812` (`git push origin town-lighting-pass:main`). That was 24 commits, with no merge commit and no force push. Netlify built it from GitHub, and the production deploy is `6ab70fdab95d710008740f0d` (commit `15c4812`, published 00:21:20 UTC, about 60 s after the push).

It contains:
- the Sept-13 atelier work;
- the lighting pass and camera (build 40);
- the skinned townspeople (41);
- the AI-modelled Alex (42);
- the walk bob (43);
- the economy fix (44) and property costs, PMI, one FHA loan and a slower credit climb (49);
- the traffic fix (45);
- Phase 1 slices 1–3 (46–47);
- lighter sign lettering (48);
- the opt-in "Start in the 3D city" setting (50);
- unique asset ids and the production-save migration test (51).

## What production was before

Production was **not** `origin/main`. The live deploy was `6aa6c7fa8dda57c6ba139c3b`, a **CLI** deploy from Sept 13 ("Release approved Alex character with grounded movement and expressions"), built from the then-uncommitted atelier working tree. That is why the live HTML already used `main-*.js` bundles and served `/cafe-preview.html` and `/character-preview.html`. Git auto-deploy (GitHub `Pieter2023/tycoon-step`, branch `main`) was still on.

**Rollback** (re-publishes the Sept-13 deploy; the Netlify CLI is logged in as Pieter):

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6aa6c7fa8dda57c6ba139c3b"}'
```

Or, in the Netlify UI: Deploys → the Sept 13 deploy → "Publish deploy".

## Checks before the push

- **Fast-forward.** `origin/main` was an ancestor of the branch, with nothing on `main` missing from it.
- **What changed.** `netlify.toml`, the four functions and `package.json` were unchanged. `vite.config.ts` adds the two preview pages, which were already live, `noindex` and unlinked.
- **Real players' saves.** A save was made on the live Sept-13 site (Alex, month 7):
  - holdings: index funds, a REIT, a dividend ETF, a coffee cart, an FHA starter home and the repair loan;
  - an event waiting.

  It is kept byte for byte as `test/fixtures/save-production-2026-09-13-month7.json` (SHA-256 `8c78e625…`, checked against the browser's own hash).
  - `test/ProductionSaveMigration.test.tsx` loads it, plays 24 months on the new economy (no NaN, no lost holdings, the mortgage paid down) and continues it in the UI.
  - The same save was played in the browser on the branch build, and the city opened with it.
- **A bug the save exposed.** Two assets bought in the same millisecond shared an id, so selling one would have removed both. Build 51 gives new purchases unique ids and repairs duplicates on load.
- **Tests and build.** 446 tests / 80 files and the production build pass.
- **Phone.** iPhone checks at builds 43 (60 fps) and 47 (55 fps on Detailed). Builds 48–51 only lighten the scene or change non-layout code.

## Checks after the deploy (live site)

- The HTML serves `main-k6s0gFKl.js`, which contains the new setting. The city chunk is `TownModal-CxBwGTXU.js`.
- **The pre-release save on the live site**, in the same browser storage:
  - Continue showed the waiting event, and "Return it (free)" resolved it.
  - The turn preview shows the new "Income tax (withheld) $752".
  - It advanced to month 8 with $9,941, the same as the local run.
  - The duplicate asset id was repaired (`…193539-2`).
- **The city on the live site:**
  - the dialog opened with the header "Freedom 13% · $565 / $4,216 a month" and ticks on Stocks, Businesses and Property;
  - every model loaded with HTTP 200 at its new version, including `town-hero-alex.glb`, `town-people.glb` and `freedom-square.glb`.

  The pane was hidden, so the live canvas was not visually captured. The same code rendered in the local check.
- **Console.** No app errors. Two `ERR_BLOCKED_BY_CLIENT` lines came from my own attempt to post the save to a local receiver before the release, which the browser blocks from a public site.

## What players will notice

- Freedom now uses the 4% rule. A careful index investor gets there in about 15–18 game years, not through the old cart rush.
- Income tax comes out monthly. Shortfalls go on a credit card instead of being forgiven.
- Stacked businesses earn less per extra unit. Existing saves rebalance on load, which is intentional.
