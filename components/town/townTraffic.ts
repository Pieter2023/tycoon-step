import * as THREE from 'three';
import type { TownPoint } from './townWorld';

// Main Street runs along X between the shop pavement and the promenade. Right-hand
// traffic: the lane nearer the shops heads west, the lane nearer the square heads east.
export const TRAFFIC_LANES = [{ z: 1.95, dir: 1 as const }, { z: 4.15, dir: -1 as const }];
export const ROAD_LIMIT = 40;
const STOP_GAP = 2.6, BRAKE_RANGE = 6.5;
// Anyone standing anywhere on the carriageway is treated as in the way of both lanes.
export const PLAYER_LANE_BAND = 1.7;

// Speed for the next frame given the nearest obstacle ahead in the lane (metres from the
// vehicle nose, or null). Vehicles roll to a stop a car-length short of the obstacle and
// pull away again smoothly once it clears; the player can always step off the road.
export function vehicleSpeed(current: number, cruise: number, obstacleAhead: number | null, dt: number) {
  const target = obstacleAhead === null ? cruise : obstacleAhead <= STOP_GAP ? 0 : cruise * Math.min(1, (obstacleAhead - STOP_GAP) / (BRAKE_RANGE - STOP_GAP));
  const rate = target < current ? 9 : 2.6;
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}

export type Vehicle = { root: THREE.Object3D; wheels: THREE.Object3D[]; lamps: THREE.MeshStandardMaterial[]; lane: number; dir: 1 | -1; x: number; speed: number; cruise: number; length: number; passed: boolean };
const PAINT = ['#c4483d', '#3f6fa8', '#e0c35a', '#5d8a6a', '#f2eee4', '#7c5aa0'];

export function createTownTraffic(vehicles: THREE.Object3D, reducedMotion: boolean) {
  const root = new THREE.Group();
  const prototypes = { Car: vehicles.getObjectByName('Car'), Van: vehicles.getObjectByName('Van') };
  const fleet: Vehicle[] = [];
  const plan: { kind: 'Car' | 'Van'; lane: number; x: number; cruise: number }[] = [
    { kind: 'Car', lane: 0, x: -30, cruise: 6.2 }, { kind: 'Van', lane: 0, x: 2, cruise: 5.4 }, { kind: 'Car', lane: 0, x: 22, cruise: 6.6 },
    { kind: 'Car', lane: 1, x: 28, cruise: 6.0 }, { kind: 'Car', lane: 1, x: -8, cruise: 6.4 }, { kind: 'Van', lane: 1, x: -26, cruise: 5.2 },
  ];
  for (const [index, entry] of plan.entries()) {
    const source = prototypes[entry.kind]; if (!source) continue;
    const clone = source.clone(true); const wheels: THREE.Object3D[] = []; const lamps: THREE.MeshStandardMaterial[] = [];
    clone.traverse(object => {
      if (object.name.startsWith('Wheel') || object.name.startsWith('Hub')) wheels.push(object);
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
      object.castShadow = true; object.receiveShadow = true;
      const material = (object.material as THREE.MeshStandardMaterial).clone(); object.material = material;
      if (material.name === 'carPaint') material.color.set(PAINT[index % PAINT.length]);
      if (material.name === 'lamp') { material.emissive.set('#fff1c2'); material.emissiveIntensity = 0; lamps.push(material); }
    });
    const lane = TRAFFIC_LANES[entry.lane];
    clone.position.set(entry.x, .22, lane.z); clone.rotation.y = lane.dir === 1 ? 0 : Math.PI;
    root.add(clone);
    fleet.push({ root: clone, wheels, lamps, lane: entry.lane, dir: lane.dir, x: entry.x, speed: reducedMotion ? 0 : entry.cruise, cruise: entry.cruise, length: entry.kind === 'Van' ? 4.8 : 4.2, passed: false });
  }
  // Returns the vehicles that crossed the player's x this frame, for a passing whoosh.
  function update(dt: number, player: TownPoint, rainy: boolean, visible: boolean): { pan: number; closeness: number }[] {
    const passes: { pan: number; closeness: number }[] = [];
    root.visible = visible;
    if (!visible || reducedMotion) return passes;
    for (const vehicle of fleet) {
      const lane = TRAFFIC_LANES[vehicle.lane];
      let obstacle: number | null = null;
      const consider = (x: number, halfLength: number) => { const ahead = (x - vehicle.x) * vehicle.dir - vehicle.length / 2 - halfLength; if (ahead > -.5 && (obstacle === null || ahead < obstacle)) obstacle = Math.max(0, ahead); };
      if (Math.abs(player.z - lane.z) < PLAYER_LANE_BAND) consider(player.x, .35);
      for (const other of fleet) if (other !== vehicle && other.lane === vehicle.lane) consider(other.x, other.length / 2);
      vehicle.speed = vehicleSpeed(vehicle.speed, vehicle.cruise, obstacle, dt);
      const before = vehicle.x; vehicle.x += vehicle.speed * vehicle.dir * dt;
      if (vehicle.x * vehicle.dir > ROAD_LIMIT) { vehicle.x = -ROAD_LIMIT * vehicle.dir; vehicle.passed = false; }
      const crossed = (before - player.x) * vehicle.dir < 0 && (vehicle.x - player.x) * vehicle.dir >= 0;
      if (crossed && !vehicle.passed && vehicle.speed > 1) { vehicle.passed = true; passes.push({ pan: -vehicle.dir, closeness: Math.max(0, 1 - Math.abs(player.z - lane.z) / 9) }); }
      if (Math.abs(vehicle.x - player.x) > 3) vehicle.passed = false;
      vehicle.root.position.x = vehicle.x;
      vehicle.root.position.y = .22 + (vehicle.speed > .5 ? Math.sin(vehicle.x * 3.1) * .006 : 0);
      for (const wheel of vehicle.wheels) wheel.rotation.z -= vehicle.speed * dt / .34;
      for (const lamp of vehicle.lamps) lamp.emissiveIntensity = rainy ? .9 : 0;
    }
    return passes;
  }
  return { root, fleet, update };
}
