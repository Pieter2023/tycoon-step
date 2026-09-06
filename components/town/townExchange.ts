import * as THREE from 'three';
import { tl } from '../../i18n/town';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { TownPoint } from './townWorld';

// Trading floor laid out like the bank: back wall at the top, broker desk in front of it, a
// clear aisle to the exit at the bottom. Trader desks sit against the side walls.
export const clampExchangePoint = (p: TownPoint): TownPoint => ({ x: Math.max(-2.4, Math.min(2.4, p.x)), z: Math.max(.4, Math.min(6.4, p.z)) });
export const exchangeSpot = (p: TownPoint): 'broker' | 'exit' | null =>
  Math.hypot(p.x, p.z - .75) < 1.1 ? 'broker' : Math.hypot(p.x, p.z - 6.1) < .85 ? 'exit' : null;

export type TickerRow = { name: string; price: number; changePct: number | null; held: number };
export type ExchangeBoard = { rows: TickerRow[]; index: number[]; mood: string; headline: string; changePct: number | null };

export function createTownExchange() {
  const root = new THREE.Group();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, radius = .05) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), new THREE.MeshStandardMaterial({ color, roughness: .6 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  };
  const screen = (width: number, height: number, x: number, y: number, z: number, rotationY = 0) => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
    mesh.position.set(x, y, z); mesh.rotation.y = rotationY; root.add(mesh);
    box(width + .16, height + .16, .06, x, y, z - .035 * Math.cos(rotationY), '#1b2730', .02).rotation.y = rotationY;
    return { canvas, texture, mesh };
  };
  box(10, .3, 10, 0, .05, 2.4, '#2f3d4a');                                   // floor
  box(10, 4.8, .25, 0, 2.5, -2.5, '#26343f');                                // back wall
  for (const x of [-5, 5]) box(.25, 1.4, 10, x, .85, 2.4, '#3a4d5b');        // low side walls
  box(4.4, .025, 3.6, 0, .22, 2.5, '#3e5a72', .015);                          // aisle rug
  const ticker = screen(7.2, 1.8, 0, 3.55, -2.36);
  const leftChart = screen(2.4, 1.3, -4.86, 2.1, 1.2, Math.PI / 2), rightChart = screen(2.4, 1.3, 4.86, 2.1, 3.6, -Math.PI / 2);
  box(4.6, 1, 1.1, 0, .74, -.65, '#4a6072'); box(4.85, .16, 1.3, 0, 1.3, -.65, '#d9c7a5');   // broker desk
  box(.58, .38, .08, .9, 1.6, -.65, '#101a22'); box(.1, .18, .1, .9, 1.4, -.65, '#101a22');     // desk monitor
  box(.5, .035, .3, -.9, 1.41, -.4, '#fff1cf');                                                  // paperwork
  for (const [x, z] of [[-3.8, 1.6], [-3.8, 4.2], [3.8, 1.6], [3.8, 4.2]]) {                     // trader desks
    box(1.5, .9, 1.1, x, .66, z, '#4a6072'); box(1.6, .12, 1.2, x, 1.16, z, '#d9c7a5');
    box(.5, .34, .06, x + (x < 0 ? .1 : -.1), 1.5, z, '#101a22'); box(.08, .16, .08, x + (x < 0 ? .1 : -.1), 1.25, z, '#101a22');
  }
  for (const x of [-4.2, 4.2]) {                                                                 // plants by the exit
    box(.6, .65, .6, x, .55, 5.6, '#7a5b3c');
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 2), new THREE.MeshStandardMaterial({ color: '#4f8a5f', roughness: .8 }));
    leaves.scale.set(.8, 1.3, .8); leaves.position.set(x, 1.55, 5.6); leaves.castShadow = true; root.add(leaves);
  }
  box(2, .028, .85, 0, .23, 6.1, '#9fb2c2');
  const exitLabel = document.createElement('canvas'); exitLabel.width = 512; exitLabel.height = 128;
  const exitInk = exitLabel.getContext('2d')!; exitInk.fillStyle = '#26343f'; exitInk.fillRect(0, 0, 512, 128); exitInk.fillStyle = '#e9d9b6'; exitInk.font = '600 60px sans-serif'; exitInk.textAlign = 'center'; exitInk.fillText('CITY  →', 256, 84);
  const exitTexture = new THREE.CanvasTexture(exitLabel); exitTexture.colorSpace = THREE.SRGBColorSpace;
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .375), new THREE.MeshBasicMaterial({ map: exitTexture })); exit.rotation.x = -Math.PI / 2; exit.position.set(0, .26, 6.1); root.add(exit);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.35, .4, 40), new THREE.MeshBasicMaterial({ color: '#f3d491', side: THREE.DoubleSide }));
  halo.rotation.x = -Math.PI / 2; halo.position.set(0, .253, .75); root.add(halo);
  for (const x of [-1.7, 1.7]) {                                                                 // pendant lights
    box(.025, .8, .025, x, 4.2, .2, '#655f46');
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffe4a6', emissive: '#ffbf66', emissiveIntensity: .5 })); bulb.position.set(x, 3.75, .2); root.add(bulb);
  }
  root.visible = false;
  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
  function drawTicker(board: ExchangeBoard) {
    const c = ticker.canvas, ctx = c.getContext('2d')!; ctx.fillStyle = '#0f1a22'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#1d2f3a'; ctx.fillRect(0, 0, c.width, 60);
    ctx.fillStyle = '#f2d99a'; ctx.font = '600 34px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${tl('MARKET','MERCADO')} · ${board.mood.toUpperCase()}`, 28, 42);
    ctx.fillStyle = '#c9d6dd'; ctx.font = '28px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`INDEX ${board.index.length ? board.index[board.index.length - 1].toFixed(1) : '100.0'}${board.changePct === null ? '' : `  ${board.changePct >= 0 ? '▲' : '▼'} ${Math.abs(board.changePct)}% · 12 ${tl('MO','MESES')}`}`, c.width - 28, 42);
    board.rows.forEach((row, i) => {
      const y = 112 + i * 62; ctx.textAlign = 'left'; ctx.fillStyle = '#eef3f5'; ctx.font = '600 34px sans-serif'; ctx.fillText(row.name.toUpperCase(), 28, y);
      ctx.textAlign = 'right'; ctx.fillText(money(row.price), 640, y);
      const up = (row.changePct ?? 0) >= 0; ctx.fillStyle = row.changePct === null ? '#9fb2c2' : up ? '#6fd39a' : '#ef7d72';
      ctx.fillText(row.changePct === null ? '—' : `${up ? '▲' : '▼'} ${Math.abs(row.changePct)}%`, 820, y);
      ctx.fillStyle = '#9fb2c2'; ctx.font = '26px sans-serif'; ctx.fillText(row.held ? `${row.held} ${tl('held','en cartera')}` : tl('not held','sin posición'), c.width - 28, y);
    });
    ticker.texture.needsUpdate = true;
  }
  function drawChart(target: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }, board: ExchangeBoard) {
    const c = target.canvas, ctx = c.getContext('2d')!; ctx.fillStyle = '#0f1a22'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#c9d6dd'; ctx.font = '600 44px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(tl('TEACHING INDEX · 3 YEARS','ÍNDICE DIDÁCTICO · 3 AÑOS'), 30, 66);
    const values = board.index.length > 1 ? board.index : [100, 100];
    const min = Math.min(...values) * .98, max = Math.max(...values) * 1.02, x0 = 30, y0 = 100, w = c.width - 60, h = c.height - 140;
    ctx.strokeStyle = '#28414f'; ctx.lineWidth = 2; for (let i = 0; i <= 4; i++) { const y = y0 + h * i / 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke(); }
    const up = values[values.length - 1] >= values[0];
    ctx.strokeStyle = up ? '#6fd39a' : '#ef7d72'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.beginPath();
    values.forEach((v, i) => { const x = x0 + w * i / (values.length - 1), y = y0 + h * (1 - (v - min) / (max - min || 1)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = '#f2d99a'; ctx.font = '600 40px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(board.headline, c.width - 30, c.height - 30);
    target.texture.needsUpdate = true;
  }
  return { root, setBoard(board: ExchangeBoard) { drawTicker(board); drawChart(leftChart, board); drawChart(rightChart, board); } };
}
