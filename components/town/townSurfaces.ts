import * as THREE from 'three';

// Tileable surfaces for the city (build 61): sandstone paving, painted brick walls and asphalt. Each is painted
// procedurally into plain pixel arrays (no canvas, no download, deterministic) with a matching height field, which
// becomes a normal map so joints, mortar and aggregate catch the sun. The colour maps are light and nearly neutral:
// the city material's own colour (and the season palette) still sets the hue.

export type Surface = { width: number; height: number; color: Uint8Array; relief: Float32Array; mean: number };
export type SurfaceName = 'paving' | 'brick' | 'asphalt';

/** Metres covered by one repeat of each texture: u along the ground or wall, v up the wall or across the road. */
export const SURFACE_TILE: Record<SurfaceName, { u: number; v: number }> = {
  paving: { u: 2.4, v: 2.4 },   // four courses of 0.6 m flags
  brick: { u: 1.6, v: 1.6 },    // sixteen courses of 0.4 m × 0.1 m bricks
  asphalt: { u: 8, v: 1 },      // v spans the road's full width, kerb to kerb; 8 m so the patch repairs don't visibly repeat
};

const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;

/** Fractal value noise that wraps at the tile edges, 0..1. `cellsX/Y` lattice cells across the tile at the first octave. */
export function tileNoise(width: number, height: number, cellsX: number, cellsY: number, octaves: number, seed: number) {
  const out = new Float32Array(width * height), rand = rng(seed), c0 = new Int32Array(width), c1 = new Int32Array(width), sx = new Float32Array(width);
  let amplitude = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const cx = cellsX << o, cy = cellsY << o, lattice = new Float32Array(cx * cy);
    for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
    for (let x = 0; x < width; x++) { const fx = x / width * cx, x0 = Math.floor(fx); c0[x] = x0 % cx; c1[x] = (x0 + 1) % cx; sx[x] = smooth(fx - x0); }
    for (let y = 0; y < height; y++) {
      const fy = y / height * cy, y0 = Math.floor(fy), sy = smooth(fy - y0), r0 = (y0 % cy) * cx, r1 = ((y0 + 1) % cy) * cx, row = y * width;
      for (let x = 0; x < width; x++) {
        const a0 = lattice[r0 + c0[x]], b0 = lattice[r1 + c0[x]], t = sx[x];
        const a = a0 + (lattice[r0 + c1[x]] - a0) * t, b = b0 + (lattice[r1 + c1[x]] - b0) * t;
        out[row + x] += (a + (b - a) * sy) * amplitude;
      }
    }
    total += amplitude; amplitude *= .5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Tangent-space normal map from a height field. Rows run with v (DataTextures are not flipped), and it wraps like the tile. */
export function normalsFromRelief(relief: Float32Array, width: number, height: number, strength: number) {
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const left = relief[y * width + (x + width - 1) % width], right = relief[y * width + (x + 1) % width];
    const down = relief[((y + height - 1) % height) * width + x], up = relief[((y + 1) % height) * width + x];
    const nx = (left - right) * strength, ny = (down - up) * strength, length = Math.hypot(nx, ny, 1), i = (y * width + x) * 4;
    out[i] = Math.round((nx / length * .5 + .5) * 255); out[i + 1] = Math.round((ny / length * .5 + .5) * 255); out[i + 2] = Math.round((1 / length * .5 + .5) * 255); out[i + 3] = 255;
  }
  return out;
}

const finish = (width: number, height: number, rgb: Float32Array, relief: Float32Array): Surface => {
  const color = new Uint8Array(width * height * 4); let sum = 0;
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++) color[i * 4 + c] = Math.round(clamp01(rgb[i * 3 + c]) * 255);
    color[i * 4 + 3] = 255; sum += (rgb[i * 3] + rgb[i * 3 + 1] + rgb[i * 3 + 2]) / 3;
  }
  return { width, height, color, relief, mean: sum / (width * height) };
};

/** Sandstone flags in four 0.6 m courses of mixed lengths, with sanded joints, worn bevels and a few stains. */
export function paintPaving(size = 512, seed = 11): Surface {
  const rand = rng(seed), rows = 4, rowHeight = size / rows, joint = 2.2, bevel = 4, JOINT_TONE = [.62, .6, .55];
  const grain = tileNoise(size, size, 16, 16, 3, seed + 1), mottle = tileNoise(size, size, 3, 3, 3, seed + 2);
  // Per course: which slab each column belongs to and how far it is from the nearest (wrapping) vertical joint.
  const courses = Array.from({ length: rows }, () => {
    const widths: number[] = []; let left = size;
    while (left > 0) { const w = left <= 256 ? left : [128, 192, 256][Math.floor(rand() * 3)]; widths.push(Math.min(w, left)); left -= w; }
    const offset = Math.floor(rand() * size), slab = new Int32Array(size), distance = new Float32Array(size);
    let start = offset;
    widths.forEach((w, k) => { for (let j = 0; j < w; j++) { const x = (start + j) % size; slab[x] = k; distance[x] = Math.min(j, w - j); } start += w; });
    const tones = widths.map(() => { const dark = rand() < .1, v = dark ? .84 + rand() * .05 : .89 + rand() * .09, warm = (rand() - .5) * .05; return [v + warm, v, v - warm * 1.4]; });
    return { slab, distance, tones };
  });
  const rgb = new Float32Array(size * size * 3), relief = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const course = courses[Math.floor(y / rowHeight)], dy = Math.min(y % rowHeight, rowHeight - (y % rowHeight));
    for (let x = 0; x < size; x++) {
      const i = y * size + x, d = Math.min(dy, course.distance[x]), g = grain[i];
      let shade: number, tone = JOINT_TONE;
      if (d < joint) { shade = .82 + g * .25; relief[i] = 0; }
      else {
        tone = course.tones[course.slab[x]];
        const edge = smooth(clamp01((d - joint) / bevel));
        shade = (.93 + mottle[i] * .12) * (.95 + g * .1) * (.93 + edge * .07);
        const speck = rand(); if (speck < .025) shade *= .9; else if (speck > .985) shade *= 1.06;
        relief[i] = edge * (.9 + g * .1);
      }
      rgb[i * 3] = tone[0] * shade; rgb[i * 3 + 1] = tone[1] * shade; rgb[i * 3 + 2] = tone[2] * shade;
    }
  }
  // A few soft stains, painted only inside their own (wrapping) squares.
  for (let n = 0; n < 5; n++) {
    const cx = rand() * size, cy = rand() * size, r = 18 + rand() * 40;
    for (let yy = Math.floor(cy - r); yy <= cy + r; yy++) for (let xx = Math.floor(cx - r); xx <= cx + r; xx++) {
      const q = 1 - Math.hypot(xx - cx, yy - cy) / r; if (q <= 0) continue;
      const i = ((yy % size + size) % size) * size + ((xx % size + size) % size), k = 1 - .07 * smooth(q) * (.6 + mottle[i] * .8);
      rgb[i * 3] *= k; rgb[i * 3 + 1] *= k; rgb[i * 3 + 2] *= k;
    }
  }
  return finish(size, size, rgb, relief);
}

/** Painted brick in running bond: 0.4 m × 0.1 m courses, recessed mortar, gentle per-brick variation under one coat. */
export function paintBrick(size = 512, seed = 23): Surface {
  const rand = rng(seed), rows = 16, rowHeight = size / rows, brick = size / 4, mortar = 2, bevel = 2.2, MORTAR_TONE = [.8, .79, .77];
  const grain = tileNoise(size, size, 32, 32, 3, seed + 1), wash = tileNoise(size, size, 4, 4, 3, seed + 2);
  const tones = Array.from({ length: rows * 4 }, () => { const v = rand() < .08 ? .84 + rand() * .05 : .92 + rand() * .08, tint = (rand() - .5) * .03; return [v + tint, v, v - tint]; });
  const rgb = new Float32Array(size * size * 3), relief = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / rowHeight), offset = (row % 2) * brick / 2, dy = Math.min(y % rowHeight, rowHeight - (y % rowHeight));
    for (let x = 0; x < size; x++) {
      const i = y * size + x, bx = (x + offset) % size, dx = Math.min(bx % brick, brick - (bx % brick)), d = Math.min(dx, dy), g = grain[i], w = wash[i];
      let tone = MORTAR_TONE, shade: number;
      if (d < mortar) { shade = .9 + g * .12; relief[i] = 0; }
      else {
        tone = tones[row * 4 + Math.floor(bx / brick)];
        const edge = smooth(clamp01((d - mortar) / bevel));
        shade = (.95 + g * .08) * (.9 + edge * .1);
        relief[i] = edge * (.92 + g * .08);
      }
      shade *= .95 + w * .08;
      for (let c = 0; c < 3; c++) rgb[i * 3 + c] = tone[c] * shade;
    }
  }
  return finish(size, size, rgb, relief);
}

/** Asphalt across the full road width: aggregate, polished wheel tracks, darker gutters, patch repairs and cracks. */
export function paintAsphalt(width = 512, height = 512, seed = 37): Surface {
  const rand = rng(seed), grain = tileNoise(width, height, 64, 64, 2, seed + 1), mottle = tileNoise(width, height, 5, 4, 4, seed + 2);
  const rgb = new Float32Array(width * height * 3), relief = new Float32Array(width * height), shade = new Float32Array(width * height);
  const tracks = [.2, .33, .67, .8];
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1); let track = 0;
    for (const t of tracks) track = Math.max(track, Math.exp(-(((v - t) / .035) ** 2)));
    const gutter = Math.max(0, 1 - Math.min(v, 1 - v) / .07);
    for (let x = 0; x < width; x++) {
      const i = y * width + x, g = grain[i], m = mottle[i], stone = rand();
      let s = (.84 + (m - .5) * .16) * (.94 + g * .12);
      const aggregate = 1 - track * .6;   // traffic polishes the stones flush in the wheel tracks
      if (stone < .07) s *= 1 + (.12 + rand() * .18) * aggregate; else if (stone < .11) s *= 1 - .14 * aggregate;
      s *= 1 - track * .05 - gutter * gutter * .16;
      shade[i] = s; relief[i] = g * .35 * aggregate + (stone < .07 ? .2 * aggregate : 0);
    }
  }
  // Two patch repairs: slightly darker, smoother rectangles with a sealed edge (they wrap along the road). Hairline
  // cracks were tried and read as stray hairs at game distance, so there are none.
  for (let p = 0; p < 2; p++) {
    const pw = 40 + rand() * 70, ph = 50 + rand() * 90, px = rand() * width, py = height * (.12 + rand() * .6);
    for (let y = Math.floor(py); y < Math.min(height, py + ph); y++) for (let xx = 0; xx < pw; xx++) {
      const x = Math.floor(px + xx) % width, i = y * width + x, border = Math.min(xx, pw - xx, y - py, py + ph - y);
      shade[i] *= border < 1.5 ? .86 : .96; relief[i] = border < 1.5 ? relief[i] + .25 : relief[i] * .5;
    }
  }
  for (let i = 0; i < width * height; i++) { const s = shade[i]; rgb[i * 3] = s * .99; rgb[i * 3 + 1] = s; rgb[i * 3 + 2] = s * 1.01; }
  return finish(width, height, rgb, relief);
}

const cache = new Map<SurfaceName, Surface>();
export function surface(name: SurfaceName): Surface {
  let s = cache.get(name);
  if (!s) { s = name === 'paving' ? paintPaving() : name === 'brick' ? paintBrick() : paintAsphalt(); cache.set(name, s); }
  return s;
}

const NORMAL_STRENGTH: Record<SurfaceName, number> = { paving: 2.2, brick: 2.4, asphalt: 1.6 };
const texture = (data: Uint8Array, width: number, height: number, srgb: boolean, clampV: boolean) => {
  const t = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = clampV ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true; return t;
};

/** Colour and normal textures for one surface; the pixel data is painted once per page and shared. */
export function createSurfaceTextures(name: SurfaceName) {
  const s = surface(name), clampV = name === 'asphalt';
  return { map: texture(s.color, s.width, s.height, true, clampV), normalMap: texture(normalsFromRelief(s.relief, s.width, s.height, NORMAL_STRENGTH[name]), s.width, s.height, false, clampV), mean: s.mean };
}

/**
 * World-space UVs for a merged city mesh, so the texture keeps its real-world scale on every box however it was
 * modelled. 'box' picks each vertex's dominant normal axis (walls, kerbs and slabs); 'road' runs u along the street and
 * stretches v across the road's width, kerb to kerb, so the gutters and wheel tracks land in the right place.
 */
export function projectSurfaceUVs(mesh: THREE.Mesh, name: SurfaceName, mode: 'box' | 'road' = 'box') {
  const tile = SURFACE_TILE[name], geometry = mesh.geometry, position = geometry.attributes.position, normal = geometry.attributes.normal;
  mesh.updateWorldMatrix(true, false);
  const world = mesh.matrixWorld, normalMatrix = new THREE.Matrix3().getNormalMatrix(world), p = new THREE.Vector3(), n = new THREE.Vector3();
  const uv = new Float32Array(position.count * 2);
  let minZ = Infinity, maxZ = -Infinity;
  if (mode === 'road') for (let i = 0; i < position.count; i++) { p.fromBufferAttribute(position, i).applyMatrix4(world); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i).applyMatrix4(world);
    if (mode === 'road') { uv[i * 2] = p.x / tile.u; uv[i * 2 + 1] = (p.z - minZ) / Math.max(1e-6, maxZ - minZ); continue; }
    if (normal) n.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix); else n.set(0, 1, 0);
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    const [u, v] = ay >= ax && ay >= az ? [p.x, p.z] : ax >= az ? [p.z, p.y] : [p.x, p.y];
    uv[i * 2] = u / tile.u; uv[i * 2 + 1] = v / tile.v;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return uv;
}
