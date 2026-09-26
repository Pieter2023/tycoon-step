# Build 54: events staged at their place in 3D (2026-09-25, branch `town-lighting-pass`)

The next item in HANDOVER §3 after Phase 1 slice 5. Slice 3 (build 47) opened an event's card over the city with a "📍" place line. Now the city also shows where it happens.

## What it does

While a life event waits (its card open over the city, or set aside with "Explore now"), the city stages it where it happens (`components/town/townEventStage.ts`):
- **A marker.** An amber "!" badge floats and bobs over the place, drawn on top and at a constant size on screen (about a tenth of the view's height). An amber ring pulses on the pavement in front.
- **A letter on the doorstep.** Tax and legal mail: a cream envelope with a red seal on the step of 12 Square St.
- **Hazard lights.** Car trouble blinks the parked car's head and tail lamps amber, half a second on and half a second off. Each lamp gets its own glow back afterwards (a tail light that glowed at night keeps it).
- **The places** come from slice 3's `eventPlace` (by the event's category):
  - the garage bay;
  - home;
  - the doorstep;
  - the office;
  - the Exchange;
  - Main Street;
  - the bank;
  - the square (over the fountain);
  - Rosa's bench.
- **Clearing.** The stage clears when the event is answered.
- **Reduced motion.** No bob and no pulse; the hazards stay steadily lit.
- **Wiring:**
  - `TownModal` calls `controller.stageEvent(place | null)` whenever `pendingScenario` changes or the scene finishes loading;
  - the scene re-attaches the hazards if the parked car is rebuilt;
  - dev handle: `__town.stageEvent(place)`.

## Checks

- **`test/TownEventStage.test.tsx` (5):**
  - every place any event category maps to has a spot, with its ring on walkable pavement;
  - the letter appears for tax and clears when answered;
  - the hazards blink and restore each lamp's own glow;
  - reduced motion holds still;
  - `TownModal` stages a car breakdown at the garage and clears it once answered.
- **Totals:** 468 tests / 84 files and the production build pass.
- **Renders** (`event-stage.jpg`, `localhost:5191`, the production fixture save, summer noon; `__town.advance` with the capture receiver):
  - top row: the letter on the doorstep, then the parked car's lamps off and on;
  - bottom row: the Exchange badge from the standard square camera, the office badge, and Rosa's bench.
  - The first try showed the badge too small across the square (7% of the height), so it went to a constant tenth of the view.
