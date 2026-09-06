import * as THREE from 'three';

// Seasons follow the game month (month 1 = January): winter tints the ground white and snows,
// autumn turns the canopies and drops leaves, spring and summer keep the base palette. Colours
// are applied to the merged city materials by name, so the Blender model needs no changes.
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export const seasonFor = (month: number): Season => { const m = ((Math.max(1, Math.round(month)) - 1) % 12) + 1; return m <= 2 || m === 12 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn'; };
export const SEASON_LABEL: Record<Season, string> = { winter: 'WINTER', spring: 'SPRING', summer: 'SUMMER', autumn: 'AUTUMN' };

const BASE: Record<string, string> = { grass: '#5c7d4a', leaf: '#386b36', leafLight: '#619240', leafGold: '#a1a845', paving: '#bdb397', flower: '#e06375' };
const SEASON_COLOURS: Record<Season, Record<string, string>> = {
  winter: { grass: '#e6ebee', leaf: '#5e7d63', leafLight: '#8aa591', leafGold: '#a9b39a', paving: '#d9dde0', flower: '#c9c2c6' },
  spring: { grass: '#6d9455', leaf: '#4c8a45', leafLight: '#7fb457', leafGold: '#b7c25a', paving: '#bdb397', flower: '#f07a92' },
  summer: { grass: '#5c7d4a', leaf: '#386b36', leafLight: '#619240', leafGold: '#a1a845', paving: '#bdb397', flower: '#e06375' },
  autumn: { grass: '#8a8a45', leaf: '#b8642f', leafLight: '#d99a3a', leafGold: '#c8a03a', paving: '#b9ad8f', flower: '#c96a4a' },
};

// Captures the merged materials once, then recolours them per season. Original colours are
// remembered so a later season can restore them exactly.
export function createSeasonPalette(town: THREE.Object3D) {
  const materials = new Map<string, THREE.MeshStandardMaterial>(), originals = new Map<string, THREE.Color>();
  town.traverse(o => { if (o instanceof THREE.Mesh && !Array.isArray(o.material) && o.material instanceof THREE.MeshStandardMaterial && o.material.name in BASE && !materials.has(o.material.name)) { materials.set(o.material.name, o.material); originals.set(o.material.name, o.material.color.clone()); } });
  return {
    names: [...materials.keys()],
    apply(season: Season) { for (const [name, material] of materials) { const target = SEASON_COLOURS[season][name]; if (season === 'summer') material.color.copy(originals.get(name)!); else if (target) material.color.set(target); } },
  };
}

// Falling snow or leaves: reuses one line-segment cloud with a per-season look.
export function createSeasonFall() {
  const count = 240, positions = new Float32Array(count * 6), geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8 });
  const fall = new THREE.LineSegments(geometry, material); fall.frustumCulled = false; fall.visible = false;
  return {
    root: fall,
    update(time: number, season: Season, reduced: boolean) {
      const active = (season === 'winter' || season === 'autumn') && !reduced; fall.visible = active; if (!active) return;
      const snow = season === 'winter'; material.color.set(snow ? '#ffffff' : '#d9903a'); material.opacity = snow ? .85 : .75;
      const speed = snow ? 1.3 : 1.0, drift = snow ? .6 : 1.4, length = snow ? .08 : .14;
      for (let i = 0; i < count; i++) {
        const x = ((i * 17.31) % 36) - 18 + Math.sin(time * .7 + i) * drift, z = ((i * 7.19) % 20) - 6, y = 9 - ((time * speed + i * .41) % 9);
        positions.set([x, y, z, x + (snow ? .02 : .1), y - length, z + .03], i * 6);
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}
