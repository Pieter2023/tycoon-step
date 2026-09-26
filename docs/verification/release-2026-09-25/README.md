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

# Release 2: builds 52–54 (2026-09-25, 18:19 PDT = 2026-09-26 01:19 UTC)

Pieter's word: "ship it".

## What shipped

`origin/main` was fast-forwarded from `15c4812` to `4436196f` (`git push origin town-lighting-pass:main`). That was 7 commits: builds 52–54 and their docs, with no config, function or dependency changes. The Netlify production deploy is `6ab71d6d65da9100074af02a` (commit `4436196f`, published 01:19:07 UTC, about 60 s after the push). It contains:
- **Build 52, pacing:**
  - "Free in about N years at this pace" on the dashboard, the city header and the demo wall;
  - Maria's student-budget start;
  - each difficulty's description states its pace.
- **Build 53, Phase 1 slice 5:** the Freedom Track (the goals card, the goals log, the notice board and the city strip; month-close milestones celebrated; energy and stress lead the life meters).
- **Build 54:** events staged at their place in 3D.

**Rollback** to builds 40–51:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6ab70fdab95d710008740f0d"}'
```

## Checks

- **Before the push:**
  - a fast-forward, with the branch equal to `origin`;
  - 468 tests / 84 files, including the production-save migration test;
  - the production build.
- **The live bundle:**
  - `main-CHEt4Nk-.js` holds the new quests (`Q_FREEDOM_25`);
  - `TownModal-CwHPCq9_.js` holds the event stage and the pace line;
  - `createTownScene-CPcnlt_j.js` holds `event-stage`.
- **The pre-release Alex save on the live site** (month 8):
  - the dashboard shows "Free in about 19 years at this pace" under "Freedom target: $4.2K/mo · 13% covered";
  - after the first-steps review, the Freedom track card reads "Chapter 2 of 4 · Build the base · 5 of 12 milestones", with the emergency fund at 72% and five rewards waiting;
  - claiming First Investment moved cash from $9,941 to $10,091;
  - the log shows the four chapters (safety done, base current), "Your story" and "Side goals";
  - the city header reads "Freedom 13% · $565 / $4,216 a month · free in about 19 years".
- **Functions and pages:** `validate-access` refuses a fake code (`{"valid":false}`), and `/educators`, `/teacher-packet` and the city models answer 200.
- **Requests and console.** Every request on the page load was 200. The console has only the two `ERR_BLOCKED_BY_CLIENT` lines from the earlier save-export attempt.
- **Not done live:** walking to the notice board and seeing a staged event. The pane was hidden, and production has no frame-stepping handle. Both were checked on the branch (`phase1-slice5-2026-09-25/`, `event-stage-2026-09-25/`).

# Release 3: builds 55–57 (2026-09-25, 21:01 PDT = 2026-09-26 04:01 UTC)

Pieter's word: "ship it, release 55-57".

## What shipped

`origin/main` was fast-forwarded from `4436196f` to `21f77713` (`git push origin town-lighting-pass:main`, 04:01:47 UTC). That was 6 commits: builds 55–57 and their docs, with no config, function or dependency changes. The Netlify production deploy is `6ab743ad80c17b0008c7ee24` (commit `21f77713`, published 04:02:21 UTC, 34 s after the push). It contains:
- **Build 55, the course rewards:**
  - passing a course pays a lasting raise (Negotiations +5%, Sales +3%, EQ +3%) instead of cash;
  - a third miss costs a $150 retake fee;
  - the negotiation salary-growth bonus counts per year, not per month (it compounded ~27% a year);
  - the EQ 1.5× career-experience perk now applies;
  - Finish counts once per quiz run.
- **Build 56:** the hero Alex blinks (eyelid meshes).
- **Build 57:** a cleaner face texture for the hero.

**Players will notice:**
- New course passes raise pay instead of paying cash. Saves that already took the cash keep it.
- Saves already certified in Negotiations get slower raises from now on (past raises stay).
- Sales courses that three misses had locked reopen on load.

**Rollback** to builds 40–54:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6ab71d6d65da9100074af02a"}'
```

## Checks

- **Before the push:**
  - a fast-forward, with the branch equal to `origin`;
  - `netlify.toml`, `netlify/`, `package.json`, `vite.config.ts` and `index.html` unchanged;
  - 482 tests / 85 files, including `ProductionSaveMigration`, `StrategyRanking` and `CourseRewards`.
- **The live bundle:**
  - `main-BcxYqiVC.js` holds the course copy and the pay stub's "Certification raise";
  - `createTownScene-BzU3AMKH.js` loads the hero at `20260925f`;
  - the blink code sits in the shared `GLTFLoader-jGzc39J8.js` chunk, the same chunk as the local build;
  - `town-hero-alex.glb?v=20260925f` answers 200 at 509,388 bytes.
- **Functions and pages:** `validate-access` answers, and `/educators` and `/teacher-packet` answer 200.
- **The pre-release Alex save on the live site** (month 8, $10,091, no courses; made on builds 52–54):
  - it loads, and the dashboard shows "Free in about 19 years at this pace";
  - the Sales intro shows "Pass for a 3% raise that stays with you. 3 tries included; after a third miss, a $150 retake fee buys 3 more";
  - passing gives "Reward earned: a 3% raise that stays with you, +10 FIQ, +5 happiness";
  - the save stores `courseRaises: {sales: 3}` with cash still $10,091;
  - the dashboard now reads "Free in about 18 years".
- **The city on the live site:** the header reads "Freedom 13% · free in about 18 years", and every model loaded with 200, including the new hero.
- **Console:** no errors.
- **Not done live:** a close-up of the blink. The pane was hidden, and production has no frame-stepping handle. It was checked on the branch (`hero-blink-2026-09-25/`).

# Release 4: builds 58–59 (2026-09-25, 22:27 PDT = 2026-09-26 05:27 UTC)

Pieter's word: "ship it, release 58-59".

## What shipped

`origin/main` was fast-forwarded from `21f77713` to `e3097cae` (05:27:30 UTC). That was 4 commits, with no config, function or dependency changes. The Netlify production deploy is `6ab757c433f3d00009919574` (published 05:28:03 UTC, 33 s after the push). It contains:
- **Build 58:**
  - a real wave, with the townspeople's torso tethered so the jacket no longer webs;
  - the Sit clip for everyone seated;
  - the `sitHips` fix (seated people sank under still clips and at dt 0);
  - short hair that tapers to the nape.
- **Build 59:** baked ambient occlusion for the city, at 1.4 strength.

**Rollback** to builds 40–57:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6ab743ad80c17b0008c7ee24"}'
```

## Checks

- **Before the push:** a fast-forward, with the branch equal to `origin`; 483 tests / 85 files.
- **The live bundle:** `createTownScene-35GZteHb.js` loads the city at `20260925d`, the people at `20260925e` and the hero at `20260925g`, and holds the Sit clip code.
- **Models on the live site, all 200:**
  - `freedom-square.glb`: 1,375,692 bytes;
  - `town-people.glb`: 525,924 bytes;
  - `town-hero-alex.glb`: 523,348 bytes;
  - `town-vehicles.glb`: 153,800 bytes.

  All four are exactly the local builds.
- **Functions and pages:** `validate-access`, `/educators` and `/teacher-packet` answer.
- **The pre-release Alex save on the live site** (month 8, $10,091): it continues, and the city opens with every model at its new version. The header reads "Freedom 13% · free in about 18 years". No console errors.
- **Not done live:** close-ups of the wave, the seated clip and the AO. The pane was hidden, and production has no frame-stepping handle. They were checked on the branch (`characters-polish-2026-09-25/`, `city-ao-2026-09-25/`).

# Release 5: build 60 (2026-09-26, 06:45 PDT = 13:45 UTC)

Pieter's word: "ship it, release 60".

## What shipped

`origin/main` was fast-forwarded from `e3097cae` to `e8e1d160` (pushed 13:45:47 UTC). That was 3 commits: the release-4 receipt, the 06:00 handover and build 60, with no config, function or dependency changes. The Netlify production deploy is `6ab7cc8da1c1eb000829f51d`, published 13:46:19 UTC, 32 s after the push.

**Build 60, dialogs fit a phone** (found by the phone check, `docs/verification/phone-2026-09-26/`):
- The shared `Modal`'s overlay scrolls, and the dialog has auto top/bottom margins.
- Before, on a phone, the Sales quiz and Save and load had their close and action buttons off-screen, so a phone player couldn't take the Sales certification.

**Rollback** to builds 40–59:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6ab757c433f3d00009919574"}'
```

## Checks

- **Before the push:**
  - a fast-forward, with the branch equal to `origin` and nothing on `main` missing from it;
  - `netlify.toml`, `netlify/`, `package.json`, `package-lock.json`, `vite.config.ts` and `index.html` unchanged;
  - 484 tests / 85 files.
- **The live bundle:**
  - the HTML serves `main-BmetnChC.js`, which holds the Modal's `marginTop:"auto",marginBottom:"auto"`;
  - `main-ClrqlwwZ.css` has `.overflow-y-auto` and `.overscroll-contain`;
  - the city chunk `TownModal-C2l7kCz_.js` passes `padding:0,overflow:"hidden"`;
  - `createTownScene-35GZteHb.js` is unchanged and answers 200.
- **Dialogs on the live site, iPhone 15 Pro WebKit (393×659):**

  | Dialog | Build 60 live | Before (build 59) |
  |---|---|---|
  | Sales quiz | top 16, scrolls | top −73 |
  | Save and load | top 16, scrolls | top −488 |
  | Run summary, Glossary, Tutorial videos | fit, centred | fit, centred |

  Measured with `docs/verification/phone-2026-09-26/modal-sweep.cjs` pointed at the live site.
- **Functions and pages:** `validate-access`, `/educators` and `/teacher-packet` answer 200.
- **The pre-release Alex save on the live site** (month 8, $10,091), at 393×660:
  - it continues;
  - Save and load opens at the top, with its close button at 29 px and the overlay scrolling;
  - the city opens full-screen (0–660, overlay not scrollable) with the header "Freedom 13%";
  - all eight models load with 200 at their current versions;
  - no console errors.
- **Not done live:** a visual capture of the city canvas (the pane was hidden) and the iPhone itself on production. The iPhone check of this code ran on the LAN build before the release.

# Release 6: build 61 (2026-09-26, 07:13 PDT = 14:13 UTC)

Pieter's word: "ship it, release 61".

## What shipped

`origin/main` was fast-forwarded from `e8e1d160` to `1bc4d4ef` (pushed 14:13:03 UTC). That was 2 commits: the release-5 receipt and build 61, with no config, function or dependency changes. The Netlify production deploy is `6ab7d2f20038cd00084ae7a8`, published 14:13:37 UTC, 34 s after the push.

**Build 61, tileable paving, brick and asphalt** (`docs/verification/surfaces-2026-09-26/`):
- runtime-painted textures with normal maps (`components/town/townSurfaces.ts`);
- the city model's new `wall*` materials, with the paving seams and the buried crosswalk dash removed (`MODEL_VERSION` `20260926b`).

**Rollback** to builds 40–60:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6ab7cc8da1c1eb000829f51d"}'
```

## Checks

- **Before the push:**
  - a fast-forward, with the branch equal to `origin` and nothing on `main` missing from it;
  - `netlify.toml`, `netlify/`, `package.json`, `package-lock.json`, `vite.config.ts` and `index.html` unchanged;
  - a clean tree;
  - 491 tests / 86 files.
- **The live bundle:**
  - the HTML serves `main-IpmUCX_J.js`;
  - the city chunk is `createTownScene-B5AZMoWU.js`, the same file the iPhone check ran on the LAN build. It holds `MODEL_VERSION` `20260926b` and the `wall*` brick hook.
- **The model:** `freedom-square.glb?v=20260926b` answers 200 at 1,365,412 bytes, byte-identical to the local build.
- **Functions and pages:** `validate-access`, `/educators` and `/teacher-packet` answer 200.
- **The pre-release Alex save on the live site** (month 8, $10,091):
  - it continues;
  - the city opens with the header "Freedom 13%";
  - all eight models load with 200, including the city at `20260926b`;
  - no console errors.
- **Not done live:** a visual capture of the canvas (the pane was hidden; production has no frame-stepping handle). The textures were checked on the branch and on the iPhone with this same chunk (`surfaces-2026-09-26/`).

# Release 7: build 62 (2026-09-26, 07:41 PDT = 14:41 UTC)

Pieter's word: "ship it, release 62".

## What shipped

`origin/main` was fast-forwarded from `1bc4d4ef` to `7a4d644a` (pushed 14:41:03 UTC). That was 2 commits: the release-6 receipt and build 62, with no config, function or dependency changes. The Netlify production deploy is `6ab7d981fbace400085c96ec`, published 14:41:37 UTC, 34 s after the push.

**Build 62, the phone check's findings** (`docs/verification/phone-findings-2026-09-26/`):
- events framed where they happen: `EVENT_PLACES` by id, plus a new Property & Co. place for rentals;
- ‹ › buttons on the destination row while it overflows;
- on phones, rooms swap the destination row for a one-row room bar, and the journey strip is one row.

**Rollback** to builds 40–61:

```sh
netlify api restoreSiteDeploy --data '{"site_id":"72e985ce-4d87-437f-b4a0-fc6bbb9907db","deploy_id":"6ab7d2f20038cd00084ae7a8"}'
```

## Checks

- **Before the push:**
  - a fast-forward, with the branch equal to `origin` and nothing on `main` missing from it;
  - config, functions, dependencies, `vite.config.ts` and `index.html` unchanged;
  - a clean tree;
  - 496 tests / 88 files.
- **The live bundle:**
  - `main-q4ciCKTY.js` holds `EVENT_PLACES` (`coworker_birthday:"work"`) and "At Property & Co.";
  - `TownModal-B7Y8Bn6w.js` holds the room bar, the ‹ › buttons and the seven "Exit ↗" labels;
  - the town CSS has the phone rules.
- **The live site at iPhone size** (iPhone 15 Pro WebKit, `phone-findings-2026-09-26/phone-layout.cjs`). It matches the branch exactly:
  - the square's 3D view is 459 px (was 405);
  - one › shows Café, Home and Work, and › hides at the end;
  - in the bank the destination row is hidden, the room bar fits in 393 px, and the 3D view is 467 px (was 305);
  - the long guide "Confirm my cash reserve →" shows in full.
- **Functions and pages:** `validate-access`, `/educators` and `/teacher-packet` answer 200.
- **The pre-release Alex save on the live site** (month 8, $10,091):
  - it continues;
  - the city opens with "Freedom 13%" and the new destination wrapper;
  - all eight models load with 200;
  - no console errors.
