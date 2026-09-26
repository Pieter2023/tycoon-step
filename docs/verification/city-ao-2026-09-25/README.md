# Build 59: baked ambient occlusion for the city (2026-09-25, branch `town-lighting-pass`)

This is the "AO bake" item from HANDOVER §1b and assessment §3 ("there is no AO"). **Not released.**

## What it does

`scripts/build-town-assets.py` bakes ambient occlusion for the merged city (19 meshes, one per material), after the join and before the export:

1. **A second UV set, `AO`.** Smart UV Project packs all 19 meshes together into one atlas (edit mode across every mesh). It exports as `TEXCOORD_1`; `TEXCOORD_0` stays, because the atelier art pass (`dressTown`) maps its wood and grain textures on it.
2. **The bake.** Cycles AO bake: 2048², 64 samples, 0.6 m reach, 6 px margin, fixed seed, about 50 s. The map is downscaled to 1024 for export (occlusion is soft) and packed into `freedom-square.blend`.
3. **The glTF hook.** Each material gets a `glTF Material Output` group whose `Occlusion` input takes the map's red channel through the `AO` UV map. The exporter writes `occlusionTexture { texCoord: 1 }` and embeds the map as JPEG (q85).
4. **Clean-up.** The bake nodes are removed afterwards, because the legacy character further down the script reuses these materials.

**In the game:**
- `GLTFLoader` assigns it as `aoMap` on UV channel 1.
- **What it darkens.** three.js applies it to indirect light only (sky, hemisphere and environment), not to the sun, so it adds the soft contact shading that the sun's shadows alone cannot give.
- **Strength.** Indirect light is a modest share of this lighting, so `TOWN_AO_STRENGTH` (1.4, in `createTownScene.ts`) strengthens it.
- **Seasons.** The seasonal palette recolours materials in place, so the map survives season changes.

## Tuning (`ao-strength-0-1-4.jpg`)

- **The first bake** (1 m reach, 2048 map) at strength 1 was nearly invisible: the difference image was black. At 4 it was obvious but grimy.
- **The second try** (1 m, 1024 map, strength 1.8) put dark streaks like dirt on the facades beside doors and between window columns.
- **Shipped:** 0.6 m reach and strength 1.4. Door and window recesses, the gaps between buildings, and planter and bench bases get depth; the streaks are mostly gone (`ao-before-after.jpg`: left without AO, right with it; street and cart views at noon, the square in the evening).

## Cost

| | Before | After |
|---|---|---|
| `freedom-square.glb` | 894,944 bytes | 1,375,692 bytes (+481 KB: the 161 KB map, the rest is the second UV set) |
| Vertices | 209,386 | 216,760 (+4%, from the new UV seams) |
| Triangles, draw calls | 121,556, 552 on the square | unchanged |
| GPU memory | none | one 1024² texture (about 5.6 MB with mipmaps) |
| Per pixel | none | one extra texture read on city materials |

**For Pieter's eye:**
- **Taste.** It is a look change (a slightly darker, more grounded city).
- **The phone check.** It costs about half a megabyte more on the first city load. Worth including in the next phone and Chromebook check.
- **Tuning.** `TOWN_AO_STRENGTH` can be tuned without a rebake; `AO_DISTANCE` needs one (about 70 s).

## Checks

- **Tests:** `test/TownControls.test.ts` pins one shared map, `occlusionTexture.texCoord` 1 on every material, and `TEXCOORD_1` on every primitive. The city stays under 2 MB.
- **Suite:** 483 tests / 85 files, TypeScript and the production build pass.
- **Browser:** checked in the city at `localhost:5191` (four standard views, noon and evening) with `__town.advance` and the capture receiver. There were no console errors.
- **Versions:** `MODEL_VERSION` is `20260925d` (`b` and `c` were used only by local trials). It also re-versions `town-vehicles.glb`, which is unchanged.
- **Legacy files:** the script also rewrites the legacy `town-character.glb` and `.blend`; those were restored from git (unused, unchanged).
