# QA Checklist

## Latest checkpoint and test safety

September 5 pacing-pass result: **243 tests / 39 files passed**, production build passed, final local browser consoles clear. [Evidence logs](verification/pacing-2026-09-05/tests.log), [playtest receipt](completed-improvements.md), [handover](../HANDOVER.md). This documentation update did not rerun gameplay tests or publish a build.

Use origin `http://127.0.0.1:5188` for QA; keep the user's `5187` save untouched. Build before opening a fresh production-preview page. Close the QA tab/server and reset temporary viewport overrides afterward.

## City and café regression checklist

- Guide button: from the square, one tap on "Go to the teller" should walk, enter the bank, reach the teller and open the panel with "Confirm my cash reserve" first; the button then confirms the reserve. Tapping the ground, the joystick or any nav button mid-walk must cancel the chain and clear the "Next stop" caption.
- Guide button: after buying the cart and after paying the permit, the side panel must show the new step at the top (receipt + permit, then the shift panel), never the $350 upgrade in the old button's place. Long routes jog; the cart's customer visit should finish in about five seconds.
- Guide button after the badge: one tap enters the café and opens the practice panel; inside an unowned café it starts a practice shift; with a café it opens management; during service it resumes.
- Street life: a cyclist rides east along the kerb lane pedalling with the wheels; a resident walks a dog on a leash along the shop pavement. Twelve residents alternate men and women (long hair/ponytail, skirts, earrings; beards, caps), two rest on the promenade benches facing the fountain with feet on the pavement, three café regulars stand at the shopfront when the café is open. Cars and vans run both ways on Main Street, brake to a stop short of the player in the road and queue behind each other; headlamps light in rain. Pigeons peck by the fountain and scatter when approached, landing inside the square. Bunting waves between the lamp posts.
- Sound on: breeze/hum outdoors that muffles inside, birdsong only on dry days, fountain audible only nearby, a panned whoosh when a car passes, shoe steps that change indoors, espresso hiss while a drink brews, chimes on order/serve/walk-out/sale/badge. Sound stays off by default and must not error when toggled.
- Enter the city before onboarding completes; pending events remain unresolved and block spending while allowing exploration/practice.
- Walk around street obstacles; test camera-relative keys, tap-to-walk, joystick release, camera presets and portfolio return location.
- Enter/leave the bank; deposit and withdraw the same amount with net worth unchanged; inspect loan comparison routing. The teller greets with rotating speech bubbles.
- Exchange: after the opening badge the guide reads "Go to the Exchange" and one tap walks in and opens the broker panel; the visit advances the investor journey. Ticker rows show prices, 12-month change and units held; the index chart grows one point per month. Buy 1/5/10 deducts exactly the shown total and merges into one holding; Sell all removes it and schedules a hindsight note. The contributions calculator changes with the amount and years. Holding an index fund three months then finishing awards the Patient investor badge with no cash.
- Home: the Home button walks to 12 Square St; entering shows a flat furnished for the current lifestyle; the desk panel lists bills, mail and a lifestyle chooser that opens the confirm dialog and re-furnishes the flat. Rosa: the Rosa button walks to the west bench; her bubble shows her top line; the panel's "Show me" walks to the right place. The dashboard city card shows the guided step and Rosa's line.
- Seasons: months 12–2 show white ground and snowfall, 9–11 orange trees and falling leaves; the caption names the season; indoors and reduced motion show no particles.
- Day-night: within a few minutes of opening the city the light warms, then lamps, windows and headlights come on and the caption reads EVENING then NIGHT; interiors stay lit; rain stays grey daylight. Reduced motion holds a fixed morning.
- Notice board: "Board n/3" opens three challenges with progress from the moment the month's snapshot was taken; advancing the month logs the verdict and starts a new snapshot; badges never add cash.
- Property office: enter from the Property door, walk to the agent; the panel lists rent after upkeep and vacancy, rent minus payment for the best eligible mortgage, and a rent-or-buy verdict; "Preview a mortgage" opens the mortgage modal and is disabled when the down payment would empty the reserve.
- Café incidents: over several trading months a basic machine breaks down (repair + fewer cups), inspections fine a low-reputation shop and praise a strong one, a helper quits a struggling café; each appears as an event and on the receipt, never in the forecast.
- Café reputation: the café panel shows a 0–100 score; a three-star owner shift raises it 12 and the next month's demand forecast; a month without a shift drifts it toward 50.
- Complete cart purchase/permit/owner-shift/month-review journey; verify charges, income gating, receipt persistence and a badge without a money reward.
- Lease the café, upgrade seats/machine and verify one-time charges plus deposit/salvage in portfolio/net worth. Review price/stock/staff plans, busy/rainy profit/loss and closed-shop fixed costs.
- Run practice without owning a café; take, brew, collect from the machine, carry and serve all guests (four on busy days, three in rain, one fewer at premium prices). Take the next order while a drink brews. Quick service earns a tip shown on the guest label and HUD; stars update live and appear on the receipt. With a helper hired the counter orders are taken for you. Cash must remain unchanged in practice.
- Run an owner shift: opening costs deducted once, each served drink credited once, unused stock not refunded, repeat start disabled until another month.
- Pause, close and reload mid-shift. Resume with the same sales/cash/progress. Walking outside must stay available while café service is paused.
- Let guests run out of patience; verify departures, wasted stock and loss explanation. Finish early and advance the month during unfinished service; no duplicate cash or refund.
- Verify renderer-unavailable handling: financial management remains usable, but paid/practice service cannot start without the 3D view.
- Check desktop 1280×720 and portrait 390×844, readable receipts, accessible action buttons, camera framing, console errors and reduced-motion behaviour.

## Still unverified on real devices / production

- Physical phone frame rate, heat, multi-touch feel, orientation and app suspension.
- Full assistive-technology/contrast/localization audit of the new town controls.
- Public deployment, login, cloud save restore and real payment/access-validation flows for this build. Do not treat the static local preview as proof of these.

Use this list to verify critical flows after UI refactors or logic changes.

## Core Progression
- Start a new game with a character and confirm starting cash, stats, and month/year.
- Click "Next Month" and verify month advances, cashflow updates, and an event appears.
- Toggle Autoplay on/off and confirm it advances months only when no blocking modals are open.

## Monthly Actions
- Take a monthly action (Overtime or Training) and confirm cash/stats change.
- Open "View All Actions" and execute one action from the drawer.
- Confirm actions remaining decreases and re-renders correctly.

## Goals & Quests
- Claim a ready reward from Play/Goals and confirm cash/stats change immediately.
- Open the full Goals list and verify all quests are accessible.

## Money
- Buy an asset in Invest and confirm cash decreases and net worth updates.
- Sell an asset and confirm cash increases and holdings decrease.
- Open Portfolio/Bank sub-tabs and verify content renders without errors.

## Career
- Trigger a career action (apply/upgrade if available) and confirm salary or level changes.
- Verify Skills/EQ/Negotiation values render correctly.

## Learn
- Start or continue a course and verify progress is saved.
- Complete a quiz and confirm results/rewards apply.

## Life
- Change Lifestyle and verify monthly expenses/cashflow update.
- Start/upgrade a side hustle and confirm income/stats update.

## Save/Load
- Save the game to a slot and reload it; verify cash, month, assets, and quests are preserved.

## Main shell
- Confirm all five top-level pages render (Play, Money, Career, Learn, Life). The v2 shell is always enabled; the old toggle was retired.
