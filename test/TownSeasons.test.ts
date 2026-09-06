import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { seasonFor, createSeasonPalette, createSeasonFall, SEASON_LABEL } from '../components/town/townSeasons';

describe('seasons', () => {
  it('maps game months to seasons and wraps across years', () => {
    expect([1, 2, 3, 6, 9, 12].map(seasonFor)).toEqual(['winter', 'winter', 'spring', 'summer', 'autumn', 'winter']);
    expect(seasonFor(13)).toBe('winter'); expect(seasonFor(26)).toBe('winter'); expect(seasonFor(30)).toBe('summer');
    expect(SEASON_LABEL.autumn).toBe('AUTUMN');
  });
  it('recolours the merged city materials by name and restores summer exactly', () => {
    const town = new THREE.Group();
    const grass = new THREE.MeshStandardMaterial({ color: '#5c7d4a', name: 'grass' }), leaf = new THREE.MeshStandardMaterial({ color: '#386b36', name: 'leaf' }), stone = new THREE.MeshStandardMaterial({ color: '#888888', name: 'stone' });
    for (const m of [grass, leaf, stone]) town.add(new THREE.Mesh(new THREE.BoxGeometry(), m));
    const palette = createSeasonPalette(town);
    expect(palette.names.sort()).toEqual(['grass', 'leaf']);
    palette.apply('winter'); expect(grass.color.getHexString()).toBe('e6ebee'); expect(stone.color.getHexString()).toBe('888888');
    palette.apply('autumn'); expect(leaf.color.getHexString()).toBe('b8642f');
    palette.apply('summer'); expect(grass.color.getHexString()).toBe('5c7d4a'); expect(leaf.color.getHexString()).toBe('386b36');
  });
  it('snows in winter, drops leaves in autumn, and stays still when reduced or indoors', () => {
    const fall = createSeasonFall();
    fall.update(1, 'winter', false); expect(fall.root.visible).toBe(true); expect((fall.root.material as THREE.LineBasicMaterial).color.getHexString()).toBe('ffffff');
    fall.update(2, 'autumn', false); expect((fall.root.material as THREE.LineBasicMaterial).color.getHexString()).toBe('d9903a');
    fall.update(3, 'summer', false); expect(fall.root.visible).toBe(false);
    fall.update(4, 'winter', true); expect(fall.root.visible).toBe(false);
  });
});
