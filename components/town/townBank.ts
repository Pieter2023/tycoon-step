import * as THREE from 'three';
import { tl } from '../../i18n/town';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TownPoint } from './townWorld';

// The furniture sits outside this clear lobby corridor. The room has no roof or
// front wall, so the following camera always has a clear view of the character.
export const clampBankPoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.65, Math.min(2.65, p.x)), z: Math.max(.4, Math.min(6.4, p.z)) });
export const bankSpot = (p: TownPoint): 'teller' | 'exit' | null =>
  Math.hypot(p.x, p.z - .75) < 1.1 ? 'teller' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;

export function createTownBank() {
  const root = new THREE.Group();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, radius = .06) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), new THREE.MeshStandardMaterial({ color, roughness: .65 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  const sign = (text: string, x: number, y: number, z: number, width: number, bg = '#28544c') => {
    const label = document.createElement('canvas'); label.width = 1024; label.height = 180;
    const ctx = label.getContext('2d')!; ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 180);
    ctx.fillStyle = '#fff0cb'; ctx.font = '600 66px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 512, 114);
    const texture = new THREE.CanvasTexture(label); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 180 / 1024), new THREE.MeshBasicMaterial({ map: texture }));
    mesh.position.set(x, y, z); root.add(mesh); return mesh;
  };
  box(10, .3, 10, 0, .05, 2.4, '#dfd5bf');
  box(10, 4.7, .25, 0, 2.45, -2.5, '#ebe6d8');
  box(.25, 1.3, 10, -5, .8, 2.4, '#497a70'); box(.25, 1.3, 10, 5, .8, 2.4, '#497a70');
  box(9.8, 1.1, .12, 0, .78, -2.32, '#477a6b');
  for (let x = -4.5; x <= 4.5; x += .5) box(.035, 1.1, .06, x, .78, -2.22, '#aabd9c', .01);
  sign('COMMUNITY BANK', 0, 3.8, -2.32, 5.2);
  sign(tl('Small steps. Stronger futures.','Pasos pequeños. Futuros más sólidos.'), 0, 3.1, -2.31, 3.7, '#688679');
  box(4.6, 1, 1.1, 0, .74, -.65, '#447b70');
  box(4.85, .16, 1.3, 0, 1.3, -.65, '#e9caa0');
  for (const x of [-1.9, -1.5, -1.1, 1.1, 1.5, 1.9]) box(.04, .9, .06, x, .75, -.06, '#92b4a0', .01);
  box(.58, .4, .08, .95, 1.59, -.65, '#283e44'); box(.1, .18, .1, .95, 1.39, -.65, '#283e44');
  box(.48, .035, .32, -.85, 1.41, -.37, '#ffedc5');
  sign('HELLO, NEIGHBOUR', 0, .83, -.08, 1.75);
  const rug = box(4.4, .025, 3.6, 0, .22, 2.5, '#6e9a87', .015);
  box(4.1, .028, .045, 0, .237, .83, '#ebd6a7', .01); box(4.1, .028, .045, 0, .237, 4.17, '#ebd6a7', .01);
  for (const x of [-3.8, 3.8]) {
    box(1.4, .45, 2.8, x, .65, 2.4, '#d49b74');
    box(.3, .9, 2.9, x + Math.sign(x) * .62, 1, 2.4, '#ce916d');
    for (const z of [1.2, 2.4, 3.6]) box(1.1, .16, 1.02, x, .96, z, '#e4b790');
    box(.65, .7, .65, x, .56, 5.2, '#ac8862');
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.6, 2), new THREE.MeshStandardMaterial({ color: '#5c8d62', roughness: .8 }));
    leaves.scale.set(.7, 1.3, .7); leaves.position.set(x, 1.65, 5.2); leaves.castShadow = true; root.add(leaves);
    box(.08, .95, .08, x, 1.15, 5.2, '#836d44');
  }
  box(2, .028, .85, 0, .23, 6.1, '#bd9c6a');
  const exit = sign('CITY  →', 0, .26, 6.1, 1.5); exit.rotation.x = -Math.PI / 2;
  // A soft halo indicates the point at which talking becomes available.
  const halo = new THREE.Mesh(new THREE.RingGeometry(.35, .4, 40), new THREE.MeshBasicMaterial({ color: '#f3d491', side: THREE.DoubleSide }));
  halo.rotation.x = -Math.PI / 2; halo.position.set(0, .253, .75); root.add(halo);
  root.visible = false;
  return { root, rug };
}
