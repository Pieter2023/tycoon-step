import { describe, it, expect } from 'vitest';
import { stepPastVehicles, pavementEscape, TRAFFIC_LANES, PLAYER_LANE_BAND, VEHICLE_MARGIN } from '../components/town/townTraffic';

// The traffic deadlock (assessment §2): a car stopped for the player in its lane, the player was blocked by
// the car's footprint, the re-route found nothing, and both waited for each other for 30+ seconds.
const car = { x: 0, z: TRAFFIC_LANES[1].z, halfLength: 2.1, halfWidth: 1 };

describe('the player stepping past vehicles', () => {
  it('cannot walk into a car and slides along it instead', () => {
    const from = { x: -3, z: car.z + .2 }, into = { x: -2.2, z: car.z + .3 };
    const next = stepPastVehicles(from, into, [car]);
    expect(Math.abs(next.x - car.x) >= car.halfLength + VEHICLE_MARGIN || Math.abs(next.z - car.z) >= car.halfWidth + VEHICLE_MARGIN).toBe(true);
  });
  it('can always step away from a car that braked close, which ends the standoff', () => {
    const boxedIn = { x: -2.3, z: car.z + .5 };                    // inside the margin, beside the bumper
    const away = { x: -2.3, z: car.z + .6 };                       // stepping toward the pavement
    expect(stepPastVehicles(boxedIn, away, [car])).toEqual(away);
    const deeper = { x: -2.2, z: car.z + .45 };                    // but not further into the car
    expect(stepPastVehicles(boxedIn, deeper, [car])).not.toEqual(deeper);
  });
  it('leaves free movement alone', () => {
    const from = { x: 8, z: -.2 }, to = { x: 8.1, z: -.2 };
    expect(stepPastVehicles(from, to, [car])).toEqual(to);
  });
});

describe('stepping off the carriageway', () => {
  it('heads for the nearer pavement at the same x, clear of both lanes', () => {
    const north = pavementEscape({ x: 3, z: TRAFFIC_LANES[0].z })!, south = pavementEscape({ x: 3, z: TRAFFIC_LANES[1].z })!;
    expect(north.x).toBe(3); expect(south.x).toBe(3);
    expect(north.z).toBeLessThan(TRAFFIC_LANES[0].z - PLAYER_LANE_BAND);
    expect(south.z).toBeGreaterThan(TRAFFIC_LANES[1].z + PLAYER_LANE_BAND);
  });
  it('does nothing for a player already on the pavement', () => {
    expect(pavementEscape({ x: 0, z: -.5 })).toBeNull();
    expect(pavementEscape({ x: 0, z: 7 })).toBeNull();
  });
});
