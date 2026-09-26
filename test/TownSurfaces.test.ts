import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { tileNoise, normalsFromRelief, paintPaving, paintBrick, paintAsphalt, createSurfaceTextures, projectSurfaceUVs, SURFACE_TILE } from '../components/town/townSurfaces';
import { dressTown, type AtelierMaterials } from '../components/town/townAtelier';

// Mean absolute difference between two pixel columns of an RGBA image (red channel).
const columnGap = (color: Uint8Array, width: number, height: number, a: number, b: number) => {
  let sum = 0; for (let y = 0; y < height; y++) sum += Math.abs(color[(y * width + a) * 4] - color[(y * width + b) * 4]); return sum / height;
};
const rowGap = (color: Uint8Array, width: number, a: number, b: number) => {
  let sum = 0; for (let x = 0; x < width; x++) sum += Math.abs(color[(a * width + x) * 4] - color[(b * width + x) * 4]); return sum / width;
};

describe('tileable city surfaces (build 61)', () => {
  it('value noise wraps: the seam between the last and first column is as smooth as any other', () => {
    const w = 128, n = tileNoise(w, w, 4, 4, 3, 5);
    const seam = Array.from({ length: w }, (_, y) => Math.abs(n[y * w + w - 1] - n[y * w])).reduce((a, b) => a + b) / w;
    const inner = Array.from({ length: w }, (_, y) => Math.abs(n[y * w + 63] - n[y * w + 64])).reduce((a, b) => a + b) / w;
    expect(seam).toBeLessThan(inner * 3 + .01);
    expect(Math.min(...n)).toBeGreaterThanOrEqual(0); expect(Math.max(...n)).toBeLessThanOrEqual(1);
  });

  it('paints paving, brick and asphalt deterministically, light enough for the material colour to lead', () => {
    for (const paint of [paintPaving, paintBrick, paintAsphalt]) {
      const a = paint(), b = paint();
      expect(a.color.length).toBe(a.width * a.height * 4);
      expect(Buffer.from(a.color).equals(Buffer.from(b.color))).toBe(true);
      expect(a.mean).toBeGreaterThan(.75); expect(a.mean).toBeLessThan(.95);
    }
  });

  it('tiles without a visible seam: paving and brick in both directions, asphalt along the street', () => {
    for (const s of [paintPaving(), paintBrick()]) {
      const interior = columnGap(s.color, s.width, s.height, 200, 201), seam = columnGap(s.color, s.width, s.height, s.width - 1, 0);
      expect(seam).toBeLessThan(interior * 2 + 4);
      expect(rowGap(s.color, s.width, s.height - 1, 0)).toBeLessThan(rowGap(s.color, s.width, 200, 201) * 2 + 4);
    }
    const road = paintAsphalt();
    expect(columnGap(road.color, road.width, road.height, road.width - 1, 0)).toBeLessThan(columnGap(road.color, road.width, road.height, 300, 301) * 2 + 4);
    // Asphalt v runs kerb to kerb: the gutters are darker than the lanes.
    const rowMean = (y: number) => { let s = 0; for (let x = 0; x < road.width; x++) s += road.color[(y * road.width + x) * 4]; return s / road.width; };
    expect(rowMean(2)).toBeLessThan(rowMean(road.height / 2) - 8);
  });

  it('turns height into tangent-space normals that face away from the rise', () => {
    const flat = normalsFromRelief(new Float32Array(16), 4, 4, 2);
    expect([flat[0], flat[1], flat[2]]).toEqual([128, 128, 255]);
    const ramp = new Float32Array(64).map((_, i) => (i % 8 < 4 ? i % 8 : 7 - i % 8) / 8);   // rises with u for the first half
    const n = normalsFromRelief(ramp, 8, 8, 4);
    expect(n[(8 + 2) * 4]).toBeLessThan(128);   // uphill in +u tilts the normal toward -u
    expect(n[(8 + 2) * 4 + 1]).toBe(128);       // no slope in v
  });

  it('projects world-space UVs so a texture keeps its real scale on any box', () => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 1), new THREE.MeshStandardMaterial()); box.position.set(10, 1, 0);
    const uv = projectSurfaceUVs(box, 'brick'), pos = box.geometry.attributes.position, nor = box.geometry.attributes.normal, t = SURFACE_TILE.brick;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 10, y = pos.getY(i) + 1, z = pos.getZ(i), nx = nor.getX(i), ny = nor.getY(i);
      const [u, v] = Math.abs(ny) > .5 ? [x, z] : Math.abs(nx) > .5 ? [z, y] : [x, y];
      expect(uv[i * 2]).toBeCloseTo(u / t.u, 5); expect(uv[i * 2 + 1]).toBeCloseTo(v / t.v, 5);
    }
    const road = new THREE.Mesh(new THREE.BoxGeometry(100, .07, 5), new THREE.MeshStandardMaterial()); road.position.set(0, 0, 3);
    const r = projectSurfaceUVs(road, 'asphalt', 'road'), vs = Array.from({ length: r.length / 2 }, (_, i) => r[i * 2 + 1]);
    expect(Math.min(...vs)).toBeCloseTo(0, 5); expect(Math.max(...vs)).toBeCloseTo(1, 5);
  });

  it('dresses walls in brick, the road in asphalt and the paving in flags, and leaves the shared colours alone', () => {
    const blank = new THREE.Texture();
    const library = { stone: blank, wood: blank, grain: blank, surfaces: { paving: createSurfaceTextures('paving'), brick: createSurfaceTextures('brick'), asphalt: createSurfaceTextures('asphalt') } } as unknown as AtelierMaterials;
    const root = new THREE.Group(), mesh = (name: string) => { const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ name })); root.add(m); return m; };
    const wall = mesh('wallBlue'), road = mesh('road'), paving = mesh('paving'), reflection = mesh('blue');
    dressTown(root, library);
    const mat = (m: THREE.Mesh) => m.material as THREE.MeshStandardMaterial;
    expect(mat(wall).map).toBe(library.surfaces.brick.map); expect(mat(wall).normalMap).toBe(library.surfaces.brick.normalMap);
    expect(mat(road).map).toBe(library.surfaces.asphalt.map); expect(mat(paving).map).toBe(library.surfaces.paving.map);
    expect(mat(reflection).map).toBeNull();   // window reflections and fountain water share 'blue' and stay plain
    // Walls keep the paint's brightness: the colour is lifted by the brick texture's mean.
    expect(mat(wall).color.r).toBeCloseTo(new THREE.Color('#7c9aab').r / library.surfaces.brick.mean, 4);
  });

  it('the city model gives each building wall its own material for the brick', () => {
    const b = readFileSync('public/models/town/freedom-square.glb'), gltf = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
    const names = gltf.materials.map((m: { name: string }) => m.name);
    for (const wall of ['wallMint', 'wallBlue', 'wallPeach', 'wallPink']) expect(names).toContain(wall);
  });
});
