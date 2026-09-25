import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { daylight } from '../components/town/townDaylight';
import { outdoorLighting, skyColors, skyDistance, createContactShadow, CONTACT_SHADOW_NAME, LIGHT_BALANCE } from '../components/town/townLighting';

const warmth = (hex: string) => { const c = new THREE.Color(hex); return c.r - c.b; };

describe('outdoor light rig', () => {
  it('keys the square with the sun and keeps the fill well below it by day', () => {
    const noon = outdoorLighting(daylight(.25));
    expect(noon.sun).toBeGreaterThan(3);
    expect(noon.sun / noon.hemi).toBeGreaterThan(5);   // the old rig ran about 2:1, which flattened every shape
    expect(noon.environment).toBeGreaterThan(.5);
  });
  it('lights midday from the side of the default camera so shadows fall across the square', () => {
    const noon = daylight(.25);
    expect(noon.sun.x).toBeGreaterThan(8);
    expect(Math.atan2(noon.sun.y, Math.hypot(noon.sun.x, noon.sun.z))).toBeLessThan(1);   // below ~57 degrees
  });
  it('warms the late afternoon well before sunset', () => {
    expect(warmth(daylight(.44).sunColor)).toBeGreaterThan(warmth(daylight(.25).sunColor));
    expect(warmth(daylight(.44).background)).toBeGreaterThan(warmth(daylight(.25).background));
  });
  it('keeps the night readable: moonlit fill and an exposure lift under the lamps', () => {
    const noon = outdoorLighting(daylight(.25)), night = outdoorLighting(daylight(.75));
    expect(night.hemi).toBeGreaterThan(noon.hemi);
    expect(night.exposure).toBeGreaterThan(noon.exposure);
    expect(night.sun).toBeLessThan(.5);
    expect(LIGHT_BALANCE.nightExposure).toBeGreaterThan(1);
  });
  it('builds the sky from the fog colour at the horizon and a deeper colour overhead', () => {
    const noon = daylight(.25), sky = skyColors(noon);
    expect(sky.horizon).toBe(noon.background);
    expect(sky.zenith).not.toBe(sky.horizon);
    expect(sky.sunGlow).toBeGreaterThan(0);
    expect(skyColors(daylight(.75)).sunGlow).toBe(0);
  });
  it('recaptures the sky only when it has visibly changed', () => {
    const noon = skyColors(daylight(.25));
    expect(skyDistance(noon, { ...noon })).toBe(0);
    expect(skyDistance(noon, skyColors(daylight(.2501)))).toBeLessThan(.035);
    expect(skyDistance(noon, skyColors(daylight(.48)))).toBeGreaterThan(.035);
    expect(skyDistance(noon, skyColors(daylight(.25, true)))).toBeGreaterThan(.035);
  });
  it('makes contact shadows that sit on the ground without casting or writing depth', () => {
    const shadow = createContactShadow(1, 1, .5);
    expect(shadow.name).toBe(CONTACT_SHADOW_NAME);
    expect(shadow.castShadow).toBe(false);
    const material = shadow.material as THREE.MeshBasicMaterial;
    expect(material.transparent).toBe(true); expect(material.depthWrite).toBe(false); expect(material.opacity).toBe(.5);
    expect(shadow.rotation.x).toBeCloseTo(-Math.PI / 2);
  });
});
