import * as THREE from 'three';
import type { Daylight } from './townDaylight';

// Outdoor light rig for the square. Three pieces work together:
// - a gradient sky dome the player can see over the rooftops and at the horizon,
// - the same sky captured into the environment map, so fill light and reflections come from a
//   blue sky above and a warm ground below instead of a grey indoor studio,
// - soft contact shadows under people and vehicles, so figures sit on the pavement on every
//   graphics tier (the Smooth tier has no shadow map at all).
// Interiors keep the studio environment and their established balance (createTownScene).

// Balance of the lights against the daylight model. Outdoors the sun is the key light, the sky
// environment is the fill and the hemisphere light only adds a little ground bounce; the old rig
// ran the hemisphere at roughly half the sun, which is what flattened every shape. Interiors keep
// their established balance; interiorExposure only compensates for the tone-mapping change.
// Neutral tone mapping has no hidden exposure boost (the old ACES curve lifted input about 1.7x),
// so the night gets its own lift to stay readable under the lamps.
export const LIGHT_BALANCE = { sun: 1.0, hemi: .28, environment: 1.0, exposure: .92, nightHemi: 2.4, nightEnvironment: .6, nightExposure: 1.9, interiorExposure: 1 };

export type SkyColors = { zenith: string; horizon: string; ground: string; sun: string; sunGlow: number };

// Linear-space colour difference used to decide when the captured sky is stale.
export const skyDistance = (a: SkyColors, b: SkyColors) => {
  const c = new THREE.Color(), d = new THREE.Color();
  let sum = Math.abs(a.sunGlow - b.sunGlow);
  for (const key of ['zenith', 'horizon', 'ground', 'sun'] as const) { c.set(a[key]); d.set(b[key]); sum += Math.abs(c.r - d.r) + Math.abs(c.g - d.g) + Math.abs(c.b - d.b); }
  return sum;
};

// Sky colours for a daylight sample. The horizon is the fog colour, so distant buildings melt into
// the sky rather than into a flat backdrop.
export const skyColors = (light: Daylight): SkyColors => ({ zenith: light.zenith, horizon: light.background, ground: light.bounce, sun: light.sunColor, sunGlow: light.night ? 0 : THREE.MathUtils.clamp(light.elevation * 3 + .35, 0, 1) });

// Outdoor intensities for a daylight sample. Kept pure so the balance is testable without WebGL.
export function outdoorLighting(light: Daylight) {
  const b = LIGHT_BALANCE;
  return {
    sun: light.sunIntensity * b.sun,
    // At night the captured sky is nearly black, so the moonlit hemisphere carries the fill again.
    hemi: light.skyIntensity * THREE.MathUtils.lerp(b.hemi, b.nightHemi, light.darkness),
    environment: THREE.MathUtils.lerp(b.environment, b.nightEnvironment, light.darkness) * THREE.MathUtils.clamp(.25 + light.ambient * 2.6, .15, 1),
    exposure: Number(light.exposure) * b.exposure * THREE.MathUtils.lerp(1, b.nightExposure, light.darkness),
  };
}

const SKY_VERTEX = `
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAGMENT = `
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunColor; uniform vec3 sunDirection; uniform float sunGlow;
varying vec3 vDirection;
void main() {
  vec3 d = normalize(vDirection);
  float up = max(d.y, 0.0), down = max(-d.y, 0.0);
  vec3 colour = mix(horizon, zenith, pow(up, .55));
  colour = mix(colour, ground, smoothstep(0.0, .18, down));
  float facing = max(dot(d, sunDirection), 0.0);
  colour += sunColor * sunGlow * (pow(facing, 6.0) * .22 + pow(facing, 60.0) * .45 + smoothstep(.9985, .9995, facing) * 2.5);
  gl_FragColor = vec4(colour, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function skyMaterial() {
  return new THREE.ShaderMaterial({
    name: 'townSky', vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, ground: { value: new THREE.Color() }, sunColor: { value: new THREE.Color() }, sunDirection: { value: new THREE.Vector3(0, 1, 0) }, sunGlow: { value: 0 } },
  });
}
const applySky = (material: THREE.ShaderMaterial, sky: SkyColors, sun: THREE.Vector3) => {
  const u = material.uniforms;
  (u.zenith.value as THREE.Color).set(sky.zenith); (u.horizon.value as THREE.Color).set(sky.horizon); (u.ground.value as THREE.Color).set(sky.ground); (u.sunColor.value as THREE.Color).set(sky.sun);
  (u.sunDirection.value as THREE.Vector3).copy(sun).normalize(); u.sunGlow.value = sky.sunGlow;
};

// The visible dome. It follows the camera so it never clips, and renders before everything else.
export function createSkyDome() {
  const material = skyMaterial();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(110, 32, 16), material);
  dome.name = 'Sky dome'; dome.frustumCulled = false; dome.renderOrder = -1000; dome.matrixAutoUpdate = true;
  return {
    root: dome,
    update(sky: SkyColors, sun: THREE.Vector3, camera: THREE.Camera) { applySky(material, sky, sun); dome.position.copy(camera.position); },
    dispose() { dome.geometry.dispose(); material.dispose(); },
  };
}

// The same sky captured into a prefiltered environment map. Captures are small (128px) and only
// repeat when the sky has visibly changed, at most twice a second, so a ten-minute day costs a
// handful of captures instead of one per frame.
export function createSkyEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene(), material = skyMaterial();
  material.toneMapped = false;
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), material));
  let target: THREE.WebGLRenderTarget | undefined, last: SkyColors | undefined, lastAt = -Infinity;
  return {
    // Returns the current environment texture, recapturing first when the sky is stale.
    update(sky: SkyColors, sun: THREE.Vector3, now: number, force = false) {
      const stale = !last || skyDistance(sky, last) > .035;
      if (target && !force && (!stale || now - lastAt < .5)) return target.texture;
      applySky(material, sky, sun);
      const next = pmrem.fromScene(scene, 0, .1, 100, { size: 128 });
      target?.dispose(); target = next; last = { ...sky }; lastAt = now;
      return target.texture;
    },
    dispose() { target?.dispose(); material.dispose(); scene.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); }); pmrem.dispose(); },
  };
}

// Soft contact shadow: a radial fade laid on the ground. One texture is shared by every shadow;
// it is an alpha map, which three reads from the green channel, so the fade is painted in grey.
let contactTexture: THREE.CanvasTexture | undefined;
const contactMap = () => {
  if (contactTexture) return contactTexture;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(.45, '#9e9e9e'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); }
  contactTexture = new THREE.CanvasTexture(canvas);
  return contactTexture;
};
export const CONTACT_SHADOW_NAME = 'ContactShadow';
export function createContactShadow(width: number, depth: number, opacity: number, y = .02) {
  const material = new THREE.MeshBasicMaterial({ color: '#10140f', alphaMap: contactMap(), transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.name = CONTACT_SHADOW_NAME; mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.renderOrder = 1; mesh.castShadow = false; mesh.receiveShadow = false;
  return mesh;
}
