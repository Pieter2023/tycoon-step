# Build 45: traffic deadlock fixed (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

**Bug (assessment §2).** A guided walk to the Exchange froze the player and all six cars for 30+ seconds; a manual tap freed it. This is how it happened:
1. A car stopped for a player in its lane.
2. The player was blocked by that stopped car's footprint plus a 0.35 m margin, and was already inside that margin.
3. With the player already inside the margin, every step counted as "into the car".
4. The re-route (`findTownPath` with the cars as obstacles) returned nothing, because the start sat inside an obstacle.
5. Each side waited for the other.

**Fix** (`components/town/townTraffic.ts`, used by `createTownScene.ts`):
- **`stepPastVehicles(from, next, vehicles)`.** Vehicles stay solid: a step into one slides along it or stops. A player already inside a car's margin may always step away from it.
- **`pavementEscape(p)`.** When the re-route finds nothing, the player first steps to the nearer pavement at the same x, clear of both lanes, then routes on to the goal.

**Tests.** `test/TownTraffic.test.ts`: walking into a car, stepping away from a close car (and not deeper into it), free movement, and escape points on both sides.

**Browser (localhost:5189, dev handle `__town.advance`).** Locked time = the player not moving while a car within 7 m of them in their lane is stopped.

| Scenario | Result |
|---|---|
| Walking along the westbound lane into oncoming cars, x −10 → 14 | Arrived in 9.0 s; longest pause 0.7 s |
| Walking along the eastbound lane into oncoming cars, x 12 → −14 | Arrived in 9.7 s; longest pause 0.7 s |
| 15 random crossings between the square (z 8–10) and the shopfronts (z −1.1) | Longest locked time 0.7 s; none over 1 s |

Two earlier "did not arrive" trials were goals on unwalkable spots (planters). The player crossed fine and stopped at the nearest reachable point while the traffic kept moving. They were not deadlocks.
