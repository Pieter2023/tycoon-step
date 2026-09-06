# Start here — Tycoon handover

Updated September 6, 2026, overnight autonomous build (see item 10+). This is the current session handover. Older dated deployment claims in other documents describe earlier versions, not the new city work.

## Status and exact project

- **Three local commits on September 5 (`e909349` access invite links, `a2968e9` game work + pacing pass, `8baad7d` street life, residents, vehicles, sound); NOT pushed or deployed.** Working tree is clean apart from the untracked `graphify-out/`. Publication was not requested.
- Active folder: `/Users/pietervanderwalt/Desktop/Current High Value Apps/tycoon-step-main 2`.
- Branch: `codex/game-overhaul-20260503-223748`. Local HEAD: `8baad7d`. Remote `origin` has not been fetched or pushed in these sessions.
- Configured remote: `https://github.com/Pieter2023/tycoon-step.git`. Remote branch/deployment state was not fetched or verified for this handover.
- Many tracked files are modified and important new files are untracked, including `components/town/`, services, tests, Blender sources and runtime models. Preserve the entire working folder. Do not assume a fresh clone or a git patch alone contains this work.
- Existing unrelated edits also exist in `ModeSelector.tsx`, `index.tsx`, `netlify.toml`, `services/accessControl.ts`, its test, monetization docs and `graphify-out/`. Review the full diff before staging. Do not reset, clean, discard or blanket-stage the folder.

## What Pieter wants

A polished, stylised city inspired by The Sims, with a character-following camera and financial learning through doing. Keep controls simple and explanations short. Build and playtest a connected city activity before expanding the world. Explain the minimum account tiers and monthly costs before introducing paid tools. The latest work needs no new subscription ($0/month additional); existing hosting/cloud/AI bills are separate and were not audited.

## Completed locally

1. **Five financial/gameplay foundations:** decision autosaves with failure recovery; investment distributions separate from price growth; more honest risk/loss teaching; simpler opening repair/investment flow; reserve goals that cannot be earned by new borrowing.
2. **Freedom Square:** original Blender buildings and animated character, bank/stocks/business/property destinations, camera-relative movement, tap-to-walk, joystick, collision-aware city routes, follow/overview camera, saved city viewpoint and portfolio return routes.
3. **Opening journey:** reserve → buy coffee cart → $60 permit → owner shift → monthly review; persistent entrepreneur badge without a cash reward. Ownership and the $350 cart upgrade appear in the scene.
4. **Bank and cart:** walkable bank/teller, savings transfers, loan comparisons and a separate cart owner shift with price/stock choices, animation and receipt.
5. **Living city and café:** rain/puddles, residents, optional ambience; walkable café, lease, furnishings, price/stock/staff plans, monthly reports and net-worth accounting.
6. **Hands-on café shift:** walk to take orders, brew, carry and serve coffee; arriving/queued/seated guests, patience, reactions, optional helper, waste and profit/loss receipt. Free practice requires no ownership and changes no money. Paid owner shifts persist and resume paused.
11. **Overnight build 3 (committed):** Property & Co. estate office interior with listings wall, rates board, agent speech bubble and an agent panel (rent after upkeep/vacancy, mortgage quotes with eligibility, rent-or-buy comparison, mortgage preview handoff to the existing modal). `services/townProperty.ts`, `components/town/townProperty.ts`, `PropertyPanel.tsx`.
10. **Overnight build 1–2 (committed):** café reputation links owner-shift stars to monthly demand; the Exchange is a walkable trading floor with a ticker, broker speech bubble and broker panel (market mood, S&P/dividend/bitcoin with Buy 1/5/10 and Sell all, contributions calculator); a teaching market index in `GameState.marketIndex`; a second guided arc, the investor journey, ending in the Patient investor badge. Receipts in `docs/completed-improvements.md`.
9. **Cyclist, dog walker, café shift rework (committed `17add88`):** bike and dog models in the vehicles file; `createCyclist`/`createDogWalker` in `townLife.ts`; café service now supports taking orders while a drink brews, collecting ready drinks from the machine, a helper who takes orders, four guests on busy days, tighter patience, tips for quick service and a 0–3 star rating. Receipt in `docs/completed-improvements.md`.
8. **Street life, character polish, vehicles, sound (late evening, commit `8baad7d`):** one animated character with optional female/male parts (`townResidents.ts` styles player, twelve residents, teller, café staff and guests); cars and a van on Main Street that brake for the player and queue (`townTraffic.ts`); pigeons that scatter and bunting between lamp posts (`townLife.ts`); two bench sitters; a layered synthesized soundscape with birdsong, traffic, fountain, footsteps, espresso machine and service chimes (`townAtmosphere.ts`). New Blender step `scripts/build-town-extras.py`; new `public/models/town/town-vehicles.glb`. Receipt and measurements in `docs/completed-improvements.md`.
7. **Loop pacing pass (evening):** the guide button is now one tap per mission leg. A guided walk chains through the bank door to the teller (and into the café) on its own; any manual input cancels it. Long routes and the cart's customer visit jog (5.3 s instead of 10.8 s). Side panels scroll to the new step after a purchase/permit, the reserve confirmation sits first in the teller panel, guide labels track where the player stands, and the guide can confirm the reserve, pay the permit, start a practice shift and complete the journey when the matching panel is open. Timings and the before/after table are in the receipt. No financial rule or save shape changed.

The current scene is a small playable preview. Detailed crowd collision, full conversations, free furniture placement and a complete restaurant/open-world simulation are not implemented.

## Start or resume the preview

The production preview was listening on `http://127.0.0.1:5187/` at handover (pid 67841, serving the rebuilt `dist/`). Port 5188 was stopped after the pacing pass. Check ports before starting another server; runtime processes may not survive a new session.

```sh
cd '/Users/pietervanderwalt/Desktop/Current High Value Apps/tycoon-step-main 2'
git status --short
npm run build
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
```

`npm run dev` uses port 5173. `netlify dev` is needed for local server functions; plain Vite preview does not exercise real access validation, cloud services or payments. Dependencies are already installed; install only if missing or required by an intentional dependency change.

For isolated browser QA, serve the same build on port **5188**. Different ports are different localStorage origins; this protects the user's 5187 save. `localhost` and `127.0.0.1` are also different origins. Do not clear, seed or replace the user's save. A rebuild replaces hashed assets: finish building, then fully refresh existing preview pages to avoid a stale dynamic-import URL.

In the game: **Continue → Enter 3D city → Visit café → Enter café → Play a shift → Try a practice shift**. Visit café first walks to the building; the button then changes to Enter café. Practice is unsaved and repeatable. The action button walks to a station, then changes to the action; E performs the current action too.

## Saved progress and last browser handoff

These are last-observed snapshots, not values to restore over newer play:

- User origin 5187: Alex, month 3, **$16,180 cash / $24,100 net worth**. The user had progressed beyond an older $16,330 checkpoint; that newer progress was preserved. Last view was a free café practice shift paused with **Resume** visible. Practice vanishes on reload; start it again if needed. No ownership purchase was made on the user's save by QA.
- Isolated QA origins (throwaway): `127.0.0.1:5188` earlier: Alex, month 4, **$12,234 cash**. `localhost:5188` (evening pacing pass, Chrome): Alex, month 2, $12,245 cash, badge earned, no café lease. Earlier 5188 detail: Café with seating and machine, recorded owner shift of two happy guests and one impatient departure, $8 sales, $9 costs, $1 loss. Last normal monthly café receipt was $580 profit; saved monthly plan was $6, 700 stock, helper on, open. Verify in the UI before relying on these snapshots.
- Latest QA tab/server closed; only the user's preview was left open. Temporary viewport override was reset. Final original and QA browser consoles were clear.

## Financial rules to preserve

- All rates/demand are fictional teaching assumptions, not live financial data. Spot crypto and price appreciation do not generate passive cash. Knowledge does not multiply investment payouts; savings principal stays nominal. Preserve quantities, cash, cost basis and completed goals during migration.
- Café lease: $1,200 refundable deposit + $1,800 fit-out, initially $600 equipment salvage. Seating $650 (salvage $325); machine $900 (salvage $450). Café value belongs in net worth and portfolio business assets.
- Normal monthly café trading: $600 rent + $120 utilities, $600 barista and optional $400 helper, supplies $2 per stocked cup. Plans: price $4/$6, stock 400/700, helper and open status. Closed trading still incurs $720 rent/utilities. Net profit enters the existing income engine once, with costs already included.
- Hands-on extra owner shift: price $4/$6, stock 3/6 at $2 each, $3 extra operating cost and optional $3 helper. All costs charged on opening; each sale plus any tip ($1, or $2 at premium prices, for service within the first 45% of a guest's patience) credited once when served. Guests: four on busy days, three in rain, one fewer at premium prices. One paid shift per game month, no restart refund or repeated sale reward. Monthly trading remains separate. Closing/upgrading/changing the café plan is blocked during an active paid shift. Month advance ends unfinished service without paying it again.
- Practice uses local UI state only. Paid shift uses `GameState.cafe.service`. Leaving/hiding the game pauses the timer; restored paid service starts paused. Pausing service must not freeze walking outside the café.

## Source map

| Area | Files |
|---|---|
| App/state and city entry | `App.tsx`, `components/v2/CommandDashboard.tsx`, `components/modals/ScenarioModal.tsx` |
| 3D lifecycle, movement, guests, camera | `components/town/createTownScene.ts`, `townWorld.ts`, `townControls.ts`, `townNavigation.ts`, `town.css` |
| Street life | `components/town/townResidents.ts` (sex/style/seating), `townTraffic.ts`, `townLife.ts` (pigeons, bunting, cyclist, dog), `townAtmosphere.ts` (weather + soundscape) |
| Property office | `components/town/townProperty.ts` (room + listings canvases), `PropertyPanel.tsx`, `services/townProperty.ts` (mortgage quotes, landlord month, rent vs buy) |
| Exchange | `components/town/townExchange.ts` (room + canvas ticker), `ExchangePanel.tsx`, `services/townMarket.ts` (mood, index change, downside copy), `marketIndexStep` in `gameLogic.ts`, `investorJourney`/`activeJourney` in `townJourney.ts` |
| Rooms and ambience | `components/town/townBank.ts`, `townCafeRoom.ts`, `townAtmosphere.ts` |
| UI orchestration | `components/town/TownModal.tsx`, `townGuide.ts` (guide labels + one-tap chaining), `TellerPanel.tsx`, `CartShiftPanel.tsx`, `CafePanel.tsx`, `CafeServicePanel.tsx`, `CafeServiceHUD.tsx` |
| Finance and activities | `services/townProgress.ts`, `townJourney.ts`, `townActivities.ts`, `townCafe.ts`, `cafeService.ts`, `gameLogic.ts` |
| Foundations and persistence | `services/firstSteps.ts`, `investmentModel.ts`, `storageService.ts`, `hooks/useSaveLoad.ts`, `types.ts` |
| Editable art and rebuild | `assets/town/`, `scripts/build-town-assets.py` → `build-town-extras.py` → `refine-town-character.py` in that order; see `assets/town/README.md` |
| Runtime models/decoder | `public/models/town/`, `public/decoders/draco/` |

## Validation and evidence

Latest validation (overnight build 3, property office): **268 tests / 42 files passed**, TypeScript + production build passed; `git diff --check` passed. Existing chunk-size warnings remain. `dist/` was rebuilt at the end of that pass, so an already-open 5187 page needs a full refresh before opening the city. This handover does not claim a fresh deployment or repeat financial/cloud testing.

- Portable logs: [tests](docs/verification/property-2026-09-06/tests.log), [build](docs/verification/property-2026-09-06/build.log); earlier in `exchange-2026-09-05/`, `cafe-cyclist-2026-09-05/`, `street-life-2026-09-05/`, earlier logs in `docs/verification/pacing-2026-09-05/` and `gameplay-2026-09-05/`.
- Full chronological implementation/playtest receipt: [docs/completed-improvements.md](docs/completed-improvements.md). Earlier test counts and balances in that file are historical checkpoints.
- Regression checklist: [docs/qa-checklist.md](docs/qa-checklist.md).
- Service tests: `test/CafeService.test.ts`, `test/CafeServicePanel.test.tsx`, `test/CafeServiceResume.test.tsx`; broader tests use `Town*`, `FinancialLearning`, `DecisionAutosave` and existing service suites.
- Browser checks: desktop 1280×720, portrait 390×844, all three practice deliveries, paid supplies and two sales, save/reload, impatient departure/loss receipt, and current console. Previous stages also tested teller transfer, café lease/upgrades, monthly profit/loss and mission progression.

## Next session priorities

1. Read this file, check the active folder/dirty state and current preview/save, then ask for or follow Pieter's next direction. No new feature or public deployment was authorized by the documentation request.
2. **Physical-phone check remains outstanding:** actual touch/multitouch, camera feel, frame rate (now with twelve residents, six vehicles and pigeons), thermal behaviour, orientation, suspend/resume, and listening to the new soundscape on a real speaker. A desktop browser viewport is not a physical-device test.
3. Pacing/clarity of the connected loop was tuned on September 5 evening (desktop Chrome). Still open: Pieter playing it by hand, character contact and crowd movement. New town/café copy is largely English-only; a full screen-reader, contrast and localization review remains open.
4. If publication is requested, preserve a complete recoverable copy of tracked and untracked work, review unrelated changes, recheck tests/build, inspect the real hosting target and remote branches, create/verify a staging deployment, then publish within the authorized scope. The historical Netlify site name is `tycoonjan22026`; reverify it. Do not blindly run an old branch-to-main push recipe.
5. More interiors, missions, voice or external art services are possible later choices, not a committed queue. Blender is already available; Higgsfield/Mixamo were not used for this stage. Quote current paid tiers only when a concrete need arises.

No secret values are included here. Do not copy `.env` contents, private access codes or account credentials into future handovers.
