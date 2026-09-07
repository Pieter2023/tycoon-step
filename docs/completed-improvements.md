# Gameplay foundation and Freedom Square

> Current handover: `/Users/pietervanderwalt/Desktop/Current High Value Apps/tycoon-step-main 2/HANDOVER.md`. Latest implementation: hands-on café service; 236 tests / 38 files passed. All September upgrades remain local, uncommitted and undeployed. This document is chronological: earlier test counts, missing-feature lists and balances are historical checkpoints, not current state. Documentation refreshed September 5, 2026.

Implemented locally, September 5, 2026. No deployment or account signup performed.

## Five foundation improvements

- Save each committed single-player decision. Failed writes show a persistent warning; a downloadable backup captures current in-memory progress even when storage is full. Imported saves report write failures honestly.
- Separate investment cash payments from price changes. Spot cryptocurrency pays no passive income. Existing holdings migrate without changing cash, quantities, cost basis or completed goals. Savings principal stays nominal; financial knowledge no longer manufactures investment income.
- Permit deeper losses on normal and harder difficulties. Easy's artificial loss protection is disclosed. Hindsight comparisons are explicitly illustrative; recovery is never presented as certain. Difficulty cannot turn shareholder dividends into charges.
- Start with a playable repair decision, a simple dashboard and three introductory investments. The complete catalogue, charts and help remain accessible. Mobile layouts and onboarding overlays were checked.
- Require earned reserve progress and a cash buffer for the first-investment goal. New borrowing does not count as building reserves. No character immediately earns a starter goal from initial cash.

## 3D integration

Select **Enter 3D city** at the top of Play, available immediately. Pending event dialogs also offer this button: exploration preserves the event and purchases stay disabled until the decision is resolved. This preview is for normal single-player runs.

The optional, lazily loaded Three.js scene provides camera-relative keyboard movement, tap-to-walk and an analogue touch joystick. Four destinations connect to the existing purchase handler and save system: Community Bank, Stock Exchange, Main Street Businesses and Property Office. Location offers show learning context, cash remaining and portfolio ownership. Autoplay and dashboard keyboard shortcuts pause while the town is open. Month review and detailed finance screens remain accessible.

The city now uses original Blender-built assets: detailed pastel shopfronts, balconies, street furniture, trees and a fountain. The articulated character blends idle, walking and running animations; five residents stroll through the neighbourhood. A closer camera follows the character, with drag-to-orbit, wheel/pinch zoom and a reset button. Location choices open on inspection so the city fills the view.

Blender 5.2.1 LTS is installed locally. Editable source models, a regeneration script and runtime models are included; see `assets/town/README.md`. The city model uses Draco compression and is approximately 1.1 MB; the character is approximately 201 KB. No asset service, API key or external account is required. WebGL failure or context loss switches to destination-based offers. Graphics resources are released on exit.

## Validation

- 200 automated tests across 30 files pass, including decision saves, failed storage writes, migration, financial learning, earned rewards and town fallback/quotes.
- TypeScript and production build pass. Existing large initial/chart bundle warnings remain; the 3D bundle only loads when opened.
- Chrome production-preview checks cover desktop/mobile, walking, deposits, stock purchases, unaffordable offers, refresh persistence, autoplay pause and WebGL fallback.
- The upgraded city was additionally checked in the in-app browser at desktop and 390 × 844 phone viewport sizes: camera dragging, joystick movement/release, animated walking, bank offers, a test deposit and saved balance after refresh. Physical phones have not been tested.
- Dependency updates stay within existing declared version ranges; npm audit reports zero known vulnerabilities at verification time. npm 11 resolved an npm 10 dependency-updater error.

## Costs and next stage

Additional required subscription budget for this prototype: **$0/month**. Three.js is MIT licensed. Blender is free and is now installed and used for the city and animated character. No paid tier is required. Higgsfield is optional and has not been installed or subscribed to. Any paid tool should be selected and its current minimum tier quoted before signup. Existing hosting and AI usage costs are separate.

Sources: [Three.js licence](https://threejs.org/license/), [Blender](https://www.blender.org/about/).

This is a playable 3D foundation, not a completed open world. Additional building interiors, broader NPC conversations, more ownership upgrades, physical-device performance testing and a public release remain later work. The financial economy still uses simplified, fictional assumptions. Authentication/cloud services and payments were not exercised in this local work.


## City gameplay polish — September 5, 2026

- Movement uses obstacle-aware routes, buffered corners and collision sliding around benches, trees, planters, lamp posts, tables and the coffee cart. The following camera moves inward when buildings or tree crowns obstruct it. Residents use clear walking lanes.
- City position, camera angle and zoom save when leaving the scene. Property and business links open the correct catalogue; a Return to city button restores the location. Full catalogue links bypass the initial three-investment guide.
- A four-step mission connects a cash-reserve plan, an affordable Coffee Cart (base $1,500, inflation-adjusted), a one-time $60 trading permit, and a first trading-month review. The permit genuinely gates coffee income; confirming the reserve awards no cash. The permit can also be paid from the portfolio so non-city game modes remain usable.
- Ownership adds a coffee cart, equipment and a customer to the square. A $350 weather-cover/storage upgrade appears in the world and uses the existing operations-upgrade effects on volatility and maintenance odds. Different resident appearances and optional synthetic footsteps add life without new services.
- Location offers show price, risk, expected monthly cash, costs, a reserve warning and an illustrative quiet-month outcome. The month recap records actual cash income, per-asset contributions, costs, other cash movements and price changes separately, and survives reload.

Validation includes pure financial/route tests, a movement simulation of the café-to-cart path, and a rendered regression for property navigation. Browser playthrough covers mission actions, permit/upgrade charges, property routing, preserved location, trading income, saved progress, and desktop/phone-sized layouts. Existing build-size warnings remain; no paid integrations or public deployment were performed.


## Bank interior and coffee activity — September 5, 2026

Implemented in the local preview at http://127.0.0.1:5187/.

- Walk to the bank, enter a furnished 3D lobby, approach the animated teller, and walk back out. Camera angles keep the counter and walking corridor accessible. The original Blender character is reused; the new lobby is authored with runtime geometry.
- Deposit or withdraw a whole-dollar amount using the same High-Yield Savings holdings as the portfolio. Transfers preserve net worth. The teller also compares existing loan offers, including payments, approximate total interest and remaining monthly surplus; applications continue through the existing banking screen.
- Continue from the teller to Main Street or your owned cart. A new Your cart shortcut makes the activity easy to find.
- Run one extra owner-operated pop-up shift per month. Choose $3/$5 pricing and 12/24 cups of fresh stock. All stock costs $2 per cup, plus $18 shift staffing/stall costs. Fixed, disclosed teaching demand varies with the month, price and rain cover. The forecast shows break-even and profit/loss before committing.
- A short customer/cup animation leads to a receipt. Cash settles once on opening, so closing or reloading does not repeat the reward or escape a loss. Regular monthly cart operations remain separate. The existing $350 cover/storage upgrade helps rainy-shift demand.

Validation: 210 tests across 32 files passed; production build and whitespace checks passed. Rendered tests covered bank entry/teller/exit, a $500 deposit and withdrawal, loan comparisons, bank-to-cart walking, customer animation, a profitable $18 shift and a loss-making $6 shift, receipt persistence, next-month unlock, and desktop (1280×720) / phone-sized (390×844) layouts. The receipt scroll position and animation message obstruction found during testing were fixed and rechecked.

Scope: local preview only; no public deployment, purchase, signup or subscription. Additional required subscription budget remains $0/month. Physical devices, full voice dialogue, building interiors beyond the bank, and detailed hand/foot contact animation remain future work.

Handoff: the user's original preview was refreshed and left inside the bank, with $16,330 cash and $24,250 net worth preserved. The pending Flat Tire Fiasco decision remains unresolved and correctly disables transactions. Current user-preview console has no warnings or errors. The separate test preview encountered one stale asset URL while a build was replacing files; refreshing after completion resolved it. Test tab/server closed, temporary viewport override reset; user preview remains running.


## Character, controls and opening journey — September 5, 2026

- Refined the original Blender character with ankle joints, grounded walk/run cycles, smoother speed-matched playback and gentler turns/stops. Added Serve, Wave and Celebrate clips plus hand grip anchors. The character asset is about 237 KB.
- The serving sequence walks to the operator side, frames the customer and handoff from the side, then returns the character and camera to their previous positions. A teller greeting and milestone celebration use the new clips. Reduced-motion mode skips optional interaction animation.
- Added Follow character and See neighbourhood camera presets, left/right rotation and zoom buttons. Presets save with the existing camera state. Drag sensitivity is lower, and a pinch gesture cannot become an accidental walking tap. Destination markers reflect reachable ground.
- Replaced the passive mission strip with a five-step opening journey and a contextual next-action button: reserve → cart → permit → owner shift → monthly review. Pending events take priority. A persistent Neighbourhood entrepreneur badge rewards completion without adding money. Older saves continue from their existing financial progress.

Validation: 215 automated tests across 33 files passed; production build and whitespace checks passed. A fresh browser game completed the entire journey, from paying the initial repair through the bank, buying/licensing the cart, serving, advancing the month, reviewing results and earning the badge. The test balance was $11,245 before and after the badge. Save/reload retained the badge and camera preset. Desktop 1280×720 and phone-sized 390×844 views were checked, including camera presets, rotation/zoom buttons, tap-to-walk, serving camera, receipt and next-action controls.

Limits: physical-phone testing remains outstanding. Browser layout checks do not establish real-device frame rates or multi-touch feel. Living-neighbourhood expansion and a walkable café remain the next stages. No paid subscriptions, public deployment or external account changes were made.

Handoff for this stage: refreshed the user preview and reopened the bank. The original $16,330 cash / $24,250 net worth and waiting Flat Tire Fiasco event were preserved. The new guide correctly prioritizes that event. Both current browser consoles were clear. The isolated QA tab/server were closed and the viewport override reset.

## Living neighbourhood and café — September 5, 2026

Implemented locally at http://127.0.0.1:5187/.

- Added a walkable café interior with counter, staff, customer queue, optional seating, upgraded espresso machine, plants and pendant lights. Ownership changes the outdoor shop sign. The café shortcut and post-journey guidance connect the room to the existing cart progression.
- After owning a licensed cart and running an owner shift, lease the café for $3,000: $1,200 refundable deposit and $1,800 fit-out. Rent is $600/month; utilities are $120. One barista costs $600/month, a second adds $400; supplies cost $2 per stocked cup. All are fictional teaching assumptions.
- Choose $4/$6 pricing, 400/700 cups of stock, staffing and open/closed status. Saved plans repeat on each month advance. A closed shop still pays rent and utilities. Seating costs $650 and increases demand; a $900 machine increases capacity. Staff help during crowds, and lower pricing can be useful during rain. Forecasts explicitly disclose fixed demand.
- Monthly receipts show sales, stock waste, wages, rent, utilities and net profit/loss. Net profit flows into the existing income engine exactly once per turn. Deposits and equipment salvage appear in net worth and the portfolio. Ending the lease returns the displayed deposit/salvage and stops future café bills; the cart remains separate.
- Added rain streaks, puddles, cooler rainy lighting, more street residents, queues and optional synthesized water/rain ambience. Reduced-motion mode omits falling rain. Rain geometry and audio resources are released on exit.
- Fixed the non-3D cart-animation fallback, negative business income visibility in month previews, and the portfolio chart's initial sizing warning found during testing.

Validation: 225 tests across 35 files passed; production build and whitespace checks passed. Browser playthrough at 1280×720 and 390×844 covered walking in/out, leasing, price/stock/staff changes, upgrades, an actual $1,440 loss and $580 profit, saved receipts/furnishings after reload, temporary closure without immediate cash changes, the continuing $720 rent/utilities forecast, portfolio value and return navigation. The final plan comparison showed extra staffing lifting a busy-month forecast from $580 to $1,080. Final browser console was clear after the chart fix.

Limits: this remains a local playable preview with stylised geometry and simple resident/queue animation. Furniture uses preset positions; there is no free-placement editor or complete crowd collision simulation. Physical-phone performance and multitouch feel still need device testing. No new account, paid service, signup, deployment, commit or push was needed. Additional required subscription cost: $0/month.

Original save: $16,330 cash / $24,250 net worth preserved, with the Flat Tire Fiasco event still waiting. Café ownership unlocks through the cart journey; the room can be viewed first. The separate QA save finishes at month 4 with $12,235 cash, both café upgrades and the latest $580 trading receipt; the next saved plan has two staff and forecasts $1,080 on a busy month.

## Hands-on café service — September 5, 2026

Implemented in the local preview at http://127.0.0.1:5187/.

- A short playable café shift now connects walking to the order counter, preparing a named drink at the machine, carrying the cup, and delivering it to a table or takeaway customer. The next-action button walks to the correct place; a second press performs the action. Keyboard E and the existing movement controls also work.
- Guests arrive, queue, sit, show their order, lose patience, and react to service. Added seated poses, carried cups, coffee steam, guest labels and a compact shift display. Portrait framing keeps the tables and queue in view.
- Practice is repeatable, available without ownership, and never changes money. Owner shifts require an open owned café and are limited to one per game month. Supplies and extra operating/helper costs are charged at the start; each completed sale adds cash exactly once. Saved shifts resume paused. Leaving or hiding the game pauses the timer. Advancing the month ends unfinished service without another payout.
- Price, fresh supplies, staffing and pace affect the shift. Receipts explain sales, committed stock costs, wages, waste and profit/loss. The short activity is separate from regular monthly café trading. These remain simplified fictional teaching assumptions.

Validation: 236 tests across 38 files passed, the production build passed, and the whitespace check passed. Tests cover spatial interaction, brewing delays, patience, stock waste, cash settlement, invalid purchases, save/reload, month advance, unavailable 3D rendering and paused-shift re-entry. A return-to-game movement bug found during review was fixed and regression-tested.

Browser playthrough: completed all three practice deliveries at 1280×720, yielding $12 sales, $9 costs and $3 illustrative profit without changing the test balance. The isolated owner shift charged $9, credited two $4 deliveries, preserved progress through reload, and ended with one impatient guest and the correct $1 loss. Remaining deliveries and the loss receipt were checked at 390×844. The final test browser console had no warnings or errors. An earlier open test page encountered a stale asset during rebuilding; a fresh page after the finished build loaded correctly. Existing build-size warnings remain.

Scope: local playable preview only; no deployment, commit, purchase or external account changes. No additional subscriptions are required ($0/month). Physical-phone performance and multitouch feel remain untested. Character contact and crowd movement are still simplified; this is a small service activity, not a complete restaurant simulator.

The isolated QA save finishes at month 4 with $12,234 cash and the owner-shift receipt recorded. On returning to the user's original preview, its current balance was $16,180 with $24,100 net worth; that newer progress was preserved through refresh, rather than replacing it with an earlier checkpoint. The QA tab and server were closed and the temporary viewport override reset.

Final handoff: the original game is open inside Little Square Café with a free practice shift paused and a visible Resume button. Cash remains $16,180. The original preview console is clear. Practice does not require a café lease and does not spend or earn game money.

## Loop pacing pass — September 5, 2026 (evening)

Played the connected bank → cart → café loop as a fresh player (Alex, month 1) on an isolated origin and timed every leg, then tuned the parts that felt slow or unclear. Code is local only; nothing was committed or deployed.

What the playthrough found (before):

- Reaching the teller took four taps (Go to the teller → Enter the bank → Walk to teller → Talk to teller) plus a scroll, because the reserve confirmation sat at the bottom of the teller panel under the deposit tools. About 12 seconds of walking at 2.1 units/s.
- After buying the cart or paying the permit, the side panel kept its old scroll position, so the new step (permit, then the shift panel) was off-screen and the $350 weather-cover upsell sat where the previous button had been.
- The cart's scripted customer visit took 10.8 seconds of non-interactive walking.
- Guide labels went stale: "View the coffee cart" while the offer was already open, "Go to your cart" while standing at the cart, "View the café space" on arrival at the door, "Manage your café" inside a café the player does not own, and the finish button was at the bottom of a long recap.
- The café-space shortcut appeared during the cart mission and pulled attention away from the coffee cart offer.

What changed:

- `components/town/townGuide.ts` (new): `guideLabel` names the exact next tap for every position, and `guideNextHop` chains a guided walk through the bank door, up to the teller, and into the café. `TownModal` keeps a guided target while walking; any manual input (ground tap, joystick, keys, destination/interior buttons) cancels it and clears the "Next stop" caption. The guide button now also confirms the reserve, pays the $60 permit, starts a practice shift and completes the journey when the matching panel is open, with cash guards.
- `components/town/townControls.ts`: `routeSpeed` jogs on routes longer than four units and during the scripted cart service, walking the last stretch; `createTownScene` uses it for tap-to-walk and guided routes and reports manual input through a new `onManual` option.
- `TellerPanel`: the reserve step renders first until confirmed, then becomes the "Next: visit your business" pointer under the transfer tools.
- `TownModal`: the details panel scrolls to the top whenever the mission step, cart spot or completion changes; the finish button sits under the milestone list; the café shortcut is hidden until the cart is licensed.
- `vite.config.ts`: pre-bundles Three.js and its example modules so opening the city in `vite dev` no longer forces a mid-session reload or loads two copies of Three (dev only; production bundles were already single-copy).

Measured after (same fresh game, Chrome, 61 fps):

| Leg | Before | After |
|---|---|---|
| Square → reserve confirmation visible | 4 taps + scroll, ~12 s | 1 tap, 5.1 s |
| Bank → cart offer open | 2 taps, ~7.5 s | 1 tap, 4.8 s |
| Main Street → cart panel open | 2 taps, ~4.4 s | 1 tap, 2.2 s |
| Cart customer visit | 10.8 s | 5.3 s |
| Square → café practice panel open | 3 taps, ~6 s | 1 tap, 2.4 s |
| Complete journey | open recap + scroll + tap | 2 taps |

Practice shift timing was left as is: three guests, ~25 seconds with an attentive player, relaxed patience 90 s / rush 35 s. No financial rule, price, cost or save shape changed.

Validation: 243 tests across 39 files passed (`test/TownGuide.test.tsx` added: labels for every stage, door chaining, jog rule, teller ordering), TypeScript and the production build passed, `git diff --check` clean. Logs: [tests](verification/pacing-2026-09-05/tests.log), [build](verification/pacing-2026-09-05/build.log). Browser replay covered the whole loop from a new game, including a ground tap cancelling a guided walk and a full practice shift (3/3 served, $3 illustrative profit, cash unchanged). Console clear.

Limits: desktop Chrome only; the physical-phone check is still open. The user's 5187 save was not opened or changed. `dist/` was rebuilt at the end of this pass, so an already-open 5187 page needs a full refresh before opening the city.

## Street life, character polish, vehicles and sound — September 5, 2026 (late evening)

Request: make the square feel more alive, give residents clearly male and female features, add vehicles, and make the sounds more realistic and relevant. Local only, uncommitted.

Art (Blender, headless, `scripts/build-town-extras.py`, new; run between the base build and the refinement script):

- The single animated character now carries optional parts on its Head, Torso and Hips pivots: `Fem_HairLong`, `Fem_HairSide`, `Fem_Fringe`, `Fem_Ponytail`, `Fem_Earring`, `Fem_Lips`, `Fem_Bust`, `Fem_Skirt`, `Masc_Beard`, `Masc_Cap`. All six clips are unchanged. Character export grew from 242,648 to 333,824 bytes.
- New `town-vehicles.glb` (100,568 bytes, Draco): a hatchback and a delivery van with named wheels and hubs, headlamp/tail-lamp materials and a recolourable paint material. Editable source `assets/town/town-vehicles.blend`.

Runtime:

- `components/town/townResidents.ts` (new): `characterSex` maps the eight story characters, reads the pictured emoji for custom avatars and settles deterministically otherwise; `residentStyle` alternates men and women with varied hair, beards, caps and clothes; `styleCharacter` toggles the parts, narrows or broadens the jacket and recolours cloned materials; `seatActor` poses a sitter with feet on the ground. The player's figure follows the chosen character, the teller is a woman, the café staff and guests (Mia, Sam, Leo) are styled individually.
- `components/town/townTraffic.ts` (new): six vehicles on two right-hand lanes of Main Street, wheels spinning, headlamps lit in rain. `vehicleSpeed` rolls a vehicle to a stop 2.6 m short of anything ahead in its lane (the player on the road, or the vehicle in front) and pulls away when clear; the braking band covers the whole carriageway and not the pavements. Vehicles report each pass for a panned whoosh.
- `components/town/townLife.ts` (new): seven pigeons pecking around the fountain that scatter when the player comes within 2.1 m and land 5–8 m away inside the square; bunting between the four lamp posts with waving pennants.
- Twelve residents (was eight) now walk on the shop pavement and the promenade instead of the road, and two rest on the promenade benches facing the fountain; café regulars stand at the shopfront.
- `components/town/townAtmosphere.ts`: the ambience is now a layered synthesized soundscape — breeze and city hum that muffles indoors, birdsong on dry days only, rain hiss, the fountain heard only nearby, a stereo-panned whoosh for each passing car, shoe-step bursts that differ indoors, an espresso machine while a drink brews, and chimes for order, serve, walk-out, cart sale and the badge. Still no downloads or licensed audio; sound stays off by default.
- Dev builds expose `window.__town` (traffic, pigeons, player position) for console QA; production strips it.

Validation: 251 tests across 40 files passed (`test/TownLife.test.ts` added: sex mapping, style toggles with material cloning, seated pose, lane coverage and braking curve, pigeon flee/landing rules, GLB contents and size caps), TypeScript and the production build passed, `git diff --check` clean. Logs: [tests](verification/street-life-2026-09-05/tests.log), [build](verification/street-life-2026-09-05/build.log). Browser replay in Chrome at 61 fps: traffic braking confirmed from the dev handle (lead car stopped at 2.6 m, two queued behind), pigeon scatter confirmed (two flew and landed on the far side), women and men distinguishable at a glance in the square, at the cart queue, at the teller and in the café; sound toggled on with a clean console.

Limits: sounds were verified to schedule without errors, not listened to on a physical device. Model rebuild order is documented in `assets/town/README.md`. Physical-phone frame rate with the extra residents and vehicles remains untested. `dist/` was rebuilt at the end of this pass; refresh an open 5187 page before opening the city.

## Cyclist, dog walker and a livelier café shift — September 5, 2026 (night)

Request: add a bicycle and a dog walker to the square, and make working the coffee shop feel less flat. Local only until committed.

Street:

- `scripts/build-town-extras.py` now also builds `Bike` (tube frame, two named wheels, hubs, saddle, bars, two named pedals) and `Dog` (body, chest, head, snout, ears, eyes, collar, four named legs, tail) into `town-vehicles.glb` (153,864 bytes, Draco). Editable source in `assets/town/town-vehicles.blend`.
- `townLife.ts`: `createCyclist` seats a styled character clone on the frame with no mixer, pedalling in time with the wheels, riding east along the kerb lane at 4.4 m/s and looping; `createDogWalker` trots a dog a pace ahead of resident 10 on the shop pavement with swinging legs, wagging tail and a leash drawn from the walker's hand to the collar each frame.
- Car and bike wheels now spin about their axle (`rotateY`), which the earlier euler-z spin did not.
- Model URLs carry a `MODEL_VERSION` query so browsers stop serving a cached model after an export (this is what hid the first bike/dog attempt; production had the same exposure).

Café shift (`services/cafeService.ts`), designed from what felt flat in play: standing idle during the brew, one guest at a time, no tension, no reward for speed.

- Juggling: while a drink brews the next queued guest's order can be taken; finished drinks wait on the machine as `ready` and must be collected (`pickup`) before delivery, so the loop is take → brew → take another → collect → serve rather than a linear wait. Task priority is carry, collect, take, brew.
- The helper now actually helps: with a helper hired, guests at the counter are taken after 3 s without the owner (`helperTook`), so the owner only brews and delivers; the helper figure plays the serve clip while doing it.
- Busy market days bring four guests (Mia, Sam, Leo, Ava), rain three, premium pricing one fewer; arrivals every 7 s (rush 5 s). Patience 60 s relaxed / 34 s rush, −8 s at premium prices, +12 s with a helper (was 90/35: relaxed had no tension at all).
- Tips: a guest served within the first 45 % of their patience tips $1 ($2 at premium prices). Tips are credited with the sale, shown on the guest's label and the HUD ("Tip! +$1" flash), and listed separately on the receipt.
- Stars: 0–3. Everyone served earns two; tips from at least half the guests earns the third. Shown live in the HUD, on the receipt, and in the shift result event.
- A ready-cup mesh appears on the machine; a two-note chime plays when a drink is ready and the sale chime when a tip lands. Default practice plan is now six drinks so the first shift is full.
- Financial rules unchanged otherwise: costs charged at the start, each sale (plus tip) credited once on delivery, one paid shift per month, unused stock not refunded. Old saved shifts load unchanged (new fields are optional).

Validation: 254 tests across 40 files (`test/CafeService.test.ts` rewritten for four guests, pickup, juggling, helper, tips and stars; `test/TownLife.test.ts` checks the bike and dog nodes), TypeScript and production build clean, `git diff --check` clean. Chrome playtest at 61 fps: cyclist and dog walker observed via the dev handle and on screen; full practice shift with the auto-player served all guests with tips; console clean.

## Café reputation, the Exchange trading floor and the investor journey — September 6, 2026 (overnight build 1–2)

Overnight autonomous session; Pieter asked for the game to be built out to completion, tested, documented and eventually deployed.

**Café reputation (commit `fa09220`).** `CafeState.reputation` (0–100, old saves read as 50) is moved by each paid owner shift's star rating (−12 / −4 / +4 / +12) and drifts three points back toward 50 in months without a shift. Monthly demand scales by 0.8 + reputation/250, so a well-run café draws up to 20% more buyers and a neglected one 20% fewer. The café panel shows the score, label and next-month demand effect; shift receipts explain the change; practice never moves it. Tests cover scaling, deltas, clamps, drift and month settlement.

**The Exchange (this commit).** A third walkable interior behind the Stock Exchange door, built like the bank (`components/town/townExchange.ts`): a ticker board and two chart screens drawn on canvas textures, a broker desk with a broker who waves and speaks in a bubble, two traders at side desks, an exit mat and a halo at the talking spot. The teller now also greets with rotating lines.

- Teaching market index: `GameState.marketIndex` (starts at 100, one point per month, three years kept) compounds with the game's cycle phase plus a deterministic wobble, so daily-challenge worlds stay in sync. It draws on the trading-floor screens and as a sparkline in the broker panel.
- Broker panel (`ExchangePanel.tsx`): market mood in plain language with advice for each phase and recessions; three contrasting assets (S&P 500 index, Dividend Aristocrat, Bitcoin) with price, cash yield versus growth assumption, a plain "bad year" downside sentence, current holding with unrealised gain, Buy 1/5/10 with a reserve warning, and Sell all (which feeds the existing hindsight lesson). A "time in the market" calculator shows what $100–$500 a month for 5–20 years pays in versus what it could be worth at the index assumption and at a cautious 60% of it.
- `handleBuyAsset` accepts a quantity for cash purchases (merged into the existing holding at an averaged cost basis, one event); mortgages unchanged.
- Investor journey (`investorJourney` in `townJourney.ts`, shown by the guide once the opening badge is earned): read the market mood → own an index fund → hold three months → compare growth with cash income → "Patient investor" badge, no cash. `activeJourney` picks the arc; the guide button chains through the Exchange door to the broker in one tap; labels and hops tested.

Validation: 263 tests across 41 files (`test/TownExchange.test.ts` added), TypeScript, production build and `git diff --check` clean. Chrome: one tap from the square reached the broker panel in 3.9 s, the visit advanced the journey to 2/4, Buy 5 took cash from $12,245 to $9,735 with the holding and ticker updating and the journey moving to "Let it ride". Console clean apart from an unrelated browser extension warning. Logs: [tests](verification/exchange-2026-09-05/tests.log), [build](verification/exchange-2026-09-05/build.log).

## Property & Co. estate office — September 6, 2026 (overnight build 3)

A fourth walkable interior behind the Property Office door (`components/town/townProperty.ts`): a listings wall with four framed cards drawn on canvas (house sketch, price, rent and financing tag), a title banner that reads the rate climate, a rates board on the side wall, an agent's desk with a model house, waiting sofas and the usual exit mat and talking halo. A female agent waves and speaks in a bubble.

Agent panel (`PropertyPanel.tsx`) backed by `services/townProperty.ts`:

- Each listing (fractional rental share, starter home, duplex) shows gross rent, then what is left after a 1%/yr upkeep allowance and an 8% vacancy allowance, then rent minus the best eligible mortgage payment, with an explicit "you would top this up from salary" when it is negative.
- Mortgage quotes come from the game's own options and base rate (`mortgageQuote`), including eligibility reasons, and "Preview a mortgage" hands the item to the existing App mortgage modal; it is disabled when the down payment would leave less than a month of expenses.
- Rent-or-buy comparison for the starter home or duplex across the eligible down-payment options: owner cost per month versus estimated rent (a third of expenses), first-year principal and 3% appreciation as equity, and a one-line verdict of who comes out ahead, with the caveat that prices can fall.
- Fractional shares buy for cash through the normal purchase path.

Validation: 268 tests across 42 files (`test/TownProperty.test.ts`), TypeScript, build and `git diff --check` clean. Chrome: walked to the office, entered, walked to the agent, panel opened with live prices; the mortgage preview opened the App modal. Logs: [tests](verification/property-2026-09-06/tests.log), [build](verification/property-2026-09-06/build.log).

## Day-night cycle and the notice board — September 6, 2026 (overnight builds 4–5)

**Day-night cycle (`components/town/townDaylight.ts`).** A full day passes in ten real minutes while the city is open; each month opens at a slightly different morning hour so sunset arrives a few minutes into play and advancing months changes the light. The sun swings across the square and warms at the horizon; the hemisphere light, environment ambient, background, fog and tone-mapping exposure follow. At dusk four street lamps come on (point lights plus glow sprites), every shop window glows warm through the merged glass material, and vehicle headlamps light. The caption reads MORNING / MIDDAY / EVENING / NIGHT, birdsong stops after dark and crickets start. Rain dims and greys the daylight without turning it into night; reduced motion holds a fixed late morning. Interiors keep a constant working light.

**Notice board (`services/townChallenges.ts`, `NoticeBoardPanel.tsx`).** A community notice board stands by the fountain; a "Board n/3" button and, once both journeys are complete, the guide strip open it. Each month shows three challenges chosen deterministically from a pool (full reserve at month end, put new money to work, top up savings, pay debt down, three-star owner shift, earn a tip, work the cart, hold through the dip) with live progress bars. Progress is judged against a snapshot taken when the month began (or when the board is first opened in a month), so it counts what the player does this month, not what they already had. `processTurn` closes the month, records a twelve-month log, and starts the next snapshot; the panel shows last month's verdict, total challenges completed and "clean sweeps". Badges only, never cash.

Validation: 274 tests across 44 files (`test/TownDaylight.test.ts`, `test/TownChallenges.test.ts`), TypeScript, build and `git diff --check` clean. Chrome: forced sunset and night via the dev handle showed the warm dusk, dark sky, lit windows, lamp glow and headlights; the caption updated; the board opened with three challenges and correct "this month only" progress. Logs: [tests](verification/daylight-board-2026-09-06/tests.log), [build](verification/daylight-board-2026-09-06/build.log).

## Your place, Rosa the neighbour, and the city card — September 6, 2026 (overnight build 6)

**Mobile pass.** All new panels (notice board, broker, agent, café) were checked at the narrowest width Chrome allows (555 px triggers the phone layout): each opens as a full-width scrollable sheet and the destination strip scrolls sideways. No fixes were needed.

**Your place (`components/town/townHome.ts`, `HomePanel.tsx`).** An apartment door with a mailbox and a "12 Square St · Home" plate now stands at the west end of the promenade; a Home button walks there. Inside, the flat is furnished by lifestyle tier: a mattress, crate and clothes rail when frugal; a bed, table, kitchenette and bookshelf when modest; sofa, television, rug and pictures when comfortable; wider windows, lounge chairs, a bar and art when affluent; a piano, chandelier and tall plants when luxurious. Walls and floor change with the tier. The desk panel shows what the place costs and its share of income, a lifestyle chooser that routes through the existing confirm dialog (the flat re-furnishes on change), the bills pinned to the fridge (income, lifestyle, debt and mortgage payments, everything else, what is left, and how much of the bills passive income covers), the mail (recent decisions and events), the bookshelf (qualifications, children) and a sticky note from Rosa.

**Rosa (`services/townAdvisor.ts`, `AdvisorPanel.tsx`).** The grey-haired neighbour on the west bench reads the player's actual numbers and says up to three things a friend would, ordered by urgency: cash thinner than a month of bills; paying high interest while investing; more than half in crypto; lifestyle eating most of the pay; a cushion far bigger than needed; six months without investing; the dip is not the time to sell; a café with a reputation or closure problem; and, when things are good, how much of the bills passive income already covers. Each observation has a "Show me" that walks to the right place or opens the board. Her top line appears as a speech bubble when the player approaches, on the home desk, and on the dashboard.

**City card (App launcher).** The "Enter 3D city" card on the Play dashboard now shows the current guided step and its button label (or the notice-board score once both journeys are done) and Rosa's one-line read, so players in the 2D shell see what the city is asking of them.

Validation: 281 tests across 46 files (`test/TownAdvisor.test.ts`, `test/TownHome.test.ts`), TypeScript, build and `git diff --check` clean. Chrome: door, flat, desk panel, lifestyle chooser, Rosa's bubble and panel and the dashboard card all verified; console clean. Logs: [tests](verification/home-rosa-2026-09-06/tests.log), [build](verification/home-rosa-2026-09-06/build.log).

## Seasons — September 6, 2026 (overnight build 7)

`components/town/townSeasons.ts`: the game month sets the season (December to February winter, then spring, summer, autumn). The merged city materials are recoloured by name, so the Blender model is untouched: winter whitens the ground and pavements and cools the sun; autumn turns the canopies orange and gold; summer restores the exact original colours. A shared particle cloud drops snow in winter and leaves in autumn, hidden indoors and under reduced motion. The caption now reads e.g. "MONTH 2 · WINTER · MARKET DAY · MIDDAY". Dev handle: `window.__town.setSeason('autumn')`.

Validation: 284 tests across 47 files (`test/TownSeasons.test.ts`), TypeScript, build and `git diff --check` clean; Chrome showed winter (month 2), then forced autumn and summer. Logs in `docs/verification/seasons-2026-09-06/`.

## Café incidents that follow your choices — September 6, 2026 (overnight build 8)

`cafeIncidents` and `settleCafeMonth` in `services/townCafe.ts`: each trading month can bring surprises whose odds come from the owner's decisions, not luck alone. A basic machine breaks about one month in six (a $250 repair and lost capacity); the upgraded machine one in eighteen (a $180 service). Health inspections come roughly every four months: an improvement notice and $150 fine below 40 reputation, top marks and +4 reputation above 70. A second barista quits an unloved shop (helper hired, reputation under 45), leaving the wage paid and capacity down. Regulars bring friends to a well-run café (reputation 80+), adding sales. Incidents are deterministic per month (no `rand`), never appear in forecasts, are settled in `processTurn` (cash, reputation, an event per incident, the ledger line) and are listed on the café receipt. Tests cover determinism, the breakdown ratio, reputation gating, settlement and the turn.

Validation: 288 tests across 47 files, TypeScript, build and `git diff --check` clean. Logs in `docs/verification/cafe-incidents-2026-09-06/`.

## Year-in-review city section — September 6, 2026 (overnight build 9)

The annual report now carries a "Your city this year" block: badges earned, notice-board challenges completed and clean sweeps in the twelve months that closed, and, when a café exists, its operating profit after all costs across the year, the number of paid owner shifts, and where reputation stands. `YearStats` accumulates café profit and owner shifts each month; the report is built at the year boundary in `processTurn`. Tests cover the data and the modal render.

Validation: 290 tests across 47 files, TypeScript, build and `git diff --check` clean. Logs in `docs/verification/annual-city-2026-09-06/`.

## A building around the apartment door — September 6, 2026 (morning)

Pieter's first note after the overnight run: "my apartment is only a door … it does not seem to be part of any building." `createHomeFacade` in `components/town/townHome.ts` now places a two-storey townhouse at the west end of the promenade behind the door at 12 Square St: sand walls with cream cornices and a slate roof, two windows either side of the door on both floors plus one above it (they share the shopfront night glow through `light.windows`), a clay canopy with a porch lamp, and a planter. The building's box joins the camera collision list so the follow camera cannot cut through it. While checking it, the camera jammed against the door: the tree-canopy collision boxes were treated like walls and pulled the camera in whenever the ray crossed a canopy. Canopies now only push the camera when it would actually sit inside one. Verified in Chrome from the square (follow camera at the door, neighbourhood overview, and night with the windows lit).

Validation: 291 tests across 47 files (`test/TownHome.test.ts` covers the facade meshes, bounds and glass), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/home-facade-2026-09-06/`.

## Adaptive graphics quality — September 6, 2026 (build 10)

The outstanding risk for the city is real-phone performance. `components/town/townQuality.ts` now gives the scene three tiers: Detailed (resolution cap 1.6×, 2048 shadow map), Balanced (1.15×, 1024) and Smooth (0.85×, no shadows). A governor watches real frame times: two seconds averaging above 26 ms steps one tier down; twelve seconds averaging under 11 ms steps back up, but never into a tier left in the last 90 s, and the first three seconds (shader warm-up) and frames over 250 ms (tab switches) are ignored. Auto starts on Balanced when the device looks like a phone (four cores or fewer, or a coarse pointer with a dense screen). The Camera menu gained a Graphics row (Auto / Detailed / Balanced / Smooth; the choice persists in `tycoon_town_quality`) and now scrolls when it is taller than the viewport; an automatic switch shows a seven-second status note pointing at the menu. Switching shadows off and on marks every material for recompilation so the change is clean.

Chrome: Smooth removed the tree and building shadows and the stored mode read `low`; Detailed restored them; with Auto selected, a scripted 45 ms busy-wait per frame drove the governor from Detailed to Smooth in about seven seconds and the note appeared. Console clean apart from the Chrome extension's own message-channel line.

Validation: 295 tests across 48 files (`test/TownQuality.test.ts`: device guess, stored mode, demotion with warm-up and tab-switch handling, promotion with cooldown, fixed choice never overridden), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/quality-2026-09-06/`.

## Petite women and A-line skirts — September 6, 2026 (build 11)

Pieter's morning feedback: the women were "very muscular and the dresses look odd with pants shining through". Two causes. The skirt was a cone narrower at the hips (radius 0.21) than the trousers sphere under it (0.29), so the trousers poked through; and women shared the male body with only the jacket narrowed. Now `Fem_Skirt` (`scripts/build-town-extras.py`) is an A-line cone, top 0.32 and hem 0.40 reaching the knee, so nothing underneath can show, and `styleCharacter` (`components/town/townResidents.ts`) applies a petite build to women: the figure 5% shorter, hips and torso pivots narrowed (which also brings the shoulder pivots inward without moving them, since the clips key pivot positions), sleeves, forearms and legs slimmed, the head compensated to stay near its normal size, the bust reduced, and the leg meshes under the skirt recoloured to the skin tone so they read as bare legs rather than trousers. Men are untouched. Model rebuilt through the extras and refine scripts; `MODEL_VERSION` bumped to 20260906a.

Chrome close-ups at the front door, mid-walk and on Rosa's bench showed slim figures, skirts covering the hips and thighs, and skin-toned legs; residents at distance still read as distinct women and men.

Validation: 295 tests across 48 files (`test/TownLife.test.ts` now checks the petite scales, the recoloured legs and that men and the source materials are untouched), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/petite-2026-09-06/`.

## Residents make room, and Freedom Day — September 6, 2026 (builds 12–13)

**Crowd contact.** Residents used to walk straight through the player. `yieldTo` in `components/town/townResidents.ts` now gives each walking resident a lateral drift: within 1.7 units along the lane and 1.15 across it they ease 0.72 units to the side of the lane away from the player, and if the player stands directly in their path within 0.95 units they wait (their pause is subtracted from the lane clock, so the walk resumes where it stopped rather than teleporting). Cart customers, café visitors and bench sitters are unaffected. Measured in Chrome with the player standing on the promenade lane: four residents passed in 28 s, the closest at 0.74 units, all on the far side; none walked through.

**Freedom Day.** Reaching financial freedom used to change nothing in the city. Now, while `state.hasWon` is true: the caption reads FREEDOM DAY with "Passive income covers your life · the square is celebrating you" (indoors: "come outside for the fireworks"); fireworks burst over the fountain and promenade every 2.2 s from deterministic origins (72 additive particles per shell, thrown outward and pulled down by gravity, faded over 1.9 s; four shells recycled; nothing under reduced motion); a celebration chime sounds on every third burst; and Rosa's first line becomes "You did it. Your money works so you do not have to." with a warning about lifestyle creep, ahead of every other rule. `cityCaption` in `townGuide.ts` now owns the caption copy. Verified in Chrome at night from the overview camera.

Validation: 298 tests across 49 files (`test/TownFreedom.test.ts`: sidestep direction, blocking pause, recovery; deterministic burst count, shell recycling, reduced motion; caption and Rosa's ordering), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/freedom-2026-09-06/`.

## City accessibility pass — September 6, 2026 (build 14)

The roadmap's open screen-reader and keyboard review of the city. In `TownModal.tsx`: the side panel (`aside`, now `tabIndex=-1`) takes focus when it opens and hands it back to the element that opened it when it closes; the camera menu focuses its first button on open and returns focus to the Camera button (now `aria-haspopup`) on close; a window-level Escape handler closes the camera menu, then the side panel, and only when neither is open does the Modal's own Escape close the city; a visually hidden `role=status` line announces "On Freedom Square" or "Inside the Community Bank" on room changes. In the scene, the canvas is `role=application` with a fuller description, and Enter (when the canvas has focus) does what E does. `town.css` now honours the game's accessibility preferences: `.tycoon-text-lg` zooms the HUD, navigation and panels by 15% without touching the 3D view; `.tycoon-high-contrast` brightens muted copy, gives every button a light border, opaque backgrounds to the caption and location cards, and a 3 px focus ring.

Chrome: with both classes on `<html>` the header, destinations, journey strip and caption scaled up and gained bright borders; opening the Camera menu moved focus into it, Escape closed it, focus returned to the Camera button and the city stayed open.

Validation: 301 tests across 50 files (`test/TownA11y.test.tsx`: Escape closes the panel before the city, focus moves into the panel and back to the trigger, the status line exists), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/a11y-2026-09-06/`.

## Main Street Offices — September 6, 2026 (build 15)

The city covered money but not the job that funds it. The player's employer now stands at the east end of the promenade, mirroring the townhouse (`createHomeFacade` with an office palette and a negative x scale; its bounds join the camera walls). Inside (`components/town/townWork.ts`): the manager behind a long desk, two colleagues seated at workstations, a payroll board and a career-ladder board redrawn from the live state (`setPayroll` in the scene, `workBoard` in the service), and a "Pay yourself first" poster. The manager's speech bubble carries the manager line ("23 more months and we talk about Journeyman.").

`services/townWork.ts` explains three things every player should understand about a salary. The **pay stub** starts from base pay and adds each real adjustment the turn applies (education premium, AI pressure on the industry, the recession squeeze, overtime, a layoff month, character perks) so the lines reconcile to the dollar with `calculateEffectiveMonthlySalary`; the player's share of the year's income tax is spread monthly and taken off to show take-home. The **promotion outlook** names the next title and its pay, shows experience as a progress bar, lists blockers (months short, a missing qualification with its level and field, recession halving the odds, high stress) and boosters (networking, happiness), and, once eligible, the monthly odds and expected months of asking, using `checkPromotion`'s exact formula without the dice; the "Ask about a promotion" button calls App's existing manual promotion. **Job security** rates the career path's future-proof score and AI exposure and lists what shields the player (passive income share, a side hustle, qualifications) with links into the Career and Education tabs.

Chrome: Work button walks to the new door; the location card reads "Main Street Offices · Go to work"; inside, the location card, interior nav and panel all work, the eyebrow reads "MAIN STREET OFFICES · SKILLED TRADES" for the QA character (an apprentice: $3,507 gross, $403 tax share, $3,104 take-home, 23 months to Journeyman); colleagues sit at their desks. No page errors were raised by the app.

Validation: 306 tests across 51 files (`test/TownWork.test.tsx`: stub reconciliation incl. layoff and recession, outlook blockers/odds/education gate/top rung, security labels, boards and room, panel gating), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/workplace-2026-09-06/`.

## Neighbourhood tour, download progress, city after winning — September 6, 2026 (builds 16–17)

**Download progress.** The city's three model files total about 1.6 MB; the loading overlay used to spin silently. `createTownScene` now reports one weighted fraction across the files (`onProgress`) and the overlay reads "Downloading the city… 42%", then "Building the square…". Bundle facts for the record: the 2D game's main chunk is 1.12 MB (307 KB gzipped), the city chunk with three.js 823 KB (227 KB gzipped) and loads only when the city opens; the Draco decoder (719 KB) loads only for the compressed city model.

**City after winning.** The dashboard's "Enter 3D city" card was disabled once `hasWon` was true, which made the Freedom Day celebration unreachable. It now stays open (the modal's `disabled` prop still blocks money actions).

**Neighbourhood tour.** A third guided arc so the newer places are discovered rather than stumbled on. `tourJourney` (stage 3) starts once the investor badge is earned: read the pay stub with the manager, check the bills at your desk, ask Rosa for a second opinion, complete a notice-board challenge, then finish for the "Settled in" badge (an ACHIEVEMENT event, no cash). The guide button chains each stop in one tap: `GuideTarget` gained manager/desk/rosa/board and `guideNextHop` walks through the office and apartment doors (`enterWork`/`walkToManager`, `enterHome`/`walkToDesk`); arriving at Rosa or the board opens their panels. Visits are recorded through `resolveTownAction` (`visit-work`, `visit-home`, `visit-rosa` → `townProgress.workVisitedMonth` etc.), so the arc survives reloads. The journal shows the three badges, the strip reads "NEIGHBOURHOOD TOUR · n/5", the dashboard card names the arc, and the year-in-review lists the badge. Once the tour is complete the guide falls back to the notice board as before.

Chrome (QA save advanced past the investor journey): the card read "Neighbourhood tour · Clock in"; one tap walked to Main Street Offices, entered, reached the manager and opened the pay stub, and the label advanced to "Go home"; the next tap did the same for the apartment desk; then Rosa; the challenge milestone was already met on this save, so the strip read "You know the neighbourhood" and the journal offered "Complete my neighbourhood tour ✦".

Validation: 308 tests across 52 files (`test/TownTour.test.ts`: arc order, idempotent visits, completion badge, stage selection, guide labels and hops; `test/TownExchange.test.ts` updated for the new final stage), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/tour-2026-09-06/`.

## Rosa points at the office — September 6, 2026 (closing touch)

`adviseFrom` gains a rule: when the promotion outlook says the player qualifies for the next title, Rosa says "You qualify for Developer. Ask." with the monthly odds and the point that a raise compounds; "Show me" walks to Main Street Offices (or to the manager when already inside). Test in `test/TownWork.test.tsx`. Validation for this touch: 309 tests across 52 files, build clean; logs in `docs/verification/closing-2026-09-06/`.

## Soak test and return to the city — September 6, 2026 (build 18)

A robustness pass over the city as a whole. Four open/close cycles in one page: the canvas is removed on close every time, the JS heap returns to baseline and no errors surface; ten rapid destination taps and four sound toggles settle cleanly. The one real finding: closing the month from the notice board handed the player to the 2D month preview and left them on the dashboard. App now remembers that the month was closed from the city (`returnToTown`) and reopens the square once the turn settles, unless an event, the annual report, bankruptcy or a fresh win needs the 2D shell first. Confirming the month preview had to preserve that flag because closing the preview clears it. Verified across four months in Chrome: months with events stayed on the event (whose own "Enter 3D city" button remains), and the first event-free month came straight back to the square with the new month's board in the strip.

## Spanish for the city — September 6, 2026 (build 19)

The roadmap's last open item. The city builds most sentences from live numbers, so key lookups would have meant hundreds of fragment keys; instead `i18n/town.ts` exports `tl(en, es)`, which returns the Spanish side only when the game locale is `es` (read through the module-level `getLocale`, with `setTownLocaleOverride` for tests). Every panel (teller, cart shift, café, café service and HUD, Exchange, property, home, Rosa, notice board, workplace), the modal chrome (navigation, interior nav, journey strip, location cards, camera and graphics menus, loading and fallback copy, journal and recap), the guide labels and captions, and the service copy (opening, investor and tour journeys; Rosa's rules; challenges; market mood and downside sentences; pay stub lines, blockers, boosters, shields and manager lines; café reputation labels; shift tasks and station names), plus the teller's speech bubble, the canvas boards (payroll, ladder, poster, notice board, ticker) and the dashboard city card now carry both languages inline. Persisted records keep the English they were written with (events, receipts); café incident copy is substituted at render by id, and cart weather is mapped at render. Two guide-button comparisons that matched English labels now compare against the same `tl` call so the reserve and permit buttons still disable correctly in Spanish. Proper names stay (Rosa, Main Street, career titles from `CAREER_PATHS`, guest names); the English tests are unchanged and `test/TownSpanish.test.ts` pins the Spanish side across every layer. A native-speaker read is the sensible next step.

Chrome with `tycoon_locale=es`: caption "MES 8 · VERANO · DÍA DE MERCADO · MEDIODÍA", the navigation, strip, location cards, Rosa's panel and bubble ("Tu casa se come casi todo tu sueldo"), the notice board, the office and the dashboard card all read in Spanish; no errors.

Validation: 310 tests across 53 files, TypeScript, build and `git diff --check` clean. Logs in `docs/verification/spanish-2026-09-06/`.

## Cold-start playtest — September 6, 2026 (build 20)

A brand-new game on the isolated QA origin (storage cleared, Maria Santos on Normal), played the way a first-time player would. **Bug found and fixed:** the Main Street Offices interior was drawn in the middle of the square on a fresh game because the new room was never hidden before the first door transition (the other rooms hide themselves on creation). Hidden by default now, pinned by a test, and pushed to production within minutes of finding it. The rest of the first hour held: the surprise-bill first step, the dashboard city card, one-tap guiding into the bank and the reserve confirmation, the cart purchase ($1,504) and permit, the first pop-up shift with its receipt, "Preview next month" closing the month and returning to the square at month 2, the Neighbourhood entrepreneur badge, the Exchange chain to the broker and the first index purchase, and events interleaving correctly (the event modal keeps its own "Enter 3D city" button). Autoplay stays paused while the city is open (it is in `isAutoplayBlocked`). The demo wall from inside the city follows the unchanged June path (`advanceMonth` shows the unlock modal after the month preview; the return-to-city flag is dropped), reasoned from the code rather than observed, because the QA save could not be held at month 37 across reloads. The bank's poster was the one English string left in Spanish mode; translated.

## Deeper career play at the office — September 6, 2026 (build 21)

Pieter's pick for the next scope. `services/townCareer.ts` adds two decisions with real consequences and one convenience.

**Ask for a raise.** At the manager's desk the player can ask for 8% or 15%. The odds are shown before asking and every factor is named: the network (±15 points around a 50 base), time in the current rung (up to +15), a bold ask (−15), recession budgets (−20), visible stress above 70 (−5) and being paid above the next rung already (−10), clamped between 5% and 90%. Success applies the full raise to base salary (career and job records together); failure still moves pay by 3% or 2% (managers rarely say a flat no) but costs happiness and adds stress, and either way the player cannot ask again for six months. A DECISION event records the outcome and the panel shows it as a receipt. The roll is plain `Math.random` because the city is never open during a daily challenge.

**Job board.** Every other career path is listed with its entry title and pay (difficulty-scaled), the difference against current pay, the future-proof score and AI exposure, the path's own note, and whether a qualification on file is relevant. Applying is a two-step confirm. A change costs a month between jobs with no salary (the existing `jobLossMonthsRemaining` mechanic, so the pay stub shows it), resets the ladder to rung one, credits six months of experience when a relevant qualification is on file, adds ten stress, records an event and locks further changes for twelve months. Education, cash and assets are untouched, which is the lesson: retraining and a pay reset are the price of a safer field.

**This month at work.** The dashboard's Overtime, Networking and Skill Training actions appear at the desk with the same handler, energy costs and monthly limit, so a player who lives in the city never has to leave it for them.

The office wall gained a job-board canvas (top four listings by future-proof score). While wiring the raise, the dashboard's own raise negotiation event turned out never to change salary (its success text promised it); scenario outcomes now support `salaryChangePct`, applied to career and job salary, and the negotiation results carry 15/3 and 8/2.

Chrome: for the QA medical assistant the panel offered "Ask for 8% · 42% chance" and "Ask for 15% · 27% chance" with the factors listed; asking for 8% was declined and pay moved $3,012 → $3,072, both buttons then disabled for the cooldown and the payroll board on the wall redrew with the new figure; the job board listed seven paths with deltas and scores; applying to Skilled Trades ran the two-step confirm and switched the role.

Validation: 315 tests across 54 files (`test/TownCareer.test.tsx`: odds and factors, raise/consolation/cooldown, the scenario salary fix, board contents, the career change and its cooldown, panel wiring), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/career-2026-09-06/`.

## Performance reviews, layoffs and the job search — September 6, 2026 (build 22)

Pieter's next pick after the career build. Three mechanics that close the loop between how the player works and what happens to the job.

**Performance review.** Every January, for normal games, `processTurn` grades the year that closed before it builds the annual report. The score starts at 50 and moves with the network (±15), stress (+10 to −12), energy, morale, the desk actions taken that year (overtime up to +12, training up to +8, networking events up to +6; `applyMonthlyAction` now counts them in `yearStats.workActions`), months between jobs (−8 each, counted in `yearStats.monthsUnemployed`) and financial judgement. A is 80+, B 62+, C 45+, D below. A and B pay a bonus of 60% or 25% of a month's salary in cash; D puts the player on notice. The review is stored with its factor ids (so the panel labels them in either language), recorded as an event, shown in the annual report's city section and in a "Last review" block at the office, and it feeds promotion odds for the next twelve months (A +10 points, B +4, D −5).

**Layoffs.** One seeded roll per turn (`applyLayoff`, skipped in challenges and while already between jobs). The monthly hazard is 0.4% × (0.5 + 2.5 × the field's AI exposure) × 2 in a recession × the last review (A ×0.5, C ×1.5, D ×2.5) × 0.8 from level 4, capped at 5%. A cut pays severance from half a month to three months of salary by experience, sets three months between jobs, adds stress and records a WARNING event naming the cause (recession cuts, an AI restructuring, a restructuring). The Job security block now prints the annual risk with each multiplier, so the number is never a surprise.

**Job search.** While between jobs the office shows a Between jobs block: months left, how many months of bills the cash covers, and a once-a-month application with honest odds (35% base, ± network, ± demand for the field, −10 in a recession, clamped 10–80%). An offer ends the gap and pay resumes next month; a miss costs a little stress and the player tries again next month or takes another path from the job board, which now stays open while unemployed (a change replaces any longer search with the usual one-month gap).

Chrome (QA save patched to two months between jobs with a B review on file): the office showed Between jobs · 2 months, "Apply for roles this month · 50% chance" with the network and field-demand factors, the Last review block (B · 71/100, bonus $750, factor list), the layoff-risk line under Job security, and the application resolved with the result in the panel.

Validation: 320 tests across 55 files (`test/TownReviews.test.ts`: grading, bonus, promotion effect, January landing inside `processTurn` with the report line and counter reset, desk-action counting, hazard multipliers, layoff application, search once a month, career change while unemployed), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/reviews-2026-09-06/`.

## The one-on-one and the recovery plan — September 6, 2026 (build 23)

Pieter's pick: a mentor conversation that explains a bad review and offers a way back. It lives at the manager's desk as a "One-on-one" block.

**The conversation.** `mentorTalk` opens according to where the player stands: after a D ("That review was hard to write, and I would rather fix it with you than watch it repeat"), a C, a good year, no review yet, or a layoff ("Losing a role is not the same as losing your value"). It then takes the last review's three weakest factors and gives each a plain cause and a concrete fix (stress above 60 reads as burnout; a thin network makes every ask a cold ask; skills are the only thing that travels with you if the role disappears; months out of work drag the year down whatever else happened), and it projects the grade if the year ended today from the current numbers, so the player can see the year moving before January judges it. Every line is bilingual.

**The plan.** `proposeRecoveryPlan` picks two or three goals from the weak spots: bring stress to 55 or less, lift networking by ten points, take a recovery month, one skill training, one networking event, one overtime month, or land a job when between jobs. Agreeing stores a three-month plan with a snapshot of a new cumulative desk-action log (`townProgress.workLog`, bumped for overtime, networking, training and recovery, never reset, so plans can straddle January). The block tracks each goal live with checkmarks and the current value. When the plan ends, `processTurn` judges it: completed lifts stress and morale, credits +10 to the next review (the review's factor list shows "Recovery plan completed"), lifts a D notice so the layoff hazard and promotion odds treat it as a C, and records an achievement; missed records a note and no penalty, and the player can agree another plan.

Chrome (QA save between jobs, B review on file): the one-on-one opened with the layoff line, explained the network factor with cause and fix, offered "Agree a 3-month plan: Land a job · Lift networking to 30 · Take skill training once", and after agreeing showed the plan with three open goals, the current networking value and "Judged in month 6. Completing it adds +10 to the next review."

Validation: 324 tests across 56 files (`test/TownMentor.test.tsx`: openers and points, proposal from weak spots, acceptance and idempotence, tracking through the log, judging completed and missed, the credit on the next review, the lifted notice through `processTurn`, the panel), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/mentor-2026-09-06/`.

## The side-hustle desk at home — September 6, 2026 (build 24)

Pieter's pick: the Life tab's side hustles, playable from the city. They live at home, at the desk by the window, because that is where a second income actually happens.

`services/townHustle.ts` reads the existing catalogue, state and income model so the numbers match the dashboard exactly: each hustle is priced on the teaching estimate for that hustle alone (the midpoint of its range trimmed by how far automation has come and by any upgrades), with its hours a week, energy and stress cost, automation exposure, start-up cost and requirements, and the exact reason a start is blocked: already running, not enough cash, a missing qualification, career level or path, or not enough energy this month. Running hustles show the months in and how far the next milestone is. The desk block in `HomePanel` lists running hustles with Stop, offers the Hustle Sprint monthly action through the same handler and limit as the dashboard, surfaces a milestone prompt that opens the dashboard's upgrade chooser, and folds the catalogue behind "Start a hustle". Starting and stopping call App's existing handlers, so the events, notifications and checks are the ones the Life tab already uses. The flat gains a hustle corner (a work table with a laptop and a mug, parcels stacked beside it, more parcels from the second hustle) that appears only while something runs.

Chrome: at the desk the block read "A second engine…" with thirteen hustles in the catalogue; starting Food Delivery from it showed "$1,048/mo · 12 h/week", the running card with Stop, the Sprint card, and the corner appeared beside the main desk; stopping it cleared both.

Validation: 327 tests across 57 files (`test/TownHustle.test.tsx`: pricing, block reasons, milestones, summary, the panel's start/stop/sprint/upgrade wiring, the corner's visibility), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/hustle-2026-09-06/`.

## Unemployment insurance at the bank — September 6, 2026 (build 25)

Pieter's pick, and the piece that makes a layoff survivable the way it is in North America. `services/townBenefits.ts` follows the real shape: only an involuntary job loss qualifies (a city layoff, or the dashboard's job-loss event; leaving to change careers is a resignation and does not), the benefit is half of prior pay capped at $2,400 a month for up to six months of the gap, the first payment lands the month after filing, and each paid month needs a job application on record. The office's monthly search satisfies that requirement (the filing month counts); a month without one pauses the benefit with a warning, which teaches the work-search rule without stranding anyone. The claim closes the month work resumes, with a note of what was paid. `payUnemploymentBenefit` runs in `processTurn` just before the job-loss countdown and never in challenges.

At the Community Bank, the teller shows the block while the player is between jobs: the rules, the claim they would get, why they do not qualify if they do not, "File the claim", then the live status (amount, months left, paid so far, whether this month's application is on record). The office's Between jobs block points at the bank and mirrors the claim. The dashboard's job-loss event has said "file for unemployment" since June without doing anything; its option now sets the layoff on record and files the claim through a new `filesUnemployment` outcome flag, so both paths meet the same rules.

Chrome (QA save patched to a layoff with three months to go): the teller offered "$1,750/mo for up to 3 months" at half of $3,500, filing turned the block into the live status with "✓ Job application on record this month: the next payment is due", and the office's Between jobs block echoed the claim.

Validation: 331 tests across 58 files (`test/TownBenefits.test.tsx`: eligibility incl. resignation and the cap, filing, the month-by-month pay/pause/close sequence through `processTurn`, the event option, the teller panel), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/benefits-2026-09-06/`.

## Money Quest square — September 6, 2026 (build 26)

Pieter's pick: the kids mode gets the square too. Money Quest runs on weeks, coins, energy hearts, a few jobs, collectibles and one savings goal, so the square had to speak that language rather than the adult economy's. `components/town/KidsSquareModal.tsx` reuses the same 3D scene and models (with a new `playerScale` option that makes the figure kid-sized) and maps four stops onto the buildings: the **piggy bank** (coins, allowance next week, goal progress, why energy matters, and Next week), the **lemonade stand** (the kids jobs with their weekly earn range, energy cost and start-up cost, Start buttons that explain what blocks them), the **toy shop** (collectibles to buy, and the shelf showing what each one cost against what it is worth now with an arrow), and the **goal jar** (the savings goals with "about N weeks of allowance away", Save for this, and the win). `services/kidsSquare.ts` holds the pure helpers. Next week runs the kids weekly turn without leaving the square; when a kids event fires the square closes so Money Quest can show it. The coffee cart appears when the lemonade job runs, reaching the goal lights the fireworks, and the copy is bilingual with short words and big buttons. The modal is its own lazy chunk (13 KB) sharing three.js with the city.

Chrome: Riley the Pet Lover on Just Right; "Visit your square" opened the square with a small figure and the four stops; the lemonade stand listed the jobs and Dog Walking started; the goal jar set Skateboard at 25%; Next week paid the allowance ($20 → $30), the caption read WEEK 2 and the goal moved to 38%, all without leaving the square.

Validation: 333 tests across 59 files (`test/KidsSquare.test.tsx`: stop mapping, allowance, energy hearts, job and toy cards with reasons, shelf arrows, goal weeks-away and progress, the fallback modal driving every stop's handler), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/kids-square-2026-09-06/`.

## Live playthrough, pants, and nobody walks through anybody — September 6, 2026 (build 27)

Pieter played the live site and asked for three things: fix anything off, sort out the women's dresses (pants, or a dress that looks right), and stop people walking through each other and through cars.

**Playthrough.** A fresh demo-tier game on the production site (Sarah Miller, Normal) ran the whole opening arc without a fault: the surprise bill, one-tap guiding into the bank and the reserve, the cart purchase, permit and first shift, the month preview and the return to the square at month 2, then the Exchange. The two visible faults were the ones Pieter named: residents overlapping head-on on the promenade, and the skirt.

**Pants.** The A-line cone never read as a dress at this model's level of detail (a lampshade over stubby bare legs). Women now wear fitted pants in the brighter skirt palette with the same petite build; the skirt mesh is hidden and the legs and hips take the pants colour. The street keeps its colour variety and the silhouette reads cleanly at every distance.

**Nobody walks through anybody.** Three changes in the scene. Pavements keep right: east-bound and west-bound walkers use separate lines on each lane (±0.42), so two residents never share a point head-on; the cyclist moved to the kerb so the west-bound line is clear of the bike. The player is eased out of anyone's personal space (`pushApart`, 0.6 units) and blocked by vehicles: traffic now exposes each vehicle's footprint and the movement code treats it as a wall with a 0.35 margin, so a stopped car cannot be walked through (the existing braking already keeps moving cars off the player). Measured in Chrome over twenty seconds on the promenade: closest resident-to-resident 0.84 (previously 0), resident-to-player 1.11; walking straight at a stopped van stopped the player 0.37 short of it.

Validation: 333 tests across 59 files (`test/TownLife.test.ts` updated for pants), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/live-play-2026-09-06/`.

## Playthrough continued: nobody gets wedged, and the resume card adds up — September 6, 2026 (build 28)

Continuing Pieter's "play it end to end" request after build 27 shipped.

**The wedge.** Build 27's `pushApart` had a failure mode the promenade measurement did not catch: it pushed the player radially away from a person, so someone standing *on* the route (the two customers queuing at the coffee cart, anyone reading the notice board) pushed the player straight backwards, and when the pushed point was not walkable the whole step was discarded. Result: the player froze at (1.44, 9.99) beside the cart queue and every later destination click did nothing. Replaced with `steerAround`: the deflection is perpendicular to the direction of travel, never backwards, people behind the player are ignored, and if the near side is a wall the far side is tried; if neither side is walkable the un-steered step is kept, so people are soft and only walls and vehicles stop the player. A waypoint someone is standing on counts as reached from arm's length, or the route would circle them forever. Measured after the fix: the walk from the fountain through the cart queue to the west end arrives every time with a closest approach of 0.77 (was: never arrives); Rosa, the office, the board, the café and home all reached from the destination bar.

**Resume card.** The mode picker's Continue card printed the raw number (`$-8,996.029`). Whole dollars with the sign first (`-$8,996`), for cash and net worth (`formatSigned` in `ModeSelector.tsx`).

**Verified this round on the QA build (5188).** Café practice shift end to end (walk to counter, take three orders, brew, deliver, "What did you keep?" summary with practice-only note), Main Street Offices pay stub while between jobs, Rosa's bench, the notice board with three live challenges, the investor journey caption at 3/4, no console errors.

Validation: 334 tests across 59 files (`steerAround` cases added to `test/TownLife.test.ts`), TypeScript, build and `git diff --check` clean. Logs in `docs/verification/live-play-2026-09-06/`.

## Freedom Square Community College — September 6, 2026 (build 29)

Pieter asked to keep building until the game is complete. Education was the one adult surface (the Education tab's 24 courses and the four self-study certificates) with no presence in the city, and education is the salary engine's biggest lever, so this build gives it a building.

**The building.** A community college stands on the south lawn between the fountain and the east tree, facing north onto the square (`createCollegeFacade` in `components/town/townCollege.ts` turns the townhouse builder a quarter turn and narrows it to the slot; purple door, bell, name plate). It is the only south-edge slot whose door is in clear view from the north: the first placement, further east, put the big tree at (12, 8) between the camera and the door, and the camera saw only canopy. Because the building sits exactly where the camera normally hangs, arriving at its door eases the camera round to the north (`yawGoal` in the scene) so the frontage, not its back wall, fills the frame; walking away eases it home and a drag cancels the ease. Inside: whiteboard with the study plan, the registrar's desk with a globe, two rows of student desks with two seated students, a bookshelf, a certificates board and a "learning has a payback" poster. Same footprint and spots (registrar, exit) as the other interiors.

**The registrar (`services/townCollege.ts`).** Every course is priced the way an investor prices anything: cost, deposit (10% for courses over $20,000, the rest on a 6.5% student loan amortised over the course, exactly as the enrolment handler does it), the monthly raise once finished (only courses on the career path count, using the same relevance rule and 3× cap as `getEducationSalaryMultiplier`), and the payback in months including study time. Courses on the path are listed quickest payback first; the rest sit under "All courses" with an honest "costs the same, adds no raise" line and the careers they are made for. Each card knows why it cannot be started today (prerequisite, deposit short, another course running). Between jobs the projection uses the pay the job resumes at, so the payback still means something. The panel also shows the course in progress (months done, loan balance and payment already in the bills), the four self-study certificates with best scores, and the shelf. Enrolling hands the course to App's `handleEnrollEducation`, so money, loans, confirmations and the feed event are unchanged. Rosa now points to the college when the next title needs a qualification, or when a course on the path pays back within 30 months. First visit recorded in `townProgress.collegeVisitedMonth`. Bilingual.

**Verified in Chrome (5188).** College button walks from the fountain to the door with the camera swung to face the building (screenshot in the log); enter, registrar, panel; enrolling in the $3,000 Electrician Apprenticeship took cash from $5,820 to $2,820, marked the College button 📚, redrew the whiteboard, and knocked the reserve challenge off the notice board (a real consequence of spending the cushion). Plumbing License read "+$630 a month once finished · pays for itself in about 19 months" with "Finish your current course first."

Validation: 343 tests across 60 files (`test/TownCollege.test.tsx`: pricing, deposit/loan rules, statuses, plan order, registrar lines, certificates, placement, guide hops, visit marker, Rosa, panel), TypeScript, build and `git diff --check` clean. Log in `docs/verification/live-play-2026-09-06/build-29-college.md`.

## The family at home — September 6, 2026 (build 30)

Pieter's pick: "Build the family and children at home, keep going."

**Who is home.** Relationships, weddings and births still arrive as dashboard events; the flat now shows what they produced. A spouse figure stands by the kitchenette when married, a crib appears while a baby is at home, a toy box while children are small, and each child old enough to stand about gets a scaled figure (preschooler .5, school age .62, teenager .8; grown children have moved out). `householdFigures` in `services/townFamily.ts` decides, `home.setFamily` and the scene's actor list apply it, and the figures survive the character model loading late.

**The family block on the desk (HomePanel).** Status (single, in a relationship, engaged, married) and a headline that names the biggest thing: "2 children cost $1,800 a month. Emma turns 18 in 136 months." The spouse card shows income, share of household income, years married, and the resilience line: if your pay stopped tomorrow, this income alone covers N% of the bills. Each child card uses the same age bands and amounts as `calculateChildrenExpenses` (a test proves the totals agree): cost now, the next stage and when it starts, and the cost of raising them to 18 from here. The **college fund** is the one action: "Put aside $250 / $1,000" moves cash into the Community Bank savings account through the teller's transfer (`contributeCollegeFund`), notes it against the child in `townProgress.collegeFund`, and posts it to the mail. The card projects what the fund grows to by 18 at the savings yield and the level monthly saving that reaches the game's $60,000 dream-school bill, with the honest note that waiting makes the number climb. Refused for grown children, non-whole amounts, more than the cash on hand, or while an event waits. Children take $2,000 a year each off taxable income, as the tax code already does. Rosa points home when a child has no fund and the cushion allows it. Bilingual.

**Also fixed.** Six town formatters printed negative money as "$-1,471" (the bills' "Left over" line showed it); they now put the sign before the dollar like the rest of the city.

**Verified in Chrome (5188)** with a seeded save (Taylor in healthcare, Emma 6, Liam 10 months): spouse, child figure, crib and toy box in the flat; the family block read as above; Put aside $250 for Emma took cash from $2,820 to $2,570, the card read "$250 set aside → $416 by 18 at the savings rate. $337 a month from now reaches the $60,000 dream-school bill", and the mail carried "🎓 College fund: Emma". No console errors.

Validation: 348 tests across 61 files (`test/TownFamily.test.tsx`), TypeScript, build and `git diff --check` clean. Log in `docs/verification/live-play-2026-09-06/build-30-family.md`.

## Insurance at the bank — September 7, 2026 (build 31)

Pieter's pick: "Build the insurance at the bank, keep going." The game had no insurance mechanic: events mentioned it in option labels ("Use insurance ($3,000 deductible)", "They were uninsured"), but nothing was ever bought or paid. This build adds the mechanic and the desk.

**The mechanic (`services/townInsurance.ts`).** Three policies with the plain North American shape: a monthly premium that lands in the bills like any other expense (both cash-flow calculators carry `insurancePremiums`; the turn preview lists "Insurance"), a deductible per claim, a co-insurance share, and premiums that rise 15% per claim for 24 months (capped at 60%). Health cover pays 80% of a covered medical bill above a deductible the player picks ($500/$2,000/$5,000 at $380/$260/$170 a month). Home & car cover pays 90% of covered repairs, break-ins and accidents above $1,000, priced up by $45 per vehicle and $60 per rental property. Business cover (offered only to business owners) pays 70% of covered business shocks and of each month's repair bills above $500, priced on the value owned. Coverage is a named list of dashboard events per policy, shown at the desk. When a covered event's chosen option costs money, `applyScenarioOutcome` settles the claim on the spot: the option's own label decides whether the event already priced cover ("Use insurance…", "File insurance claim", "Their insurance covers it" are not paid twice; "No insurance…" and "uninsured" options are exactly the ones the policy pays on). `processTurn` pays the business repair share and tallies premiums paid. No `rand()` anywhere, so daily-challenge worlds stay in sync. State lives in `GameState.insurance` (policies, claims, premiumsPaid); the monthly report carries the premium and any repair claim.

**The desk (`InsurancePanel.tsx`, third tab at the teller).** Each policy shows its blurb, the worst covered bill in the game with and without cover ("🚑 Surprise! Your Organs Hate You! · $25,000. With cover you pay $5,400; without, $25,000"), the deductible ladder with live premiums, Take out / Cancel, the covered events, and a ledger that tells the truth: premiums now, premiums paid so far, claims paid to you, and "No claims yet. That is the normal state of an insured life." The lesson line: insurance is a bet you hope to lose; cover the bills you could not survive, self-insure the ones you could. A sign on the bank's side wall marks the desk. Rosa warns from month six when cash is below the biggest medical bill and there is no health cover. Bilingual.

**Verified in Chrome (5188).** Teller → Insurance tab → $2,000 deductible → Take out cover · $260/mo: the tab read "Insurance 1🛡️", the health card "$260/mo · since month 3", the ledger $260/mo, and at home the fridge's "Everything else" rose from $2,179 by exactly the premium with the policy event in the mail. Unit tests cover the claim maths against the real appendicitis event with and without cover ($25,000 → $18,400 paid), the label rule, the repair claim, the premium loading, the cash-flow line and the turn tally.

Validation: 353 tests across 62 files (`test/TownInsurance.test.tsx`), TypeScript, build and `git diff --check` clean. Log in `docs/verification/live-play-2026-09-06/build-31-insurance.md`.

## The quest log on the notice board — September 7, 2026 (build 32)

Pieter's pick: "Build the quest log on the notice board, keep going." The dashboard's goal system (up to three active quests, rewards to claim, a playstyle track, character questlines) lived only behind the Quick-actions menu; the square's board carried the month's three challenges and nothing else.

**On the board (`NoticeBoardPanel`).** Below the challenges, a Quest log block: the count done, the track tag (Investor / Entrepreneur / Debt Crusher) once the game has inferred one, rewards ready to claim with a Claim button that pays through App's existing claim handler (same reward, confetti and toast as the dashboard), the active quests with live progress bars, the exact progress in the quest's own unit (money, count, months), the reward, and the hint; "Up next" lists locked quests whose prerequisites are met; a link opens the full log. `services/townQuests.ts` reads the quest state and `getQuestProgress`, formats rewards in plain words ("+$200 · +2 financial IQ"), and never changes state. Quest titles are the app's translation keys, so the panel translates them with the same `t` the dashboard uses; the rest of the copy is bilingual through `tl`.

**On the paper.** The 3D board's sheet was a static drawing of three blank lines. It is now redrawn from the live state (`noticeSheet` → the scene's `setNotices`): the board title, a subtitle with the month and either "N rewards to claim" or "N of M quests done", then up to six lines with a tick for each challenge already done and a highlighted line for each reward waiting. Walk up to the board and it says what the panel says.

**Verified in Chrome (5188)** with the seeded save (two rewards waiting, three active, Entrepreneur track): the Board button opened the panel with "Quest log · 0/19 · Entrepreneur", First Investment and Side Hustle Kickoff marked "Reward ready", Build Your Reserve at $0 of $2,000 with its hint; Claim on First Investment took cash from $2,570 to $2,720 and the header to 1/19 with one reward left. No console errors.

Validation: 356 tests across 63 files (`test/TownQuests.test.tsx`: board state, sheet, claim from the panel), TypeScript, build and `git diff --check` clean. Log in `docs/verification/live-play-2026-09-06/build-32-quests.md`.

## Vehicles in the city — September 7, 2026 (build 33)

Pieter's pick: "Build the vehicles in the city, keep going." The last adult surface with no city stop. The game already carried a starter car, charged its upkeep and knocked 0.5% off its value each month, but nothing ever showed the car, its true cost, or let the player buy or sell one.

**The parking bay.** The player's car now stands at the kerb by the townhouse at 12 Square St (a clone of the traffic model's car in the listing's paint; the bay is a nav obstacle that leaves the front door clear). A Garage button walks there; the pill reads "Parking bay · Your car, its true cost & the lot →", or "Car-free. See the lot →".

**The panel (`GaragePanel`, `services/townGarage.ts`).** Each car shows upkeep, the value lost this month, the loan balance and the interest share of the payment if financed, the true monthly cost (upkeep + lost value + interest, not the payment), what it will be worth in five years, and what the dealer would pay today (10% under book) with the equity after the loan. "Sell to the dealer" pays the resale, clears the loan from the proceeds, and removes the car and its upkeep; a car whose loan is at least its resale cannot be sold ("Pay it down first"). The lot offers four deterministic cars (a $9,000 hatchback to a $32,000 electric compact), each with its five-year cost, for cash or financed at 10% down over 48 months at 7.9% with the total interest stated; two cars is the limit of the bay. Financing creates a real CAR_LOAN liability tied to the vehicle, so the payment lands in the bills and amortises with the turn. Net worth is unchanged by a cash purchase (cash becomes car). Rosa raises a car that is 40%+ of net worth or underwater on its loan, from month six. The lesson line: a car is the one big thing most people buy that loses money every month it exists. Bilingual.

**Verified in Chrome (5188).** The grey starter car parked by the townhouse; Garage walked to the bay with the pill; the panel read "Used Car: $140 a month all in. $100 upkeep + $40 lost value." with resale $7,128 and five-year value $5,863. Selling and financing exercised from the panel (receipt in the log). Spotted and fixed: with a negative net worth the share line printed "792000%"; it now caps at 100 and says the car is worth more than everything else owned put together.

Validation: 361 tests across 64 files (`test/TownGarage.test.tsx`: pricing, sell/underwater, cash and financed purchase with the loan in the bills and depreciation through a turn, bay placement, Rosa, panel), TypeScript, build and `git diff --check` clean. Log in `docs/verification/live-play-2026-09-06/build-33-vehicles.md`.

## Balance pass over a full 36-month demo run — September 7, 2026 (build 34)

Pieter's pick: "Do the balance pass over a full 36-month demo run, keep going." Method: a headless harness (`test/BalancePass.test.ts`) that plays the whole free tier for every character with a seeded random stream under scripted players, choosing the cheapest open option at every event as a careful player would. The exploratory version ran 8 characters × 6 seeds × 4 strategies (192 runs); the committed test keeps 48 of them as a regression envelope.

**The defect it found.** In 48 insured runs the health policy never paid a cent. Every medical event already offered a "Use insurance ($3,000 deductible)" option that any player could pick without holding a policy, so premiums bought nothing: uninsured coasters averaged $1,883 of shocks per run, insured savers $1,464, and the insured paid $9,360 for the difference. **Fix:** an event option that uses *your* insurance ("Use insurance…", "File insurance claim", "Let insurance deal with it") is now open only to a player who holds the matching policy (`optionLocked` in `services/townInsurance.ts`); the other driver's "Their insurance covers it" stays open to everyone, and the uninsured option is always available. The scenario modal shows the locked option greyed with "🔒 Needs Health cover from the Community Bank. Without it, the uninsured option is yours." (a teaching moment in itself: the insured price is visible), and App refuses a locked pick as the belt to the button's braces. `fender_bender_lawsuit` and `car_theft` joined the home & car cover list.

**After the gate.** Uninsured coasters' shocks rose to $4,685 per run and their bankruptcies from 8 to 11 of 48; insured savers stayed at 0 bankruptcies with $1,435 of shocks. With premiums then buying real protection, health cover was still priced at roughly a third of what it saved, so the ladder came down from $380/$260/$170 to **$240/$160/$110** a month and home & car cover from $110 to **$80** (plus $45 a vehicle, $60 a rental). Final numbers (6 seeds, means per run): coaster net worth $39,399, saver $44,779 with $5,760 of premiums paid and zero bankruptcies; a player who finances the $9,000 hatchback in month two ends with $27,147 of net worth against the coaster's $39,399 and two more bankruptcies in 48, a cost rather than a trap; the saver's certificate graduated in 7 of 9 enrolments and lifted mean salary from $5,080 to $5,519. A player who moves to Comfortable living on a $3,500 salary and finances a $32,000 car goes bankrupt in 39 of 48 runs, which is the lifestyle, not the car. Marcus Johnson ($2,000 salary, $5,000 debt) goes bankrupt in every run that does nothing; his questline is side hustles, so that is his design, noted here for the next balance pass.

**The regression test** asserts the envelope rather than the exact numbers: the saver never goes bankrupt, ends within 15% of the coaster's net worth and with fewer shocks; premiums stay within the price list; what cover saves is real but less than the premiums (insurance is mostly money gone, as the desk says); a financed cheap car costs at most three more bankruptcies in 48 and keeps at least 60% of the coaster's cash; at least one certificate graduates inside the demo and the saver's mean salary ends higher.

**Verified in Chrome (5188).** A seeded appendicitis event without health cover: "Use insurance ($3,000 deductible)" disabled with the lock note, "No insurance – pay full ($25,000)" open.

Validation: 365 tests across 65 files, TypeScript, build and `git diff --check` clean. Tables in `docs/verification/balance-2026-09-07.md`.

## Marcus Johnson can survive a do-nothing run — September 7, 2026 (build 35)

Pieter's pick after the balance pass: "Fix Marcus Johnson so he can survive a do-nothing run, keep going."

**Why he always sank.** Marcus starts as a Startup Founder on $2,000 a month with a $5,000 loan, and every character starts in the Modest flat at $2,500 a month. With the car and the loan payment he was $700 a month underwater from month one; $8,000 of cash lasts about eleven months, three missed payments follow, and bankruptcy landed between months 8 and 22 in all twelve seeds. The next rung ($5,000) needs 24 months of experience, so nothing in the ladder could rescue him inside the demo.

**The fix, in character.** Two changes that read as bootstrapping rather than charity: characters can now declare a `startingLifestyle`, and Marcus starts in the Frugal flat ($1,500 a month; the city's home shows the mattress on the floor) with the trait "Bootstrapper" and a backstory line about paying himself a founder's draw; and the Startup Founder rung's base pay rose from $2,000 to $2,400. Measured over twelve do-nothing seeds: baseline 12/12 bankrupt; Frugal alone 3/12; $2,400 alone 12/12 (later); Frugal plus $2,400 3/12 with mean final cash $25,348 and the three losses coming from heavy early shocks, which is the same exposure Maria and Sarah carry. The character card says "· starts frugal", the daily challenge and the balance harness apply the starting lifestyle too, and the balance envelope now asserts that Marcus survives at least one of its coaster runs.

**Also tightened.** The envelope's salary check compared two noisy means (promotions are random); it now asserts what the certificate guarantees: every graduate ends above the salary they started on.

Validation: 365 tests across 65 files, TypeScript, build and `git diff --check` clean.

## Dead components removed — September 7, 2026 (build 36)

Pieter's pick: "Remove the dead CharacterSelect component, keep going." `components/CharacterSelect.tsx` was imported by `App.tsx` but never rendered; the character cards are inline in App. Removing it prompted a scan for other source files with no importer outside tests. Six more were dead, all from the June UI overhaul and its aborted "new UI root": `components/NewUiRoot.tsx`, `components/FinancialFreedomBreakdown.tsx` (plus its snapshot test, which exercised nothing live), `components/ActionCard.tsx`, `components/v2/SidebarShell.tsx`, `components/v2/DashboardScreen.tsx`, `components/v2/DashboardScreenEnhanced.tsx`. Their only remaining mentions were in the untracked graphify output. `components/INTEGRATION_GUIDE.md` (the overhaul's wiring notes) carries a historical banner now.

Validation: 363 tests across 64 files (the removed snapshot test held two), TypeScript, build and `git diff --check` clean; the production bundle is unchanged in behaviour.

## Spanish read of the city copy — September 7, 2026 (build 37)

Pieter's pick: "Do the native-speaker read of the Spanish copy, keep going." This is a careful editorial read rather than a native speaker's ear; Pieter should still hand the city to a Latin American Spanish speaker for an afternoon. Method: every `tl(en, es)` pair in the city (1,474 pairs across 55 files: the town panels, scene labels and town services) was extracted to one file and read in full, with a heuristic pass first (untranslated strings, Spain-only vocabulary, missing ¿¡, unbalanced brackets, usted slips). Register is a consistent tú throughout; terms are consistent (renta, enganche, cochera, auto, ingresos extra, surtido, cajero, corredor, tablón); accents and inverted marks are right.

**Fixed (21 strings).** Gendered lines made neutral: the four "Bienvenido a…" greetings are now "Te damos la bienvenida a…" and "Welcome inside" is "Adelante."; "Fuiste dueño de una parte del mercado" → "Tuviste una parte del mercado…"; "Estás listo para {title}" → "Ya puedes pasar a {title}"; "¿Despedido?" → "¿Te despidieron?"; "Sé dueño de una parte de todo el mercado" → "Ten una parte de todo el mercado"; the family status labels read "Prometidos"/"Casados" (a couple) instead of "Comprometido"/"Casado". Spain-only terms replaced with Latin American ones: "TAE" → "tasa anual", "parqué" → "sala de operaciones" (three places). Phrasing: "Múdate por $3,000" (that is moving house) → "Instálate por $3,000" for the café lease; "Ficha tu entrada" → "Marca tu entrada"; the Exchange's "$50 arriba/abajo" → "de ganancia/de pérdida"; the kids' goal jar's "una promesa contigo" → "una promesa que te haces".

**Left as is, deliberately.** Badge names "Emprendedor del barrio" and "Inversor paciente" keep the generic masculine that Spanish uses for titles; "Hola, vecino." likewise. Quest titles and the dashboard come from `i18n/translations/es.json` (the June translation) and were outside this read.

Validation: 363 tests across 64 files, TypeScript, build and `git diff --check` clean.

## The dashboard's Spanish, rewritten — September 7, 2026 (build 38)

Pieter's pick: "Read the dashboard's es.json translation too, keep going." The read turned into a rewrite. The June file had three problems the city's copy never had: it was typed without accents or ñ throughout ("Espanol", "Ultimo", "credito", "tamano"); 323 of its 620 strings were still English, and all of them are live in the UI (the event library `data/events.json` reads its titles and choices through these keys, the eight character questlines' quest titles, the Sales Accelerator certification and its fifteen-question quiz); and its questions lacked the opening ¿. It also carried anglicisms the city avoids ("side hustles", "cash flow", "picks", "slot", "onboarding").

**What was done.** `i18n/translations/es.json` was regenerated key for key from the English structure (620 keys, every `{placeholder}` checked to match, no key added or dropped) with new Spanish for every string: accents and ñ throughout, ¿…? on every question, tú register, the city's vocabulary (ingresos extra, flujo de efectivo, cartera, contactos, espacio de guardado), track names that read as routes ("Ruta de inversión", "Ruta sin deudas"), the thirty translated events with their choices and outcomes, the character questlines, and the full sales certification including the quiz's prompts, options, explanations and feedback. Five strings are identical to the English by design (formats such as "{current} / {target}", the title "💰 TYCOON 💰", "Normal").

Same caveat as the city: this is a careful editorial translation, not a native speaker's; the quiz in particular deserves a human read because its wrong answers are meant to sound tempting.

Validation: 363 tests across 64 files, TypeScript, build and `git diff --check` clean; the quest log on the notice board renders the translated titles.

## Where the sessions stopped (September 6, 2026, morning)

Overnight (23:00 to about 01:00 PDT) nine builds shipped: café reputation, the Exchange and investor journey, the property office, the day-night cycle, the notice board, the home and Rosa, seasons, café incidents and the year-in-review city section. The morning session (about 06:00 to 07:30 PDT) added eight more, each verified in Chrome, receipted above and pushed to `origin/main`: the townhouse around the apartment door and the camera-canopy fix; adaptive graphics quality; petite women with A-line skirts; residents that make room; Freedom Day; the city accessibility pass; Main Street Offices (pay stub, promotion outlook, job security); the neighbourhood tour with download progress and the city open after winning; and Rosa's promotion nudge.

Later that morning the soak test, the return-to-city fix and Spanish for the city followed (builds 18–19), which closes the roadmap's September list. What remains needs Pieter in person: playing the live site by hand and listing what feels off, the physical-phone test (touch, frame rate under the adaptive quality governor, thermals, audio on a real speaker), and a native-speaker read of the Spanish city copy.
