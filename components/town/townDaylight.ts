import * as THREE from 'three';

// A full day passes in ten real minutes while the city is open. Each month opens at a slightly
// different hour so advancing time changes the light, and sunset arrives a few minutes into play.
export const DAY_SECONDS = 600;
export const openingPhase = (month: number) => .08 + (Math.max(0, month) % 5) * .06;
export const dayPhase = (month: number, elapsed: number, reducedMotion = false) => reducedMotion ? .2 : (openingPhase(month) + elapsed / DAY_SECONDS) % 1;

// zenith is the sky overhead and background the horizon (also the fog colour); bounce is the warm
// light thrown back up by the pavement, used for the lower half of the captured sky.
export type Daylight = { elevation: number; darkness: number; sun: THREE.Vector3; sunIntensity: number; sunColor: string; sky: string; ground: string; skyIntensity: number; ambient: number; background: string; zenith: string; bounce: string; exposure: string | number; lamps: number; windows: number; label: 'MORNING' | 'MIDDAY' | 'EVENING' | 'NIGHT'; night: boolean };

const lerpColor = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), THREE.MathUtils.clamp(t, 0, 1)).getHexString();

// phase 0 = sunrise, .25 = noon, .5 = sunset, .75 = midnight.
export function daylight(phase: number, rainy = false): Daylight {
  const angle = phase * Math.PI * 2, elevation = Math.sin(angle);
  const day = THREE.MathUtils.clamp(elevation * 2.2, 0, 1);               // 1 by mid-morning
  const dusk = THREE.MathUtils.clamp(1 - Math.abs(elevation) * 3.5, 0, 1); // peaks at the horizon
  const night = 1 - THREE.MathUtils.clamp((elevation + .25) * 2.5, 0, 1);  // 1 well below the horizon
  // Golden hour: warmth builds through the last part of the sun's climb and descent, so the
  // late afternoon reads warm well before the sun touches the rooftops.
  const golden = elevation > 0 ? THREE.MathUtils.clamp(1 - elevation * 1.6, 0, 1) * (rainy ? .3 : 1) : 1;
  // The sun's path is offset to the south-east and peaks near 52 degrees, so at midday it lights
  // the square from the side of the default camera instead of from behind it: shadows fall
  // diagonally where the player can see them, and building fronts and side walls separate.
  const sun = new THREE.Vector3(Math.cos(angle) * 34 + 12, Math.max(2.5, elevation * 24), 14);
  const sunColor = lerpColor(lerpColor(lerpColor('#fff3de', '#ffd39a', golden * .8), '#ffa968', dusk), '#8ea0c8', night);
  const daySky = rainy ? '#adbec7' : '#bdd7e4';
  const background = lerpColor(lerpColor(lerpColor(daySky, '#f1cfa6', golden * .55), '#e8a878', dusk * .8), '#18223a', night);
  const zenith = lerpColor(lerpColor(lerpColor(rainy ? '#8a9ba6' : '#5d9ad0', '#8e9cc0', golden * .55), '#5f6499', dusk * .8), '#0b1430', night);
  return {
    elevation, darkness: night, sun, sunIntensity: rainy ? .5 + day * 1.1 : .15 + day * 3.15, sunColor, zenith,
    bounce: lerpColor(lerpColor('#958e7a', '#a57e5e', golden * .7), '#11151c', night),
    sky: lerpColor(lerpColor('#fff4df', '#ffcaa0', dusk), '#4a5d8c', night), ground: lerpColor('#687b85', '#1d2430', night),
    skyIntensity: .55 + day * 1.15, ambient: .05 + day * .27,
    background, exposure: 1.08 - night * .22,
    lamps: elevation < .18 ? THREE.MathUtils.clamp((.18 - elevation) * 6, 0, 1) : 0,
    windows: elevation < .12 ? THREE.MathUtils.clamp((.12 - elevation) * 5, 0, 1) : 0,
    label: elevation > .6 ? 'MIDDAY' : elevation > .05 ? (phase < .25 ? 'MORNING' : 'EVENING') : elevation > -.15 ? (phase < .5 ? 'MORNING' : 'EVENING') : 'NIGHT',
    night: night > .5,
  };
}

// Street lamps: warm point lights plus a soft glow sprite, hidden by day.
export function createStreetLamps(positions: { x: number; z: number }[]) {
  const root = new THREE.Group();
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d')!; const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64); gradient.addColorStop(0, 'rgba(255,224,160,.95)'); gradient.addColorStop(.35, 'rgba(255,200,120,.35)'); gradient.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const lights: THREE.PointLight[] = [], glows: THREE.Sprite[] = [];
  for (const { x, z } of positions) {
    const light = new THREE.PointLight('#ffd6a0', 0, 11, 1.6); light.position.set(x, 3.7, z); root.add(light); lights.push(light);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0, depthWrite: false })); glow.scale.set(2.2, 2.2, 1); glow.position.set(x, 3.75, z); root.add(glow); glows.push(glow);
  }
  return { root, set(level: number) { for (const light of lights) light.intensity = level * 9; for (const glow of glows) (glow.material as THREE.SpriteMaterial).opacity = level * .9; } };
}
