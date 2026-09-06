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
