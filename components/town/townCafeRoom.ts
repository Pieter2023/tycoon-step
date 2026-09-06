import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { CafeState } from '../../services/townCafe';
import type { TownPoint } from './townWorld';
export const clampCafePoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.35, Math.min(1.65, p.x)), z: Math.max(.5, Math.min(6.4, p.z)) });
export const cafeSpot = (p: TownPoint): 'cafe-counter' | 'exit' | null => Math.hypot(p.x, p.z - .8) < 1.1 ? 'cafe-counter' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;
export function createCafeRoom() {
  const root = new THREE.Group(), furniture = new THREE.Group(), equipment = new THREE.Group(), upgraded = new THREE.Group(); root.add(furniture, equipment, upgraded);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, group: THREE.Group = root) => {
    let material = materials.get(color); if (!material) { material = new THREE.MeshStandardMaterial({ color, roughness: .68 }); materials.set(color, material); }
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .035), material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  const label = (text: string, width: number, x: number, y: number, z: number, background = '#365d54') => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 220; const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = background; ctx.fillRect(0, 0, 1024, 220); ctx.fillStyle = '#fff0cd'; ctx.font = '600 74px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 512, 135);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 220 / 1024), new THREE.MeshBasicMaterial({ map: texture })); m.position.set(x, y, z); root.add(m); return m;
  };
  box(10, .3, 10, 0, .05, 2.4, '#e8d9bd');
  for (let z = -2; z < 7; z += .55) box(9.9, .012, .015, 0, .207, z, '#c9b894');
  box(10, 4.8, .25, 0, 2.5, -2.5, '#e5c7a4'); box(10, 1.2, .1, 0, .85, -2.3, '#618071');
  label('LITTLE SQUARE CAFÉ', 5.6, 0, 3.9, -2.32);
  label('GOOD COFFEE. GOOD COMPANY.', 3.8, 0, 3.1, -2.31, '#9b7757');
  for (const x of [-3.5, 3.5]) { box(1.5, 1.6, .12, x, 2.35, -2.25, '#365d54'); label(x < 0 ? 'FRESH DAILY' : 'TAKE A SEAT', 1.3, x, 2.35, -2.16); }
  for (const x of [-5, 5]) { box(.2, 1.2, 10, x, .8, 2.4, '#7b9c85'); for (const z of [0, 3.7]) { box(.2, 1.4, 2.1, x, 2.1, z, '#b7d5cb'); box(.3, .08, 2.3, x, 1.4, z, '#a97752'); } }
  box(5.1, 1, 1, 0, .74, -.7, '#547e6b'); box(5.3, .14, 1.2, 0, 1.31, -.7, '#f4e3c1');
  for (let x = -2.3; x < 2.4; x += .22) box(.04, .83, .025, x, .77, -.18, '#a7b99a');
  box(.65, .42, .5, -.6, 1.59, -.7, '#c5a063', equipment); box(.6, .08, .25, -.6, 1.4, -.33, '#344d48', equipment);
  box(1.1, .65, .6, -.6, 1.7, -.7, '#c79849', upgraded);
  for (const x of [-.9, -.3]) { box(.15, .17, .1, x, 1.63, -.33, '#263f3b', upgraded); box(.13, .15, .13, x, 1.45, -.23, '#fff2d5', upgraded); }
  box(.6, .35, .4, 1.65, 1.6, -.7, '#476058'); label('WELCOME', 1.5, 0, .8, -.155);
  // Seating and queue are outside the clear central walking aisle.
  for (const z of [1.4, 4.3]) {
    box(1.25, .09, 1.05, -3.5, 1.06, z, '#b7855f', furniture); box(.12, .82, .12, -3.5, .63, z, '#536153', furniture);
    for (const dz of [-.82, .82]) { box(.7, .12, .65, -3.5, .65, z + dz, '#cd8e6a', furniture); box(.7, .6, .12, -3.5, .93, z + dz + Math.sign(dz) * .28, '#dba57a', furniture); for (const dx of [-.25, .25]) box(.07, .48, .07, -3.5 + dx, .4, z + dz, '#685840', furniture); }
    const pot = box(.2, .25, .2, -3.5, 1.22, z, '#f4e9d1', furniture); pot.rotation.y = .3; box(.24, .2, .24, -3.5, 1.43, z, '#658961', furniture);
  }
  box(1.1, .9, 2.6, 4, .66, 3.4, '#bb8b63'); box(1.2, .1, 2.7, 4, 1.15, 3.4, '#f0dab5');
  for (const z of [2.4, 3.4, 4.4]) box(.45, .55, .45, 4, 1.48, z, '#778f70');
  box(2.6, .025, 1, 0, .23, 6.1, '#618472'); const exit = label('SQUARE  →', 1.8, 0, .25, 6.1); exit.rotation.x = -Math.PI / 2;
  // Rounded plants, pendant shades and counter ceramics soften the fit-out.
  for(const x of [-4.3,4.3]) {
    box(.55,.65,.55,x,.55,5.8,'#c69a77');
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,2),new THREE.MeshStandardMaterial({color:'#5d8b61',roughness:.8}));leaves.scale.set(.8,1.4,.8);leaves.position.set(x,1.5,5.8);leaves.castShadow=true;root.add(leaves);
  }
  for(const x of [-1.7,1.7]) {
    box(.025,.8,.025,x,4.2,-.6,'#655f46');
    const shade=new THREE.Mesh(new THREE.ConeGeometry(.38,.3,24,1,true),new THREE.MeshStandardMaterial({color:'#b58e53',side:THREE.DoubleSide,roughness:.5}));shade.position.set(x,3.65,-.6);root.add(shade);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),new THREE.MeshStandardMaterial({color:'#ffe4a6',emissive:'#ffbf66',emissiveIntensity:.5}));bulb.position.set(x,3.5,-.6);root.add(bulb);
  }
  for(const x of [.2,.5,.8]) {
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.2,16),new THREE.MeshStandardMaterial({color:'#fff3d8'}));cup.position.set(x,1.49,-.45);root.add(cup);
  }
  root.visible = false;
  return { root, setState(cafe?: Pick<CafeState,'seats'|'machine'>) { furniture.visible = !!cafe?.seats; upgraded.visible = !!cafe?.machine; equipment.visible = !cafe?.machine; } };
}
