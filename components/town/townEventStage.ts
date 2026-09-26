import * as THREE from 'three';
import type { EventPlace } from '../../services/townEvents';

// Events happen in the world (Phase 1 polish on slice 3): while a life event waits, the city stages it where it
// happens. A bobbing badge and a pulsing ring on the pavement mark the place; tax and legal mail lies on the
// townhouse doorstep as a letter; car trouble blinks the parked car's hazard lights. The card, its choice and its
// outcome are unchanged (services/townEvents.ts picks the place from the event's category).

type Spot = { badge: [number, number, number]; ring: [number, number] };
/** Where each place is staged: the badge floats above the spot, the ring lies on the walkable pavement in front. */
export const EVENT_STAGE: Record<EventPlace, Spot> = {
  garage: { badge: [-14.7, 2.3, 9.5], ring: [-14.2, 8.0] },   // above the car in the bay by the townhouse
  home: { badge: [-15.9, 3.0, 7.4], ring: [-15.7, 7.4] },     // over 12 Square St's door
  doormat: { badge: [-15.9, 2.4, 7.4], ring: [-15.7, 7.4] },  // the letter lies on the doorstep
  work: { badge: [15.9, 3.0, 7.4], ring: [15.7, 7.4] },       // over the Main St Offices door
  exchange: { badge: [-3.5, 3.4, -1.6], ring: [-3.5, -1.1] },
  business: { badge: [3.5, 3.4, -1.6], ring: [3.5, -1.1] },
  bank: { badge: [-10.5, 3.4, -1.6], ring: [-10.5, -1.1] },
  square: { badge: [0, 3.6, 12], ring: [0, 9.8] },            // over the fountain; the ring at the pavement's edge
  rosa: { badge: [-6, 2.4, 7.1], ring: [-6, 7.9] },            // Rosa on the west bench
};
/** The letter on the doorstep of 12 Square St (the step's top is at y .32). */
export const DOORSTEP_LETTER: [number, number, number] = [-16.02, .335, 7.25];

const HAZARD = new THREE.Color('#ff9a1f');

export function createEventStage(reducedMotion: boolean) {
  const root = new THREE.Group(); root.name = 'event-stage'; root.visible = false;
  // The badge: an amber disc with an exclamation mark, always drawn on top like the city's speech bubbles.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ink = canvas.getContext?.('2d');
  if (ink) {
    ink.fillStyle = '#233b33'; ink.beginPath(); ink.arc(64, 64, 60, 0, Math.PI * 2); ink.fill();
    ink.fillStyle = '#f2b441'; ink.beginPath(); ink.arc(64, 64, 52, 0, Math.PI * 2); ink.fill();
    ink.fillStyle = '#233b33'; ink.font = '800 84px sans-serif'; ink.textAlign = 'center'; ink.textBaseline = 'middle'; ink.fillText('!', 64, 70);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  // A constant size on screen (about a tenth of the view's height at the city's 40° lens), so a marker across the
  // square reads as well as one close by.
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, sizeAttenuation: false }));
  badge.scale.set(.075, .075, 1); badge.renderOrder = 10; root.add(badge);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#f2b441', transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .72, 40), ringMaterial); ring.rotation.x = -Math.PI / 2; root.add(ring);
  // The letter: a cream envelope with its flap and a red seal, lying flat on the doorstep.
  const letter = new THREE.Group(); letter.name = 'event-letter';
  const paper = new THREE.MeshStandardMaterial({ color: '#f4ecd8', roughness: .9 });
  const envelope = new THREE.Mesh(new THREE.BoxGeometry(.42, .015, .28), paper); letter.add(envelope);
  const flap = new THREE.Mesh(new THREE.CircleGeometry(.15, 3), new THREE.MeshStandardMaterial({ color: '#e6dcc2', roughness: .9, side: THREE.DoubleSide }));
  flap.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); flap.scale.set(1, 1.4, 1); flap.position.set(.02, .009, 0); letter.add(flap);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .012, 16), new THREE.MeshStandardMaterial({ color: '#b3322b', roughness: .5 }));
  seal.position.set(.08, .012, 0); letter.add(seal);
  letter.position.set(...DOORSTEP_LETTER); letter.rotation.y = .25; letter.visible = false; root.add(letter);

  let place: EventPlace | null = null;
  // The parked car's head and tail lamps, with the glow each had before, so clearing the stage puts it back.
  let hazards: { m: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number }[] = [];
  const restore = () => { for (const h of hazards) { h.m.emissive.copy(h.color); h.m.emissiveIntensity = h.intensity; } hazards = []; };

  return {
    root,
    get place() { return place; },
    /** Stage a waiting event at its place, or clear the stage with null. `carLamps` are the parked car's head and tail lamp materials. */
    set(next: EventPlace | null, carLamps: THREE.MeshStandardMaterial[] = []) {
      restore();
      place = next;
      root.visible = next !== null;
      if (!next) return;
      const spot = EVENT_STAGE[next];
      badge.position.set(...spot.badge);
      ring.position.set(spot.ring[0], .245, spot.ring[1]);
      letter.visible = next === 'doormat';
      if (next === 'garage') hazards = carLamps.map(m => ({ m, color: m.emissive.clone(), intensity: m.emissiveIntensity }));
    },
    update(elapsed: number) {
      if (!place) return;
      const spot = EVENT_STAGE[place];
      if (!reducedMotion) {
        badge.position.y = spot.badge[1] + Math.sin(elapsed * 2.4) * .12;
        const pulse = (elapsed * .8) % 1;
        ring.scale.setScalar(1 + pulse * .45); ringMaterial.opacity = .8 * (1 - pulse);
      }
      // Hazard lights: on half of every second, steady under reduced motion.
      const on = reducedMotion || Math.floor(elapsed * 2) % 2 === 0;
      for (const h of hazards) { h.m.emissive.copy(HAZARD); h.m.emissiveIntensity = on ? 2.2 : 0; }
    },
  };
}
