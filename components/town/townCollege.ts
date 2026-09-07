import * as THREE from 'three';
import { tl } from '../../i18n/town';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { TownPoint } from './townWorld';
import type { CollegeBoard } from '../../services/townCollege';
import { createHomeFacade, type FacadePalette } from './townHome';

// Freedom Square Community College: a classroom with the study plan on the whiteboard, the
// registrar's desk at the front, two rows of student desks and a bookshelf. Same footprint and
// spots as the other interiors so walking, camera and exits behave identically.
export const clampCollegePoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.5, Math.min(2.5, p.x)), z: Math.max(.4, Math.min(6.4, p.z)) });
export const collegeSpot = (p: TownPoint): 'registrar' | 'exit' | null => Math.hypot(p.x, p.z - .75) < 1.1 ? 'registrar' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;
export const COLLEGE_PALETTE: FacadePalette = { body: '#c9a98a', trim: '#f4ecdc', canopy: '#6b4f8a', roof: '#3a3f47' };

// The college stands on the south lawn between the fountain and the east tree and faces north onto
// the square. The townhouse builder makes an east-facing front, so the group is turned a quarter
// turn and narrowed to fit the slot (`width` scales the frontage).
export function createCollegeFacade(door: { x: number; z: number }, width = .75) {
  const facade = createHomeFacade({ x: 0, z: 0 }, COLLEGE_PALETTE);
  const root = new THREE.Group(); root.add(facade.root);
  facade.root.scale.set(1, 1, width); facade.root.rotation.y = Math.PI / 2; root.position.set(door.x, 0, door.z);
  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, ...extra });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh; };
  add(new THREE.BoxGeometry(1.7, 2.6, .35), mat(COLLEGE_PALETTE.trim), 0, 1.5, .85);           // door frame
  add(new THREE.BoxGeometry(1.0, 2.1, .08), mat(COLLEGE_PALETTE.canopy), 0, 1.27, .66);        // door
  add(new THREE.SphereGeometry(.05, 8, 6), mat('#d9b25a', { metalness: .6, roughness: .3 }), -.35, 1.2, .6); // knob
  add(new THREE.BoxGeometry(1.4, .12, .6), mat('#cfc3ad'), 0, .26, .4);                        // step
  for (const dx of [-1.3, 1.3]) add(new THREE.BoxGeometry(.3, .3, .3), mat('#a8865d'), dx, .45, .55);  // planters
  const bell = add(new THREE.CylinderGeometry(.12, .16, .2, 12), mat('#c9a14d', { metalness: .5, roughness: .4 }), .95, 2.75, .55); bell.castShadow = false;
  const sign = document.createElement('canvas'); sign.width = 512; sign.height = 128; const ink = sign.getContext?.('2d');
  if (ink) { ink.fillStyle = '#3d2f52'; ink.fillRect(0, 0, 512, 128); ink.fillStyle = '#f7ecd2'; ink.font = '600 50px sans-serif'; ink.textAlign = 'center'; ink.fillText(tl('COMMUNITY COLLEGE','COLEGIO COMUNITARIO'), 256, 82); }
  const texture = new THREE.CanvasTexture(sign); texture.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .425), new THREE.MeshBasicMaterial({ map: texture })); plate.position.set(0, 2.95, .63); plate.rotation.y = Math.PI; root.add(plate);
  // World-space footprint for the camera walls: the rotated, narrowed townhouse behind the door.
  const b = facade.bounds;
  const bounds = new THREE.Box3(new THREE.Vector3(door.x + b.min.z * width, 0, door.z - b.max.x), new THREE.Vector3(door.x + b.max.z * width, b.max.y, door.z - b.min.x));
  return { root, glass: facade.glass, bounds };
}

export function createTownCollege() {
  const root = new THREE.Group(); root.visible = false;   // shown only after the college door transition
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, radius = .05) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), new THREE.MeshStandardMaterial({ color, roughness: .7 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  const canvasPlane = (w: number, h: number, x: number, y: number, z: number, rotationY = 0, px = 768) => {
    const canvas = document.createElement('canvas'); canvas.width = px; canvas.height = Math.round(px * h / w);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })); mesh.position.set(x, y, z); mesh.rotation.y = rotationY; root.add(mesh);
    const frame = box(w + .14, h + .14, .05, x, y, z - .03 * Math.cos(rotationY), '#6b4f8a', .02); frame.rotation.y = rotationY;
    return { canvas, texture };
  };
  box(10, .3, 10, 0, .05, 2.4, '#c9b48f');                                    // wooden floor
  box(10, 4.8, .25, 0, 2.5, -2.5, '#f1ebdd');                                 // back wall
  for (const x of [-5, 5]) box(.25, 1.4, 10, x, .85, 2.4, '#b9a48b');         // side walls
  box(4.6, .025, 3.8, 0, .22, 2.9, '#7a6d8f', .015);                           // rug
  const plan = canvasPlane(3.8, 2.2, 0, 3.05, -2.36);                          // whiteboard: study plan
  const shelfWall = canvasPlane(1.7, 1.2, 4.86, 2.5, 1.4, -Math.PI / 2, 512);  // certificates board
  const poster = canvasPlane(1.6, 1.1, -4.86, 2.4, 4.2, Math.PI / 2, 512);     // lesson poster
  // Bookshelf on the left wall.
  box(.3, 2.6, 2.6, -4.72, 1.45, 1.6, '#6e4a2e', .02);
  for (const [i, y] of [.55, 1.15, 1.75, 2.35].entries()) { box(.32, .06, 2.5, -4.72, y, 1.6, '#8a6340', .01); for (let k = 0; k < 9; k++) box(.2, .42, .18, -4.62, y + .27, .5 + k * .27, ['#b04a3c', '#3f6f8c', '#c9a14d', '#4f7a55', '#7a4a8c', '#d97a4a'][(i * 3 + k) % 6], .015); }
  // Registrar desk with a globe and a stack of prospectuses.
  box(4.4, 1, 1.1, 0, .74, -.65, '#5a4a6b'); box(4.65, .16, 1.3, 0, 1.3, -.65, '#efe6d6');
  const globe = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), new THREE.MeshStandardMaterial({ color: '#3f7fa8', roughness: .5 })); globe.position.set(-1.3, 1.62, -.7); globe.castShadow = true; root.add(globe);
  box(.06, .3, .06, -1.3, 1.45, -.7, '#c9a14d', .01);
  box(.5, .12, .36, 1.1, 1.44, -.6, '#fff9e6', .01); box(.62, .42, .05, 0, 1.62, -.75, '#1f2933', .02);
  // Two rows of student desks facing the whiteboard.
  for (const [x, z] of [[-1.6, 2.0], [1.6, 2.0], [-1.6, 3.7], [1.6, 3.7]]) {
    box(1.4, .08, .7, x, 1.05, z, '#e7ddc9', .02); for (const dx of [-.6, .6]) box(.08, 1.0, .08, x + dx, .55, z, '#8a7a62', .01);
    box(.5, .03, .3, x, 1.1, z + .05, '#fdfaf2', .01);
    box(.6, .1, .6, x, .72, z + .85, '#5a4a6b', .03); box(.6, .5, .1, x, 1.0, z + 1.1, '#5a4a6b', .03);          // chair
  }
  box(.6, .65, .6, 4.2, .55, 5.6, '#a8865d'); const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 2), new THREE.MeshStandardMaterial({ color: '#5f9464', roughness: .8 })); leaves.scale.set(.8, 1.3, .8); leaves.position.set(4.2, 1.5, 5.6); leaves.castShadow = true; root.add(leaves);
  box(2, .028, .85, 0, .23, 6.1, '#b8a98d');                                                     // exit mat

  const draw = (canvas: HTMLCanvasElement, fn: (ink: CanvasRenderingContext2D) => void, texture: THREE.CanvasTexture) => { const ink = canvas.getContext?.('2d'); if (!ink) return; fn(ink); texture.needsUpdate = true; };
  draw(poster.canvas, ink => { ink.fillStyle = '#3d2f52'; ink.fillRect(0, 0, 512, 352); ink.fillStyle = '#f7ecd2'; ink.font = '700 40px sans-serif'; ink.textAlign = 'center'; ink.fillText(tl('LEARNING HAS A PAYBACK','APRENDER TIENE RETORNO'), 256, 140); ink.font = '400 26px sans-serif'; ink.fillText(tl('cost ÷ monthly raise = months to break even','costo ÷ aumento mensual = meses para recuperarlo'), 256, 200); ink.fillText(tl('only courses on your path raise your pay','solo los cursos de tu carrera suben tu sueldo'), 256, 240); }, poster.texture);
  const setBoard = (board: CollegeBoard) => {
    draw(plan.canvas, ink => {
      const W = plan.canvas.width, H = plan.canvas.height; ink.fillStyle = '#fbfaf6'; ink.fillRect(0, 0, W, H);
      ink.fillStyle = '#3d2f52'; ink.fillRect(0, 0, W, 78); ink.fillStyle = '#f7ecd2'; ink.font = '700 34px sans-serif'; ink.textAlign = 'left'; ink.fillText(board.title, 28, 52);
      ink.font = '400 28px sans-serif'; let y = 130;
      if (!board.rows.length) { ink.fillStyle = '#2a3944'; ink.fillText(tl('Every course on your path is complete.','Todos los cursos de tu carrera están completos.'), 28, y); }
      for (const row of board.rows) { ink.fillStyle = row.state === 'enrolled' ? '#1f6f4a' : row.state === 'open' ? '#2a3944' : '#8b98a3'; ink.textAlign = 'left'; ink.fillText(`${row.state === 'enrolled' ? '● ' : row.state === 'open' ? '→ ' : '· '}${row.name.slice(0, 32)}`, 28, y); ink.textAlign = 'right'; ink.fillText(row.payback, W - 28, y); y += 42; }
      ink.strokeStyle = '#3d2f52'; ink.lineWidth = 3; ink.beginPath(); ink.moveTo(28, H - 74); ink.lineTo(W - 28, H - 74); ink.stroke();
      ink.font = '700 30px sans-serif'; ink.fillStyle = '#3d2f52'; ink.textAlign = 'left'; ink.fillText(tl('PAYBACK','RETORNO'), 28, H - 26); ink.textAlign = 'right'; ink.font = '400 26px sans-serif'; ink.fillText(tl('months incl. study time','meses incl. estudio'), W - 28, H - 26);
    }, plan.texture);
    draw(shelfWall.canvas, ink => {
      const W = shelfWall.canvas.width, H = shelfWall.canvas.height; ink.fillStyle = '#efe6d6'; ink.fillRect(0, 0, W, H);
      ink.fillStyle = '#3d2f52'; ink.font = '700 32px sans-serif'; ink.textAlign = 'left'; ink.fillText(tl('CERTIFICATES','CERTIFICADOS'), 24, 48);
      let y = 100; for (const cert of board.certificates) { ink.fillStyle = cert.done ? '#1f6f4a' : '#8b98a3'; ink.font = `${cert.done ? '700' : '400'} 24px sans-serif`; ink.fillText(`${cert.done ? '✓ ' : '○ '}${cert.name.slice(0, 26)}`, 24, y); y += 40; }
      ink.fillStyle = '#3d2f52'; ink.font = '400 22px sans-serif'; ink.fillText(`${board.degrees.length} ${tl('on your shelf','en tu librero')}`, 24, H - 24);
    }, shelfWall.texture);
  };
  return { root, setBoard };
}
