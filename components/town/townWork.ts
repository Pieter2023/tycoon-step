import * as THREE from 'three';
import { tl } from '../../i18n/town';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { TownPoint } from './townWorld';
import type { WorkBoard } from '../../services/townWork';

// Main Street Offices: an open-plan floor with the payroll board on the back wall, the career
// ladder on the side wall, two workstations and the manager's desk. Same footprint and spots as
// the other interiors so walking, camera and exits behave identically.
export const clampWorkPoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.5, Math.min(2.5, p.x)), z: Math.max(.4, Math.min(6.4, p.z)) });
export const workSpot = (p: TownPoint): 'manager' | 'exit' | null => Math.hypot(p.x, p.z - .75) < 1.1 ? 'manager' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;

export function createTownWork() {
  const root = new THREE.Group(); root.visible = false;   // shown only after the office door transition
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, radius = .05) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), new THREE.MeshStandardMaterial({ color, roughness: .65 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  const canvasPlane = (w: number, h: number, x: number, y: number, z: number, rotationY = 0, px = 768) => {
    const canvas = document.createElement('canvas'); canvas.width = px; canvas.height = Math.round(px * h / w);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })); mesh.position.set(x, y, z); mesh.rotation.y = rotationY; root.add(mesh);
    const frame = box(w + .14, h + .14, .05, x, y, z - .03 * Math.cos(rotationY), '#dfe4e8', .02); frame.rotation.y = rotationY;
    return { canvas, texture };
  };
  box(10, .3, 10, 0, .05, 2.4, '#cfd6dc');                                    // floor
  box(10, 4.8, .25, 0, 2.5, -2.5, '#eef1f3');                                 // back wall
  for (const x of [-5, 5]) box(.25, 1.4, 10, x, .85, 2.4, '#9fb0bc');         // side walls
  box(4.4, .025, 3.6, 0, .22, 2.5, '#6f8a9c', .015);                           // carpet
  const payroll = canvasPlane(3.6, 2.2, 0, 3.05, -2.36);
  const ladder = canvasPlane(2.6, 1.8, -4.86, 2.2, 2.2, Math.PI / 2, 640);
  const poster = canvasPlane(1.6, 1.1, 4.86, 2.4, 1.6, -Math.PI / 2, 512);
  const jobs = canvasPlane(1.7, 1.7, 4.86, 2.2, 3.9, -Math.PI / 2, 512);
  box(4.4, 1, 1.1, 0, .74, -.65, '#4b5f73'); box(4.65, .16, 1.3, 0, 1.3, -.65, '#e9eef2');   // manager desk
  box(.62, .42, .05, -1.0, 1.62, -.75, '#1f2933', .02); box(.26, .18, .16, -1.0, 1.42, -.6, '#3a4653', .02); // monitor
  box(.5, .035, .32, 1.0, 1.41, -.5, '#fff9e6');                                                 // papers
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(.06, .05, .11, 12), new THREE.MeshStandardMaterial({ color: '#c94f3f' })); mug.position.set(1.5, 1.45, -.55); root.add(mug);
  for (const [x, z] of [[-3.4, 2.2], [3.4, 2.2]]) {                                            // workstations
    box(1.8, .08, .9, x, 1.05, z, '#e2e7eb', .02); for (const dx of [-.75, .75]) box(.08, 1.0, .08, x + dx, .55, z, '#aab4bd', .01);
    box(.7, .45, .05, x, 1.45, z - .3, '#1f2933', .02); box(.5, .03, .18, x, 1.1, z + .05, '#3a4653', .01);
    box(.6, .1, .6, x, .72, z + .9, '#59626c', .03); box(.6, .5, .1, x, 1.0, z + 1.15, '#59626c', .03);          // chair
  }
  box(.6, .65, .6, -4.2, .55, 5.6, '#a8865d'); const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 2), new THREE.MeshStandardMaterial({ color: '#5f9464', roughness: .8 })); leaves.scale.set(.8, 1.3, .8); leaves.position.set(-4.2, 1.5, 5.6); leaves.castShadow = true; root.add(leaves);
  const cooler = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .5, 14), new THREE.MeshStandardMaterial({ color: '#bfe3f2', transparent: true, opacity: .8 })); cooler.position.set(4.2, 1.35, 5.4); root.add(cooler); box(.5, 1.1, .5, 4.2, .55, 5.4, '#e9eef2', .03);
  box(2, .028, .85, 0, .23, 6.1, '#a9b6c0');                                                     // exit mat

  const draw = (canvas: HTMLCanvasElement, fn: (ink: CanvasRenderingContext2D) => void, texture: THREE.CanvasTexture) => { const ink = canvas.getContext?.('2d'); if (!ink) return; fn(ink); texture.needsUpdate = true; };
  draw(poster.canvas, ink => { ink.fillStyle = '#2f4f6f'; ink.fillRect(0, 0, 512, 352); ink.fillStyle = '#f5f0e4'; ink.font = '700 44px sans-serif'; ink.textAlign = 'center'; ink.fillText(tl('PAY YOURSELF FIRST','PÁGATE A TI PRIMERO'), 256, 150); ink.font = '400 26px sans-serif'; ink.fillText(tl('salary → reserve → investments → the rest','sueldo → reserva → inversiones → el resto'), 256, 210); }, poster.texture);
  const setBoard = (board: WorkBoard) => {
    draw(payroll.canvas, ink => {
      const W = payroll.canvas.width, H = payroll.canvas.height; ink.fillStyle = '#f7f4ec'; ink.fillRect(0, 0, W, H);
      ink.fillStyle = '#233b4d'; ink.fillRect(0, 0, W, 78); ink.fillStyle = '#f5f0e4'; ink.font = '700 34px sans-serif'; ink.textAlign = 'left'; ink.fillText(board.title, 28, 52);
      ink.font = '400 28px sans-serif'; let y = 130; const rows = board.lines.slice(0, 7);
      for (const line of rows) { ink.fillStyle = '#2a3944'; ink.textAlign = 'left'; ink.fillText(line.label.slice(0, 40), 28, y); ink.textAlign = 'right'; ink.fillStyle = line.amount.startsWith('-') ? '#a33c2f' : '#2a3944'; ink.fillText(line.amount, W - 28, y); y += 42; }
      ink.strokeStyle = '#233b4d'; ink.lineWidth = 3; ink.beginPath(); ink.moveTo(28, H - 74); ink.lineTo(W - 28, H - 74); ink.stroke();
      ink.font = '700 34px sans-serif'; ink.fillStyle = '#1f6f4a'; ink.textAlign = 'left'; ink.fillText(tl('TAKE-HOME','NETO'), 28, H - 26); ink.textAlign = 'right'; ink.fillText(board.net, W - 28, H - 26);
    }, payroll.texture);
    draw(ladder.canvas, ink => {
      const W = ladder.canvas.width, H = ladder.canvas.height; ink.fillStyle = '#eef1f3'; ink.fillRect(0, 0, W, H);
      ink.fillStyle = '#233b4d'; ink.font = '700 30px sans-serif'; ink.textAlign = 'left'; ink.fillText(tl('CAREER LADDER','ESCALERA DE CARRERA'), 24, 46);
      let y = 96; for (const rung of board.ladder.slice(0, 7)) {
        ink.fillStyle = rung.state === 'current' ? '#d9c18b' : rung.state === 'next' ? '#cfe3d6' : '#ffffff00'; if (rung.state === 'current' || rung.state === 'next') ink.fillRect(16, y - 30, W - 32, 40);
        ink.fillStyle = rung.state === 'later' ? '#8b98a3' : '#233b4d'; ink.font = `${rung.state === 'current' ? '700' : '400'} 24px sans-serif`; ink.textAlign = 'left'; ink.fillText(`${rung.state === 'done' ? '✓ ' : rung.state === 'current' ? '● ' : rung.state === 'next' ? '→ ' : '· '}${rung.title}`, 26, y);
        ink.textAlign = 'right'; ink.fillText(rung.salary, W - 26, y); y += 52;
      }
    }, ladder.texture);
    draw(jobs.canvas, ink => {
      const W = jobs.canvas.width, H = jobs.canvas.height; ink.fillStyle = '#e9dcc4'; ink.fillRect(0, 0, W, H);
      ink.fillStyle = '#233b4d'; ink.font = '700 34px sans-serif'; ink.textAlign = 'left'; ink.fillText(tl('JOB BOARD', 'BOLSA DE TRABAJO'), 24, 52);
      let y = 110; for (const job of board.jobs) { ink.fillStyle = '#2a3944'; ink.font = '400 26px sans-serif'; ink.textAlign = 'left'; ink.fillText(job.line.slice(0, 26), 24, y); ink.textAlign = 'right'; ink.fillText(job.salary, W - 24, y); ink.font = '400 20px sans-serif'; ink.fillStyle = '#5a6b78'; ink.textAlign = 'left'; ink.fillText(`${tl('future-proof', 'a prueba de futuro')} ${job.score}`, 24, y + 28); y += 78; }
    }, jobs.texture);
  };
  return { root, setBoard };
}
