import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Lifestyle } from '../../types';
import type { TownPoint } from './townWorld';

// The player's place, furnished by lifestyle tier: from a mattress and a crate to a penthouse
// with a piano. Same footprint and exit as the other interiors; the desk by the window is the
// talking spot (mail, bills, bookshelf).
export const clampHomePoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.6, Math.min(2.6, p.x)), z: Math.max(.4, Math.min(6.4, p.z)) });
export const homeSpot = (p: TownPoint): 'desk' | 'exit' | null => Math.hypot(p.x, p.z - .75) < 1.1 ? 'desk' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;
export const TIERS: Lifestyle[] = ['FRUGAL', 'MODEST', 'COMFORTABLE', 'AFFLUENT', 'LUXURIOUS'];
export const tierIndex = (lifestyle: Lifestyle) => Math.max(0, TIERS.indexOf(lifestyle));

export function createTownHome() {
  const root = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: string, roughness = .7) => { const key = color + roughness; let m = materials.get(key); if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness }); materials.set(key, m); } return m; };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, group: THREE.Object3D = root, radius = .04) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), mat(color)); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  const cyl = (r: number, h: number, x: number, y: number, z: number, color: string, group: THREE.Object3D = root) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat(color)); mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh; };
  const plant = (x: number, z: number, scale: number, group: THREE.Object3D) => { box(.5 * scale, .55 * scale, .5 * scale, x, .27 * scale + .2, z, '#a8865d', group); const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.45 * scale, 2), mat('#5f9464', .8)); leaves.scale.set(.8, 1.3, .8); leaves.position.set(x, .2 + 1.1 * scale, z); leaves.castShadow = true; group.add(leaves); };
  // Shell shared by every tier; wall colour and floor swap per tier.
  const floor = box(10, .3, 10, 0, .05, 2.4, '#d9cbb3'), wall = box(10, 4.8, .25, 0, 2.5, -2.5, '#e9e1d0');
  for (const x of [-5, 5]) box(.25, 1.4, 10, x, .85, 2.4, '#c9bba3');
  box(2.4, 1.6, .1, 0, 2.6, -2.36, '#a9d3e6', root, .02); box(2.6, .08, .12, 0, 3.44, -2.35, '#f4efe4'); box(2.6, .08, .12, 0, 1.76, -2.35, '#f4efe4'); box(.08, 1.6, .12, 0, 2.6, -2.35, '#f4efe4'); // window
  box(2.2, .06, .8, 0, 1.0, -.7, '#8a6a4a'); for (const dx of [-1, 1]) box(.08, .8, .7, dx, .6, -.7, '#7a5a3c'); box(.5, .36, .06, .55, 1.25, -.85, '#101a22'); box(.32, .03, .24, -.6, 1.04, -.6, '#fff6e2'); // desk, screen, letters
  box(2, .028, .85, 0, .23, 6.1, '#b7a58c');
  const exitCanvas = document.createElement('canvas'); exitCanvas.width = 512; exitCanvas.height = 128; const ink = exitCanvas.getContext?.('2d');
  if (ink) { ink.fillStyle = '#6b5a44'; ink.fillRect(0, 0, 512, 128); ink.fillStyle = '#fff1d6'; ink.font = '600 60px sans-serif'; ink.textAlign = 'center'; ink.fillText('SQUARE  →', 256, 84);
    const exitTexture = new THREE.CanvasTexture(exitCanvas); exitTexture.colorSpace = THREE.SRGBColorSpace; const exit = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .375), new THREE.MeshBasicMaterial({ map: exitTexture })); exit.rotation.x = -Math.PI / 2; exit.position.set(0, .26, 6.1); root.add(exit); }
  const halo = new THREE.Mesh(new THREE.RingGeometry(.35, .4, 40), new THREE.MeshBasicMaterial({ color: '#f3d491', side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.set(0, .253, .75); root.add(halo);
  // Tier groups. `only` items belong to one tier; `from` items appear at that tier and above.
  const only: THREE.Group[] = TIERS.map(() => { const g = new THREE.Group(); root.add(g); return g; }), from: THREE.Group[] = TIERS.map(() => { const g = new THREE.Group(); root.add(g); return g; });
  // FRUGAL: mattress on the floor, crate table, hotplate, clothes rail, a bare bulb.
  box(1.9, .22, 1.1, -3.5, .31, 4.6, '#c9c2b4', only[0]); box(.5, .12, .35, -4.2, .48, 4.3, '#ece6da', only[0]); box(.6, .5, .6, 3.6, .45, 4.4, '#9a7c56', only[0]); box(.4, .06, .4, 3.6, .73, 4.4, '#2b2b2b', only[0]); cyl(.02, 1.6, -3.8, 1, 1.4, '#555', only[0]); box(1.4, .03, .03, -3.8, 1.8, 1.4, '#555', only[0]); for (const dx of [-.4, -.1, .2]) box(.04, .5, .25, -3.8 + dx, 1.5, 1.4, ['#7d9873', '#aa716a', '#5f7fa8'][Math.round((dx + .4) * 3.33)], only[0], .01);
  // MODEST and up: a real bed, table with two chairs, kitchenette with fridge, bookshelf, a plant.
  box(1.9, .5, 1.2, -3.5, .45, 4.6, '#b07d5a', from[1]); box(1.75, .18, 1.05, -3.5, .78, 4.6, '#eee8dc', from[1]); box(.55, .14, .4, -4.1, .93, 4.35, '#f6f1e6', from[1]); box(1.9, .7, .12, -3.5, .95, 5.24, '#8a6242', from[1]);
  box(1.1, .06, .8, 3.4, .95, 4.4, '#b08a5c', from[1]); cyl(.05, .75, 3.4, .57, 4.4, '#5a4634', from[1]); for (const dz of [-.65, .65]) { box(.45, .06, .45, 3.4, .68, 4.4 + dz, '#c9a071', from[1]); box(.45, .5, .06, 3.4, .9, 4.4 + dz + Math.sign(dz) * .2, '#c9a071', from[1]); }
  box(2, .9, .6, 3.6, .65, 1.2, '#d9d2c2', from[1]); box(.6, 1.6, .6, 4.5, 1.0, 1.2, '#e8e8ea', from[1]); box(.05, .35, .05, 4.2, 1.2, .95, '#8a8a8a', from[1]); box(2, .08, .62, 3.6, 1.12, 1.2, '#7a5a3c', from[1]);
  box(1.2, 1.7, .3, -3.9, 1.05, 1.1, '#8a6242', from[1]); for (const y of [.55, 1.05, 1.55]) for (let i = 0; i < 5; i++) box(.16, .34, .22, -4.35 + i * .2, y, 1.1, ['#7d9873', '#aa716a', '#5f7fa8', '#c7b58c', '#967caf'][i], from[1], .01);
  plant(4.2, 5.6, 1, from[1]);
  // COMFORTABLE and up: sofa, television, rug, framed pictures, second plant.
  box(2.3, .55, .95, 0, .48, 3.6, '#7d8d9c', from[2]); box(2.3, .55, .25, 0, .95, 4.0, '#6e7e8d', from[2]); for (const dx of [-1.05, 1.05]) box(.22, .6, .95, dx, .55, 3.6, '#6e7e8d', from[2]);
  box(3.2, .02, 2.4, 0, .225, 2.6, '#b7a5c8', from[2], .01); box(1.6, .95, .08, 0, 1.15, 1.3, '#101a22', from[2]); box(1.8, .5, .5, 0, .45, 1.35, '#8a6242', from[2]);
  for (const x of [-2.2, 2.2]) box(.7, .55, .05, x, 3.0, -2.36, ['#c9a071', '#5f9464'][x > 0 ? 1 : 0], from[2], .01); plant(-4.2, 5.6, 1, from[2]);
  // AFFLUENT and up: wider windows, lounge chairs, a bar and art; walls go warm white.
  for (const x of [-2.9, 2.9]) { box(1.6, 1.6, .1, x, 2.6, -2.36, '#a9d3e6', from[3], .02); box(1.8, .08, .12, x, 3.44, -2.35, '#f4efe4', from[3]); box(1.8, .08, .12, x, 1.76, -2.35, '#f4efe4', from[3]); }
  for (const x of [-1.6, 1.6]) { box(.9, .45, .9, x, .45, 5.0, '#c48a5a', from[3]); box(.9, .55, .2, x, .9, 5.4, '#b07a4c', from[3]); }
  box(1.6, .95, .5, 3.5, .7, 2.8, '#3f4a55', from[3]); for (const i of [0, 1, 2]) cyl(.05, .3, 3.1 + i * .4, 1.33, 2.8, ['#c9a071', '#8ab', '#eee'][i], from[3]);
  box(1.4, 1.0, .05, 0, 3.2, -2.36, '#e0553f', from[3], .01);
  // LUXURIOUS: piano, chandelier, marble floor, a skyline picture and tall plants.
  box(1.9, .25, 1.1, 0, 1.0, -.6, '#141414', from[4]); box(1.9, .9, 1.1, 0, .5, -.6, '#1a1a1a', from[4]); box(1.5, .06, .28, 0, 1.13, -.02, '#f6f6f6', from[4]); box(.5, .4, .5, 0, .42, .75, '#141414', from[4]);
  cyl(.02, 1.0, 0, 4.1, 2.4, '#c9a94a', from[4]); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const bulb = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffe9b8', emissive: '#ffcf7a', emissiveIntensity: .6 })); bulb.position.set(Math.cos(a) * .55, 3.55, 2.4 + Math.sin(a) * .55); from[4].add(bulb); }
  box(3.2, .05, 1.6, 0, 3.6, 2.4, '#c9a94a', from[4], .02); plant(-4.3, 2.8, 1.5, from[4]); plant(4.3, .6, 1.4, from[4]);
  root.visible = false;
  const wallColours = ['#bdb6ac', '#e9e1d0', '#f2ead9', '#faf5ea', '#fbf7ee'], floorColours = ['#b9ad98', '#d9cbb3', '#c8b291', '#d8c9ae', '#e9e4dc'];
  return {
    root,
    setLifestyle(lifestyle: Lifestyle) {
      const tier = tierIndex(lifestyle);
      only.forEach((g, i) => { g.visible = i === tier; }); from.forEach((g, i) => { g.visible = tier >= i; });
      (wall.material as THREE.MeshStandardMaterial).color.set(wallColours[tier]); (floor.material as THREE.MeshStandardMaterial).color.set(floorColours[tier]);
    },
  };
}

// The townhouse the apartment door belongs to: a two-storey block at the west end of the
// promenade, facing east onto the square. Windows share the night glow with the shopfronts.
export function createHomeFacade(door: { x: number; z: number }) {
  const root = new THREE.Group();
  const mat = (color: string, roughness = .7) => new THREE.MeshStandardMaterial({ color, roughness });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, radius = .05) => { const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh; };
  const sand = mat('#d8c1a1'), cream = mat('#f3ead8'), clay = mat('#b8705a'), slate = mat('#3e4a52'), glass = new THREE.MeshStandardMaterial({ color: '#1d4652', roughness: .25, metalness: .1, emissive: '#ffc985', emissiveIntensity: 0 });
  const front = door.x - 1.05, cx = front - 1.7;                                   // front face just behind the door frame
  box(3.4, 7.0, 6.6, cx, 3.5, door.z + .6, sand, .12);                              // body
  box(3.7, .5, 6.9, cx, .3, door.z + .6, cream, .08);                               // foundation
  for (const y of [3.35, 6.85]) box(3.6, .22, 6.9, cx, y, door.z + .6, cream, .05); // cornices
  box(3.2, .5, 6.4, cx, 7.2, door.z + .6, slate, .04);                              // roof
  for (const z of [door.z - 2.2, door.z + 3.4]) for (const y of [1.6, 5.0]) {        // ground + upper windows either side of the door
    box(.16, 1.7, 1.2, front + .02, y, z, cream, .04); box(.06, 1.5, 1.0, front + .1, y, z, glass, .01); box(.2, .14, 1.35, front + .04, y - .95, z, cream, .03);
  }
  box(.16, 1.7, 1.2, front + .02, 5.0, door.z, cream, .04); box(.06, 1.5, 1.0, front + .1, 5.0, door.z, glass, .01); // window above the door
  box(1.0, .1, 1.9, front + .45, 2.75, door.z, clay, .03);                          // canopy
  for (const dz of [-.85, .85]) box(.06, .9, .06, front + .9, 2.3, door.z + dz, slate, .01);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffe9b8', emissive: '#ffcf7a', emissiveIntensity: .6 })); lamp.position.set(front + .35, 2.55, door.z); root.add(lamp);
  box(.7, .55, .6, front + .45, .55, door.z - 1.5, mat('#a8865d'), .08);            // planter
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 2), mat('#5f9464', .8)); leaves.scale.set(.8, 1.2, .8); leaves.position.set(front + .45, 1.2, door.z - 1.5); leaves.castShadow = true; root.add(leaves);
  return { root, glass, bounds: new THREE.Box3(new THREE.Vector3(cx - 1.9, 0, door.z - 2.85), new THREE.Vector3(front + .5, 7.6, door.z + 4.05)) };
}
