import * as THREE from 'three';
import { TOWN_PLACES, type TownPlaceId } from './townWorld';
import type { WindowDisplay } from '../../services/townWealth';

// A lit display in the shop window beside each Main Street door, showing the player's own money there:
// savings at the bank, the portfolio at the Exchange, businesses, properties. Facades sit at z -2.2.
export const WINDOW_OFFSET = { x: 1.5, y: 1.55, z: -2.14 };
export function createWindowDisplays() {
  const root = new THREE.Group(); root.name = 'WindowDisplays';
  const panels = new Map<TownPlaceId, { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; material: THREE.MeshStandardMaterial; last: string }>();
  for (const place of TOWN_PLACES) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 320;
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
    const material = new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: '#ffffff', emissiveIntensity: .2, roughness: .55 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .69), material);
    mesh.position.set(place.x + WINDOW_OFFSET.x, WINDOW_OFFSET.y, WINDOW_OFFSET.z); mesh.name = `Window_${place.id}`; root.add(mesh);
    panels.set(place.id, { canvas, texture, material, last: '' });
  }
  function draw(rows: Record<TownPlaceId, WindowDisplay>) {
    for (const [id, panel] of panels) {
      const row = rows[id]; if (!row) continue;
      const key = JSON.stringify(row); if (key === panel.last) continue; panel.last = key;
      const ctx = panel.canvas.getContext('2d')!; const w = panel.canvas.width, h = panel.canvas.height;
      ctx.fillStyle = row.lit ? '#163c35' : '#2b3534'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = row.lit ? '#e6c476' : '#6d7a74'; ctx.lineWidth = 10; ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = row.lit ? '#f1d38c' : '#a9b5ae'; ctx.font = '600 38px system-ui, sans-serif'; ctx.fillText(row.title, w / 2, 70, w - 60);
      ctx.fillStyle = row.lit ? '#ffffff' : '#c9d2cd'; ctx.font = '700 78px system-ui, sans-serif'; ctx.fillText(row.value, w / 2, 160, w - 60);
      ctx.fillStyle = row.lit ? '#bfe3c9' : '#9aa7a0'; ctx.font = '500 32px system-ui, sans-serif'; ctx.fillText(row.note, w / 2, 245, w - 60);
      panel.texture.needsUpdate = true; panel.material.emissiveIntensity = row.lit ? .45 : .12;
    }
  }
  return { root, draw };
}
