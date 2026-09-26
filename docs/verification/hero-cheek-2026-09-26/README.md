# Build 64: the hero's cheek, smoothed (2026-09-26)

Pieter's call on 2026-09-26: "yes" to fixing the shading step on the hero Alex's cheek (the open item in `hero-face-2026-09-25/`).

## What was wrong

In the city's light, a hard edge ran down the left of Alex's face: a darker patch on the left cheek and jaw, and a zigzag crease from the mouth corner to the chin.

- **It is the surface, not the shadows.** Rendered in Blender with shadows off, the same line appears.
- **It is the facets, not an open seam.** The face has no open edges or unwelded duplicates. Meshy decimated it into coarse facets: the median crease between neighbouring face triangles is 24°, and some slivers are 12 cm long across a 20 cm face. Smooth shading across those facets draws the line.

## What was tried first

A scripted re-topology of the skin:
1. split every face edge longer than 1.4 cm;
2. flip sliver triangles towards even ones (never across a UV seam);
3. relax the skin with a volume-keeping Taubin filter.

It evened the light but moved the painted eyes out from under the eyelid meshes (placed at fixed 3D outlines) and smeared the mouth. `geometry-vs-normals.jpg` shows before, that attempt, and the fix. It was reverted.

## The fix

`smooth_face_normals()` in `scripts/build-town-hero.py` runs just before export. Every vertex and the texture stay exactly where they are. Only the skin's shading normals are relaxed towards their neighbours (20 passes at rate .5) and stored as custom normals, which glTF exports.

- **Region:** the front of the face, z 1.672–1.866 and |x| < .116, in front of y = −.04.
- **Edges:** the relaxation fades out over 1.5 cm towards the hairline, ears and neck, so there is no band where it stops. An earlier normal-smoothing try in build 57 left one.
- **Held:** the eyes and brows, the nose (bridge to tip) and the lips keep their own shading, with a 6 mm fade.
- **Touched:** 239 vertices, 130 of them fully free.

About the file:
- **Size and triangles:** nothing is added. The GLB is 523,744 bytes (was 523,348) with the same 10,315 triangles.
- **Deterministic:** the build is still byte-for-byte repeatable; the real build matched the scratch build exactly. The unmodified script also still reproduces the old file byte for byte.
- **Version:** `HERO_VERSION` is `20260926a`.

## Results (in game, `localhost:5191`, `__town.setView` at 1.9 m)

`face-before-after.jpg`, with before on the left and after on the right:
- **Afternoon, front:** the hard-edged dark patch on the left cheek and jaw is gone.
- **Afternoon, three-quarter:** the zigzag crease from the mouth corner to the chin is smoothed out.
- **Morning, front:** the boundary down the left cheek softens. (The eyes are mid-blink in this frame, in both captures.)

The eyes, nose and smile keep their definition.

**Still there:** a thin light line above the nose and a few near the hairline. Those are Meshy's texture seams, recorded in build 57, not geometry.

## Checks

498 tests / 88 files, including the hero GLB structure test (seven clips, identity rest rotations, Draco, under 700 KB). TypeScript and the production build pass.
