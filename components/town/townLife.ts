import * as THREE from 'three';
import type { TownPoint } from './townWorld';

// Small signs of life that need no model download: pigeons pecking around the fountain that
// scatter when the player walks up, and bunting strung between the promenade lamp posts.

export type Pigeon = { home: TownPoint; position: THREE.Vector3; target: TownPoint; flying: boolean; progress: number; from: THREE.Vector3; peck: number; heading: number };
export const FLEE_DISTANCE = 2.1;
export const shouldFlee = (pigeon: Pick<Pigeon, 'position' | 'flying'>, player: TownPoint) => !pigeon.flying && Math.hypot(pigeon.position.x - player.x, pigeon.position.z - player.z) < FLEE_DISTANCE;
// Lands 5–8 m away on the far side from the player, kept inside the square so birds never sit in the road.
export function landingSpot(pigeon: Pick<Pigeon, 'position'>, player: TownPoint, random = Math.random): TownPoint {
  const away = Math.atan2(pigeon.position.z - player.z, pigeon.position.x - player.x) + (random() - .5) * 1.4;
  const distance = 5 + random() * 3;
  return { x: THREE.MathUtils.clamp(pigeon.position.x + Math.cos(away) * distance, -9, 9), z: THREE.MathUtils.clamp(pigeon.position.z + Math.sin(away) * distance, 8.6, 13.6) };
}

export function createTownLife(reducedMotion: boolean) {
  const root = new THREE.Group();
  const grey = new THREE.MeshStandardMaterial({ color: '#8d909a', roughness: .8 }), dark = new THREE.MeshStandardMaterial({ color: '#4d505a', roughness: .8 }), beak = new THREE.MeshStandardMaterial({ color: '#e0a44a' });
  const pigeons: (Pigeon & { root: THREE.Group; wings: THREE.Mesh[]; head: THREE.Mesh })[] = [];
  for (const [x, z] of [[-2.4, 9.4], [-1.6, 10.6], [1.9, 9.2], [2.6, 10.9], [.4, 13.4], [-3.4, 12.2], [3.6, 12.6]]) {
    const bird = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(.095, 10, 8), Math.random() < .3 ? dark : grey); body.scale.set(1, .8, 1.35); body.position.y = .09; body.castShadow = true; bird.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), body.material); head.position.set(0, .17, .11); bird.add(head);
    const bill = new THREE.Mesh(new THREE.ConeGeometry(.014, .045, 6), beak); bill.rotation.x = Math.PI / 2; bill.position.set(0, .165, .16); bird.add(bill);
    const wings = [-1, 1].map(side => { const wing = new THREE.Mesh(new THREE.BoxGeometry(.13, .012, .11), body.material); wing.position.set(side * .09, .12, 0); bird.add(wing); return wing; });
    bird.position.set(x, .22, z); bird.rotation.y = Math.random() * Math.PI * 2; root.add(bird);
    pigeons.push({ root: bird, wings, head, home: { x, z }, position: bird.position, target: { x, z }, flying: false, progress: 0, from: bird.position.clone(), peck: Math.random() * 10, heading: bird.rotation.y });
  }
  // Bunting: three sagging strings between the lamp posts with waving pennants.
  const bunting = new THREE.Group(); root.add(bunting);
  const pennants: { mesh: THREE.Mesh; phase: number }[] = [];
  const stringMaterial = new THREE.LineBasicMaterial({ color: '#4f5d63' }), colours = ['#e2544f', '#f0c65a', '#5aa0d8', '#efeee6', '#6bbf8a'];
  const pennant = new THREE.BufferGeometry(); pennant.setAttribute('position', new THREE.Float32BufferAttribute([-.14, 0, 0, .14, 0, 0, 0, -.32, 0], 3)); pennant.computeVertexNormals();
  for (const [a, b] of [[-14, -7], [-7, 7], [7, 14]]) {
    const points: THREE.Vector3[] = []; const span = b - a;
    for (let i = 0; i <= 24; i++) { const t = i / 24; points.push(new THREE.Vector3(a + span * t, 3.92 - Math.sin(t * Math.PI) * (span > 10 ? .75 : .45), 5.9)); }
    bunting.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), stringMaterial));
    const count = span > 10 ? 14 : 8;
    for (let i = 1; i < count; i++) {
      const t = i / count; const sag = Math.sin(t * Math.PI) * (span > 10 ? .75 : .45);
      const flag = new THREE.Mesh(pennant, new THREE.MeshStandardMaterial({ color: colours[(i + (a < 0 ? 0 : 2)) % colours.length], side: THREE.DoubleSide, roughness: .8 }));
      flag.position.set(a + span * t, 3.92 - sag, 5.9); bunting.add(flag); pennants.push({ mesh: flag, phase: i * .9 + a });
    }
  }
  function update(dt: number, elapsed: number, player: TownPoint, visible: boolean) {
    root.visible = visible; if (!visible) return;
    for (const pennant of pennants) pennant.mesh.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 2.4 + pennant.phase) * .55 + Math.sin(elapsed * 5.1 + pennant.phase * 1.7) * .12;
    for (const pigeon of pigeons) {
      if (reducedMotion) continue;
      if (shouldFlee(pigeon, player)) { pigeon.flying = true; pigeon.progress = 0; pigeon.from.copy(pigeon.position); pigeon.target = landingSpot(pigeon, player); pigeon.heading = Math.atan2(pigeon.target.x - pigeon.position.x, pigeon.target.z - pigeon.position.z); }
      if (pigeon.flying) {
        pigeon.progress = Math.min(1, pigeon.progress + dt / 1.9);
        const t = pigeon.progress, ease = t * t * (3 - 2 * t);
        pigeon.position.set(pigeon.from.x + (pigeon.target.x - pigeon.from.x) * ease, .22 + Math.sin(t * Math.PI) * 2.6, pigeon.from.z + (pigeon.target.z - pigeon.from.z) * ease);
        pigeon.root.rotation.y = pigeon.heading; pigeon.root.rotation.x = -.35 * Math.sin(t * Math.PI * 2);
        for (const [i, wing] of pigeon.wings.entries()) wing.rotation.z = (i ? -1 : 1) * Math.sin(elapsed * 34) * .9;
        if (t >= 1) { pigeon.flying = false; pigeon.root.rotation.x = 0; for (const wing of pigeon.wings) wing.rotation.z = 0; pigeon.home = { ...pigeon.target }; }
        continue;
      }
      // Grounded: slow waddle around the home spot with a bobbing peck.
      pigeon.peck += dt;
      const wander = Math.sin(pigeon.peck * .5) * .35;
      pigeon.position.x = pigeon.home.x + Math.cos(pigeon.heading) * wander; pigeon.position.z = pigeon.home.z + Math.sin(pigeon.heading) * wander;
      pigeon.head.position.y = .17 - Math.max(0, Math.sin(pigeon.peck * 6)) * .07;
      pigeon.root.rotation.y += Math.sin(pigeon.peck * .9) * dt * .4;
    }
  }
  return { root, pigeons, update };
}
