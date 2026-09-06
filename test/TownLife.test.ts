import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import * as THREE from 'three';
import { characterSex, residentStyle, styleCharacter, seatActor } from '../components/town/townResidents';
import { vehicleSpeed, TRAFFIC_LANES, PLAYER_LANE_BAND } from '../components/town/townTraffic';
import { shouldFlee, landingSpot, FLEE_DISTANCE } from '../components/town/townLife';
import { CHARACTERS } from '../constants';

const readGlb = (path: string) => { const b = readFileSync(path); return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()); };

describe('residents read as different people', () => {
  it('maps every story character to a presentation and falls back to the pictured emoji', () => {
    const sexes = CHARACTERS.map(c => characterSex(c));
    expect(sexes.filter(s => s === 'f').length).toBeGreaterThanOrEqual(3);
    expect(sexes.filter(s => s === 'm').length).toBeGreaterThanOrEqual(3);
    expect(characterSex({ id: 'custom', name: 'Pat', avatarEmoji: '👩‍🎤' })).toBe('f');
    expect(characterSex({ id: 'custom', name: 'Pat', avatarEmoji: '👨‍🚀' })).toBe('m');
    expect(characterSex({ id: 'custom', name: 'Sam', avatarEmoji: '🎨' })).toBe(characterSex({ id: 'custom', name: 'Sam', avatarEmoji: '🎨' }));
    expect(characterSex(null)).toBe('m');
  });
  it('alternates sexes and varies hair, beards and caps deterministically', () => {
    const styles = Array.from({ length: 12 }, (_, i) => residentStyle(i));
    expect(styles.map(s => s.sex)).toEqual(['m', 'f', 'm', 'f', 'm', 'f', 'm', 'f', 'm', 'f', 'm', 'f']);
    expect(new Set(styles.filter(s => s.sex === 'f').map(s => s.hair)).size).toBe(2);
    expect(styles.some(s => s.beard)).toBe(true); expect(styles.some(s => s.cap)).toBe(true);
    expect(styles.filter(s => s.sex === 'f').every(s => !s.beard && !s.cap)).toBe(true);
    expect(residentStyle(3)).toEqual(residentStyle(3));
    expect(new Set(styles.map(s => s.colors?.shirt)).size).toBeGreaterThan(4);
  });
  it('shows female parts only on women, beards and caps only on men, and keeps the source model untouched', () => {
    const build = () => {
      const root = new THREE.Group(); const shirt = new THREE.MeshStandardMaterial({ color: '#ffffff', name: 'shirt' });
      const figure = new THREE.Group(); figure.name = 'Character'; root.add(figure); const hips = new THREE.Group(); hips.name = 'Hips'; figure.add(hips);
      for (const name of ['Fem_Skirt', 'Fem_HairLong', 'Fem_HairSide.001', 'Fem_Ponytail', 'Fem_Lips', 'Masc_Beard', 'Masc_Cap', 'Masc_CapBrim', 'Smile', 'Jacket']) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(), shirt); mesh.name = name; root.add(mesh); }
      const trousers = new THREE.MeshStandardMaterial({ color: '#354955', name: 'trousers' }); const leg = new THREE.Mesh(new THREE.BoxGeometry(), trousers); leg.name = 'Lower leg'; hips.add(leg);
      return { root, shirt, trousers, figure, hips, leg };
    };
    const woman = build(); styleCharacter(woman.root, { sex: 'f', hair: 'tail', colors: { shirt: '#ff0000' } });
    const visible = (root: THREE.Object3D, name: string) => root.getObjectByName(name)!.visible;
    expect(visible(woman.root, 'Fem_Skirt')).toBe(true); expect(visible(woman.root, 'Fem_Ponytail')).toBe(true); expect(visible(woman.root, 'Fem_HairLong')).toBe(false);
    expect(visible(woman.root, 'Masc_Beard')).toBe(false); expect(visible(woman.root, 'Masc_Cap')).toBe(false); expect(visible(woman.root, 'Smile')).toBe(false);
    expect(woman.shirt.color.getHexString()).toBe('ffffff'); // cloned, not mutated
    expect((woman.root.getObjectByName('Jacket') as THREE.Mesh).scale.x).toBeLessThan(1);
    expect(woman.figure.scale.y).toBeLessThan(1); expect(woman.hips.scale.x).toBeLessThan(1); expect(woman.leg.scale.x).toBeLessThan(1); // petite build
    expect((woman.leg.material as THREE.MeshStandardMaterial).color.getHexString()).not.toBe('354955'); expect(woman.trousers.color.getHexString()).toBe('354955'); // bare legs under the skirt, source untouched
    const man = build(); styleCharacter(man.root, { sex: 'm', hair: 'short', beard: true, cap: true });
    expect(visible(man.root, 'Fem_Skirt')).toBe(false); expect(visible(man.root, 'Fem_Lips')).toBe(false); expect(visible(man.root, 'Masc_Beard')).toBe(true); expect(visible(man.root, 'Masc_CapBrim')).toBe(true);
    expect((man.root.getObjectByName('Jacket') as THREE.Mesh).scale.x).toBeGreaterThan(1);
    expect(man.figure.scale.y).toBe(1); expect(man.hips.scale.x).toBe(1); expect((man.leg.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('354955');
  });
  it('seats a character with feet levelled by the ankle joint', () => {
    const root = new THREE.Group();
    for (const side of ['-1', '1']) for (const joint of ['Thigh', 'Knee', 'Ankle']) { const o = new THREE.Object3D(); o.name = joint + side; root.add(o); }
    seatActor(root);
    const thigh = root.getObjectByName('Thigh1')!.rotation.x, knee = root.getObjectByName('Knee1')!.rotation.x, ankle = root.getObjectByName('Ankle1')!.rotation.x;
    expect(thigh).toBeLessThan(0); expect(knee).toBeGreaterThan(0); expect(thigh + knee + ankle).toBeCloseTo(0);
  });
});

describe('street traffic', () => {
  it('drives opposite directions in the two lanes on the road, not on the pavements', () => {
    expect(TRAFFIC_LANES.map(l => l.dir)).toEqual([1, -1]);
    for (const lane of TRAFFIC_LANES) { expect(lane.z).toBeGreaterThan(.75); expect(lane.z).toBeLessThan(5.5); }
    // Every point on the carriageway is covered by at least one lane's braking band; the pavements are not.
    for (let z = .8; z <= 5.2; z += .1) expect(TRAFFIC_LANES.some(l => Math.abs(z - l.z) < PLAYER_LANE_BAND)).toBe(true);
    expect(TRAFFIC_LANES.some(l => Math.abs(-.2 - l.z) < PLAYER_LANE_BAND)).toBe(false);
    expect(TRAFFIC_LANES.some(l => Math.abs(6.35 - l.z) < PLAYER_LANE_BAND)).toBe(false);
  });
  it('rolls to a stop short of the player and pulls away once the road is clear', () => {
    let speed = 6;
    for (let i = 0; i < 120; i++) speed = vehicleSpeed(speed, 6, 1.5, 1 / 60);
    expect(speed).toBeLessThan(.15);
    for (let i = 0; i < 20; i++) speed = vehicleSpeed(speed, 6, 4.5, 1 / 60);
    expect(speed).toBeGreaterThan(.5); expect(speed).toBeLessThan(6);
    for (let i = 0; i < 300; i++) speed = vehicleSpeed(speed, 6, null, 1 / 60);
    expect(speed).toBeCloseTo(6, 1);
    expect(vehicleSpeed(6, 6, 2, .1)).toBeLessThan(vehicleSpeed(6, 6, 5, .1));
  });
});

describe('pigeons and bunting', () => {
  it('scatters only when the player walks up and lands away from them inside the square', () => {
    const pigeon = { position: new THREE.Vector3(1, .22, 10), flying: false };
    expect(shouldFlee(pigeon, { x: 1.5, z: 10.5 })).toBe(true);
    expect(shouldFlee(pigeon, { x: 1 + FLEE_DISTANCE + .5, z: 10 })).toBe(false);
    expect(shouldFlee({ ...pigeon, flying: true }, { x: 1, z: 10 })).toBe(false);
    for (let i = 0; i < 40; i++) {
      const spot = landingSpot(pigeon, { x: 0, z: 8 }, Math.random);
      expect(Math.hypot(spot.x - 0, spot.z - 8)).toBeGreaterThan(Math.hypot(pigeon.position.x, pigeon.position.z - 8) - .01);
      expect(spot.z).toBeGreaterThanOrEqual(8.6); expect(spot.z).toBeLessThanOrEqual(13.6); expect(Math.abs(spot.x)).toBeLessThanOrEqual(9);
    }
  });
});

describe('exported extras', () => {
  it('ships sex-specific parts on the one animated character and compact Draco vehicles', () => {
    const character = readGlb('public/models/town/town-character.glb');
    const names = character.nodes.map((n: { name: string }) => n.name);
    for (const part of ['Fem_Skirt', 'Fem_HairLong', 'Fem_Ponytail', 'Fem_Lips', 'Fem_Bust', 'Masc_Beard', 'Masc_Cap']) expect(names.some((n: string) => n.startsWith(part))).toBe(true);
    expect(character.animations.map((a: { name: string }) => a.name).sort()).toEqual(['Celebrate', 'Idle', 'Run', 'Serve', 'Walk', 'Wave']);
    expect(statSync('public/models/town/town-character.glb').size).toBeLessThan(450_000);
    const vehicles = readGlb('public/models/town/town-vehicles.glb');
    const vehicleNames = vehicles.nodes.map((n: { name: string }) => n.name);
    expect(vehicleNames).toContain('Car'); expect(vehicleNames).toContain('Van');
    expect(vehicleNames.filter((n: string) => n.startsWith('Wheel')).length).toBe(8);
    expect(vehicleNames).toContain('Bike'); expect(vehicleNames).toContain('Dog');
    expect(vehicleNames.filter((n: string) => n.startsWith('BikeWheel')).length).toBe(2);
    expect(vehicleNames.filter((n: string) => n.startsWith('DogLeg')).length).toBe(4); expect(vehicleNames).toContain('DogTail');
    expect(vehicles.materials.map((m: { name: string }) => m.name)).toEqual(expect.arrayContaining(['carPaint', 'lamp', 'tyre']));
    expect(vehicles.extensionsUsed).toContain('KHR_draco_mesh_compression');
    expect(statSync('public/models/town/town-vehicles.glb').size).toBeLessThan(200_000);
  });
});
