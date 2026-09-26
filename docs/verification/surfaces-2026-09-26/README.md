# Build 61: tileable paving, brick and asphalt (2026-09-26)

The last open item of assessment §3's visual list. Before this build, the road and the building walls were flat colours, and the paving had a flat stone texture whose 0.8 m joints fought a grid of modelled seams at 1 m.

## What changed

**Textures, painted at runtime** (`components/town/townSurfaces.ts`). There is no download and no paid service, and the output is deterministic.

Each surface is a 512 px colour map plus a normal map made from its own height field, so joints, mortar and grain catch the sun. They are plain pixel arrays uploaded as `DataTexture`s, painted once per page and shared by later city visits.

| Surface | Look | One repeat | Applied to |
|---|---|---|---|
| Paving | sandstone flags in 0.6 m courses of mixed lengths, sanded joints, worn bevels, a few stains | 2.4 m | `paving`: pavements, promenade, square, kerb faces |
| Brick | painted running bond, 0.4 × 0.1 m, recessed mortar, gentle per-brick variation | 1.6 m | the new `wallMint/Blue/Peach/Pink` materials: the four shop buildings and the backdrop blocks |
| Asphalt | aggregate, polished wheel tracks, darker gutters, two patch repairs | 8 m along the street, kerb to kerb across it | `road` |

- **World-space UVs** (`projectSurfaceUVs`) give every merged box the same real-world scale. The dominant normal axis picks the projection, and the road maps v kerb to kerb. The AO keeps its own UV set (`TEXCOORD_1`).
- **Colour:** the maps are light and nearly neutral, so the material colour still sets the hue. Walls and road divide their colour by the map's mean to keep their brightness. Paving is left to the season palette, which already sets it outright (winter flags go pale).
- **`dressTown`** (`townAtelier.ts`) applies the three surfaces. The atelier library creates and disposes them.

**City model** (`scripts/build-town-assets.py`, `MODEL_VERSION` `20260926b`):
- The building bodies and backdrops use their own `wall*` materials, with the same colours as before. Their old ones are shared with the window reflections and the fountain water ('blue'), which must stay plain.
- The 156 modelled paving seam boxes are gone; the texture carries the joints.
- The road's centre-line dash at x = 0 is gone. It was buried inside the middle crosswalk stripe, and the new AO bake drew a dark line along the stripe from it.
- `freedom-square.glb` is 1,365,412 bytes, down from 1,375,692.

## Evidence

- `surfaces-before-after.jpg`: square, facade, road and street, before on the left and after on the right (summer, noon, Detailed).
- `surfaces-conditions.jpg`: sunset and night on the street, winter and autumn on the square, the Smooth tier (no shadows), and the bench close-up.
- `surfaces-facade.jpg`: the facade at full resolution.

## Checks

- **Painting cost:** 40–60 ms in all, measured in the dev build on this Mac: paving 15–31, asphalt 19–29, brick 11–15, plus about 6 ms per normal map. That was 210 ms before the column and stain loops were precomputed. It runs once per page, during the city's loading screen.
- **Scene:** 515 draw calls and 443k triangles on the square, the same as before (513–577 and 447k; traffic varies it).
- **Real iPhone** (LAN production build, iPhone Mirroring):
  - brick, flags and asphalt render;
  - the square at Auto (Balanced): 59–60 fps, 494 calls, 427k triangles;
  - **Detailed, "See neighbourhood" zoomed out, 2 minutes: 58–60 fps**, the same as build 59's 56–60;
  - the phone was left on Auto.
- **Tests:** `test/TownSurfaces.test.ts` (7 tests) covers:
  - the noise and textures wrap without a seam, and are deterministic and light;
  - the asphalt gutters are darker than the lanes;
  - the normal-map direction;
  - box and road UV projection;
  - `dressTown` gives walls brick, the road asphalt and the paving flags, leaves 'blue' plain and lifts wall colour by the mean;
  - the city GLB has the four wall materials.
- **Suite:** 491 tests / 86 files, `tsc` and the production build pass.

## Not changed

- Grass stays flat.
- Rooftops, cornices and the rooms keep their existing grain and stone textures.
- Kids mode doesn't use the atelier pass, so it has no textures, as before.
