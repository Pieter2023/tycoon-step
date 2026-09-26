# Game assessment and improvement plan — September 25, 2026

Pieter asked for a full assessment ("evaluate everything that you think is important for me to know"), with his own concern that the 3D city feels disconnected from the gameplay, isn't fun enough, and looks bad, and asked how Blender and Higgsfield could help. This file keeps the findings and the plan so later sessions don't have to redo the analysis. Status markers: ✅ done on branch `town-lighting-pass`, ⏳ waiting on Pieter, ⬜ not started.

Method: a cold first-time playthrough on the QA origin (5188) at desktop and phone width (opening journey, bank, cart, café shift, Exchange, a month advance), two code audits (game design + finance; 3D rendering + art pipeline), and spot checks of the key claims in the code. The economy simulation below was a headless script in a session scratchpad (8 characters × 3 seeds × 6 strategies, 30-year cap, 3-month cash reserve, cheapest event option); it is not in the repo. Re-derive it with `test/BalancePass.test.ts` as a starting point if the numbers need refreshing.

## 1. The economy rewards the wrong strategy (highest priority for a teaching product) ✅ Phase 0 done (build 44)

**Done 2026-09-25 (build 44, branch only):** every item on the Phase 0 fix list below. Index 8/8 careers reach freedom (median month 217) against carts 0/8 and savings 3/8; receipt `docs/verification/economy-2026-09-25/`. Savings count only interest above inflation (a decision made while fixing: HYSA interest otherwise beat the 4% rule for frugal players). The smaller issues followed in build 49: property tax, insurance, closing costs and PMI; one FHA loan at a time; no mortgage re-roll; a slower credit climb near 850. Still open: business income has no fixed-cost floor beyond operating leverage, and savings rates do not follow the rate cycle.

- **Stocks and index funds barely grow.** `updateAssetPrices` in `services/gameLogic.ts` moves prices only with the market-cycle multipliers (+0.5%/month in expansion, −0.3% in contraction, and so on) plus uniform noise. `expectedYield` (10% for the S&P 500 in `constants.ts`) is never used for price. The 4.5% savings account beats the stock market.
- **Coffee carts are the dominant strategy.** `coffee_cart` pays a 24% cash yield on $1,500 (`constants.ts`), and `handleBuyAsset` in `App.tsx` just stacks quantity with no limit or saturation.
- **Simulation results:**

  | Strategy | Wins / 24 | Median win month |
  |---|---|---|
  | S&P 500 only (what the game teaches) | 3 | 291 |
  | Dividend ETF | 12 | 339 |
  | Highest cash yield | 23 | 87 |
  | Coffee carts only | 24 | 87 (fastest 39) |
  | Do nothing | 0, and never bankrupt in 30 years | — |

- **Tax copy contradicts the mechanic.** Tax is a lump-sum April event from month 12 (`getNextEvent` tax block in `gameLogic.ts`), but the office pay stub says tax "comes off before you see it" (`components/town/WorkPanel.tsx`).
- **Unpaid bills disappear.** A cash shortfall resets cash to $0. The comment says assets are sold at 50%, but no code does it (shortfall block near the end of `processTurn`).
- **Smaller issues:**
  - Credit score reaches 850 in about 20 months debt-free.
  - A mortgage denial can be re-rolled for free (`Math.random` in App's mortgage flow).
  - No property tax, PMI, homeowner's insurance or closing costs.
  - FHA loans are repeatable with no owner-occupancy rule.
  - Business income is floored at 0, so businesses can never lose money.
  - Uniform price noise understates volatility.
  - A blanket 1%/month crash rule for stocks, crypto and businesses gives growth stocks and BTC negative median returns.
- **Fix list (Phase 0):**
  - Price drift from each asset's expected return, with realistic noise.
  - Diminishing returns per extra business unit.
  - Businesses that can lose money.
  - Shortfalls become credit-card debt.
  - Monthly tax withholding.
  - A 4% withdrawal rate of the portfolio counts toward financial freedom, so index investing can win.
  - A strategy-ranking assertion in `test/BalancePass.test.ts`: a diversified index investor must beat cart-stacking and savings-only.

## 2. Why the city feels disconnected ⬜ (except the bug fix, which is offered as a separate task)

- **The dashboard is the game; the city is a lazily loaded modal on top.** "Enter 3D city" is a thin banner. No time passes in the city: advancing the month closes the modal and runs the dashboard turn, and events force the player back to 2D.
- **Menus with scenery.** The 11 destination pills mirror the dashboard tabs, and 13 of 14 stops are text side panels. The café serving shift is the only real in-world game (and it is good).
- **The cart shift is a cutscene** whose result is shown before you start.
- **Stakes are tiny:** the cart earns $30/month against a $5,775 salary.
- **Nothing is celebrated.** Buying the first business shows a green text box; confirming the reserve changes nothing in the world.
- **Wealth is invisible.** The city looks the same after getting richer, the header shows cash rather than progress to freedom, and the $800k apartment building never appears.
- **Penalties and remedies are split.** Layoffs and reviews hit every game, but the remedies (job search, unemployment claim, insurance that unlocks insured event options) exist only in the city.
- **On phones the world disappears.** With a panel open, the 3D view is about 0% of the screen (header chrome about 43%, the panel covers the rest).
- **Bug: traffic deadlock.** A guided walk to the Exchange froze the player and all six cars for 30+ s. Cars stop for a player in their lane (`townTraffic.ts`, `consider(player.x, .35)`); the player is blocked by the stopped car's footprint plus a 0.35 margin (`createTownScene.ts`, the `traffic.obstacles()` check); the re-route does nothing when `findTownPath` returns `[]`. A manual tap frees it. A fix-it task was offered in the app ("Fix city traffic deadlock on guided walks"); it may already have been run in another session, so check `git log` first.
- **Phase 1 plan (city becomes the game):**
  - The city is the main screen; the dashboard becomes a "ledger" drawer (a half-height sheet on phones).
  - A month is a day: the monthly actions are morning/afternoon/evening, you walk home and sleep to advance, day/night and seasons play a time-lapse, and the monthly report arrives as mail.
  - Events happen in the world (the car breaks down in the bay, a bill at the door, Rosa knocks).
  - Wealth visibly builds the city: each asset becomes an object, the fountain fills as passive income nears the goal, and new streets unlock at 25/50/75%.
  - Milestone moments (a ribbon-cutting for the first business, a coin shower for the first dividend).
  - Merge quests, board challenges and journeys into one milestone track, and cut the ~20 meters to energy and stress.

## 3. Why the visuals looked bad, and what is fixed

- **Diagnosis:**
  - All geometry is scripted primitives in flat colours; none of the GLBs has textures; there is no AO; roughness is uniformly 0.75.
  - The outdoor scene was lit by an indoor `RoomEnvironment` with a fill of half the sun, and at midday the sun sat behind the default camera, hiding every shadow.
  - 54% of the city's 246k triangles are extruded 3D sign lettering.
  - Characters were 45 rigid pieces with sine-wave clips and about 33 draw calls each.
  - The low chase camera showed the fog band.
- ✅ **Lighting pass (build 40):** Neutral tone mapping, a captured sky environment plus a visible sky dome, the sun offset south-east, a longer golden hour, a readable night, and contact shadows. Receipt: `docs/verification/lighting-2026-09-25/`.
- ✅ **Camera (build 40):** pitch .45, 11.5 m, 40° field of view outdoors; rooms unchanged.
- ✅ **Characters, free half (build 41):** one skinned body for the whole cast (`scripts/build-town-people.py`). Draw calls on the square went from 1,431 to 815. Receipt: `docs/verification/characters-2026-09-25/`.
- ✅ **AI-modelled Alex (hybrid route, build 42):** Pieter picked concept 2 and approved up to 50 credits; 38 spent. Rigged onto the town skeleton by `scripts/build-town-hero.py`. Receipt: `docs/verification/hero-alex-2026-09-25/`.
- ⬜ **Remaining visual work, roughly by impact per effort:**
  - Replace the 3D sign lettering with textured decals (about −130k triangles; headless Blender edit of `scripts/build-town-assets.py`).
  - Bake ambient occlusion into a second UV set and lightmap atlas, and split the city into blocks for culling.
  - ✅ Tileable textures for pavement, brick and road (build 61): painted at runtime with normal maps (`townSurfaces.ts`); receipt `docs/verification/surfaces-2026-09-26/`.
  - A modular building kit to replace the box shopfronts.
  - Character polish: hair that tapers at the nape instead of a helmet, the armpit crease in the Wave clip, the male hip/waist ratio, and a Sit clip.

## 4. Other things Pieter should know

- **Scope is very broad.** The home page advertises "45+ financial systems", there are about 20 meters, 21 modals and 14 city stops, and September added 45 handover items. Freeze new systems until the core loop is fun.
- **The demo wall lands in the slump.** At month 36 players are 1–21% of the way to the goal. Put wealth-builds-the-city moments inside the demo.
- **Sales:** zero sales remains a distribution problem (see memory `tycoon-gtm-bet`). A better-looking city helps the 30-second clip a teacher shares, but doesn't replace outreach.
- **Physical-phone and Chromebook testing** has never been done.

## 5. Recommended order

1. Phase 0 economy fix (days).
2. Phase 1: city as the main screen, plus wealth visibly building the city (1–2 weeks).
3. ✅ AI Alex (build 42).
4. Remaining visual items.
5. Real-device test before any deploy of the branch.

## 6. Higgsfield (connected MCP, Plus plan)

- **Balance:** 427.33 credits after the AI Alex (38, job `c2c6a0f6-ffd9-4455-9da9-44fde5b14df4`); 465.33 before it and 467.83 at the start of the day. The concept images cost 2.5: 0.5 each. A `get_cost` preflight with `count: 4` reported the price of one image, so always multiply by the count.
- **Preflighted prices:**

  | Item | Credits |
  |---|---|
  | GPT Image 2.5 concept (medium, 2:3) | 0.5 each (charged) |
  | Meshy 7 image-to-3D, textured, 12k triangles, A-pose | 38 |
  | + Meshy rigging and one animation | 47.5 |
  | `3d_rigging` for an existing model + one animation | 8 |
  | 5 s Seedance video | 35 |

- **Concept job ids.** A job id can be passed straight back as `medias[].value`; for Meshy 7 the role is `image_references`.
  - Alex option 1: `8f57fb27-af19-4ff9-aba9-bbc486fbd2ba`
  - Alex option 2: `97825dfd-f96c-4df5-8083-4cb1305df9f8`
  - Alex option 3: `c541809d-7e4a-4406-8f7d-123498769a1a`
  - Alex option 4: `bb10fc1a-1d21-442e-98aa-6c7e4c007fec`
  - Resident lineup: `5c6accd7-4bee-4f95-8a0f-caeaee668e27`
  - Images are copied in `docs/verification/characters-2026-09-25/`.
- **AI Alex pipeline (done in build 42; kept as the recipe for any future hero).** The cheaper route: we retarget onto our own rig, so the Meshy animation library isn't needed. What changed in practice: Alex kept his own proportions (joints placed on his body, clips scaled to his legs) instead of being squeezed onto the townspeople's joint positions; no Blink morph (painted eyes); the A-pose texture needed repair.
  1. `generate_3d` with `meshy_v7_image_to_3d`: the chosen job id as `image_references`, `should_texture: true`, `pose_mode: 'a-pose'`, `target_polycount` about 10k, rigging optional (+9.5 credits buys Meshy weights to transfer). Always preflight with `get_cost: true` and show the cost first. Expect about 40–50 credits (38 textured, or 47.5 with Meshy's rig), not the ~90 quoted before retargeting was planned.
  2. In Blender: import, scale so the in-game height matches the townspeople (crown about 1.97 at bind), and place the feet at z = 0. Build the same armature as `scripts/build-town-people.py` (same joint names and positions, hips .96, legs .43/.41) fitted to the mesh. Auto-weight, or transfer Meshy's weights. Pose the arms from Meshy's A-pose down to our 12° abduction and apply as rest. Then point every bone up with no roll, which is the identity-rest contract.
  3. Reuse the clip generator from `build-town-people.py` (factor it into a shared function) and export `public/models/town/town-hero-alex.glb`.
  4. Runtime: load it for `state.character.id === 'alex'` through the hero path in `createTownScene.ts` (`options.characterAtelier`, currently forced false in `TownModal.tsx`). Keep `CLIP_GROUND_SPEED`, since the clips are identical, and add the contact shadow. Blink only works if the mesh gets a Blink morph; AI textures have painted eyes.
  5. Licensing: check Meshy's current terms for commercial use of paid-tier outputs before shipping, and record the answer in this file.
  - **Licensing answer (2026-09-25):** generated through Higgsfield's paid Plus plan. Higgsfield ToS §4.4: no ownership claim on outputs and no commercial restriction on any plan; Higgsfield may train on inputs and outputs; outputs may not train other AI models; IP indemnity is Enterprise-only. Meshy's own terms give paid-plan users ownership. Not legal advice.
