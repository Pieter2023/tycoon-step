import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { TownPoint } from './townWorld';

// Estate-agent office: listings wall at the back, agent desk with a model house, rate board on
// the side wall, clear aisle to the exit. Same footprint and spots as the other interiors.
export const clampPropertyPoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.5, Math.min(2.5, p.x)), z: Math.max(.4, Math.min(6.4, p.z)) });
export const propertySpot = (p: TownPoint): 'agent' | 'exit' | null =>
  Math.hypot(p.x, p.z - .75) < 1.1 ? 'agent' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;

export type ListingCard = { name: string; price: string; rent: string; tag: string; colour: string };
export type PropertyBoard = { listings: ListingCard[]; rateLine: string; headline: string };

export function createTownProperty() {
  const root = new THREE.Group();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, radius = .05) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), new THREE.MeshStandardMaterial({ color, roughness: .65 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  const canvasPlane = (w: number, h: number, x: number, y: number, z: number, rotationY = 0, px = 512) => {
    const canvas = document.createElement('canvas'); canvas.width = px; canvas.height = Math.round(px * h / w);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })); mesh.position.set(x, y, z); mesh.rotation.y = rotationY; root.add(mesh);
    const frame = box(w + .14, h + .14, .05, x, y, z - .03 * Math.cos(rotationY), '#e9dcc4', .02); frame.rotation.y = rotationY;
    return { canvas, texture };
  };
  box(10, .3, 10, 0, .05, 2.4, '#e4dccb');                                  // floor
  box(10, 4.8, .25, 0, 2.5, -2.5, '#f2ece0');                               // back wall
  for (const x of [-5, 5]) box(.25, 1.4, 10, x, .85, 2.4, '#b9a98c');       // side walls
  box(4.4, .025, 3.6, 0, .22, 2.5, '#9c7c8c', .015);                         // rug
  const title = canvasPlane(4.6, .7, 0, 4.1, -2.36);
  const cards = [-2.55, -.85, .85, 2.55].map(x => canvasPlane(1.5, 1.7, x, 2.75, -2.36));
  const rates = canvasPlane(2.6, 1.4, -4.86, 2.1, 2.2, Math.PI / 2, 768);
  box(4.6, 1, 1.1, 0, .74, -.65, '#7a5c8a'); box(4.85, .16, 1.3, 0, 1.3, -.65, '#f1e4c8');   // agent desk
  box(.5, .035, .32, -1.1, 1.41, -.5, '#fff4dc');                                             // brochures
  const houseBody = box(.6, .38, .45, 1.1, 1.57, -.65, '#f4e6c9', .02);                       // model house
  const roof = new THREE.Mesh(new THREE.ConeGeometry(.5, .3, 4), new THREE.MeshStandardMaterial({ color: '#b35a4a', roughness: .8 })); roof.rotation.y = Math.PI / 4; roof.position.set(1.1, 1.91, -.65); roof.castShadow = true; root.add(roof); houseBody.castShadow = true;
  for (const [x, z] of [[-3.7, 2.4], [3.7, 2.4]]) { box(1.4, .45, 2.4, x, .65, z, '#c7a78a'); box(.3, .9, 2.5, x + Math.sign(x) * .62, 1, z, '#b9987a'); for (const dz of [-.8, 0, .8]) box(1.1, .16, .7, x, .96, z + dz, '#e6c9a8'); } // waiting sofas
  for (const x of [-4.2, 4.2]) { box(.6, .65, .6, x, .55, 5.6, '#a8865d'); const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 2), new THREE.MeshStandardMaterial({ color: '#5f9464', roughness: .8 })); leaves.scale.set(.8, 1.3, .8); leaves.position.set(x, 1.55, 5.6); leaves.castShadow = true; root.add(leaves); }
  box(2, .028, .85, 0, .23, 6.1, '#b7a58c');
  const exitCanvas = document.createElement('canvas'); exitCanvas.width = 512; exitCanvas.height = 128; const ink = exitCanvas.getContext('2d')!;
  ink.fillStyle = '#7a5c8a'; ink.fillRect(0, 0, 512, 128); ink.fillStyle = '#fff1d6'; ink.font = '600 60px sans-serif'; ink.textAlign = 'center'; ink.fillText('CITY  →', 256, 84);
  const exitTexture = new THREE.CanvasTexture(exitCanvas); exitTexture.colorSpace = THREE.SRGBColorSpace;
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .375), new THREE.MeshBasicMaterial({ map: exitTexture })); exit.rotation.x = -Math.PI / 2; exit.position.set(0, .26, 6.1); root.add(exit);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.35, .4, 40), new THREE.MeshBasicMaterial({ color: '#f3d491', side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.set(0, .253, .75); root.add(halo);
  for (const x of [-1.7, 1.7]) { box(.025, .8, .025, x, 4.2, .2, '#655f46'); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffe4a6', emissive: '#ffbf66', emissiveIntensity: .5 })); bulb.position.set(x, 3.75, .2); root.add(bulb); }
  root.visible = false;
  const drawTitle = (board: PropertyBoard) => { const c = title.canvas, ctx = c.getContext('2d')!; ctx.fillStyle = '#7a5c8a'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#fff1d6'; ctx.font = '600 44px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PROPERTY & CO. · ' + board.headline.toUpperCase(), c.width / 2, c.height / 2 + 16); title.texture.needsUpdate = true; };
  const drawCard = (target: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }, card?: ListingCard) => {
    const c = target.canvas, ctx = c.getContext('2d')!; ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, c.width, c.height);
    if (!card) { ctx.fillStyle = '#c9b9a8'; ctx.font = '600 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('COMING SOON', c.width / 2, c.height / 2); target.texture.needsUpdate = true; return; }
    // A tiny house sketch in the listing's colour: body, roof, door and window.
    ctx.fillStyle = card.colour; ctx.fillRect(96, 150, 320, 190); ctx.beginPath(); ctx.moveTo(60, 160); ctx.lineTo(256, 40); ctx.lineTo(452, 160); ctx.closePath(); ctx.fillStyle = '#6a4a3a'; ctx.fill();
    ctx.fillStyle = '#3d2b25'; ctx.fillRect(226, 240, 60, 100); ctx.fillStyle = '#bfe3ef'; ctx.fillRect(130, 190, 70, 60); ctx.fillRect(312, 190, 70, 60);
    ctx.fillStyle = '#2b2b33'; ctx.font = '600 38px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(card.name, c.width / 2, 400);
    ctx.fillStyle = '#7a5c8a'; ctx.font = '600 46px sans-serif'; ctx.fillText(card.price, c.width / 2, 458);
    ctx.fillStyle = '#4c5b52'; ctx.font = '30px sans-serif'; ctx.fillText(card.rent, c.width / 2, 505); ctx.fillStyle = '#b35a4a'; ctx.fillText(card.tag, c.width / 2, 548);
    target.texture.needsUpdate = true;
  };
  const drawRates = (board: PropertyBoard) => { const c = rates.canvas, ctx = c.getContext('2d')!; ctx.fillStyle = '#2f3a44'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#f2d99a'; ctx.font = '600 44px sans-serif'; ctx.textAlign = 'left'; ctx.fillText("TODAY'S MORTGAGE RATES", 30, 70); ctx.fillStyle = '#e8eef1'; ctx.font = '36px sans-serif'; board.rateLine.split('\n').forEach((line, i) => ctx.fillText(line, 30, 140 + i * 56)); rates.texture.needsUpdate = true; };
  return { root, setBoard(board: PropertyBoard) { drawTitle(board); cards.forEach((card, i) => drawCard(card, board.listings[i])); drawRates(board); } };
}
