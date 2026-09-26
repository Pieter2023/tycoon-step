# Build 57: a cleaner face for the hero Alex (2026-09-25, branch `town-lighting-pass`)

This is item 2 of the visual list in HANDOVER §1b ("hero face skin evenness"). **Not released.**

## What was wrong

Meshy's face texture has thin dark-grey lines painted into it: across the forehead, down the nose, off the nostril, under the lip, on the cheeks and on the chin. Most run along the atlas's chart borders; some run inside a chart. They show at café and bench distances. `seam-map-before-after.jpg` marks them in blue, found as texels that differ from their neighbourhood on smooth skin in an unlit front render.

## The fix

`repair_face()` in `scripts/build-town-hero.py` runs at build time on the texture:
- **Tone.** Every head texel is placed back in 3D, and skin tone is averaged over 3D neighbourhoods. That crosses the chart seams, which texture space cannot.
- **Replace.** A texel takes the local tone only if all of these hold:
  - it differs from the tone;
  - its 3D neighbourhood is mostly skin;
  - it is either near a chart border (next to padding, or next to a texel more than 3 mm away in 3D) or a thin dark line (a 5×5 median around it is still skin).
- **Protected.** Eyes (their boxes), brows and nostrils (not mostly skin around them), and lips and blush (redder than the skin) keep their paint.
- **Padding.** The face charts are then re-dilated three texels into their padding, which filtering and mipmaps sample.

It touches about 4,600 face texels and 27,000 padding texels, and nothing outside the head (`body` renders identical). The GLB grows by 5.6 KB (503.8 → 509.4 KB). The build stays deterministic: two runs give byte-identical files. `HERO_VERSION` is `20260925f`.

## Results

- `face-lower-before-after.jpg` (Blender, identical lighting): the lower face is clean. The stroke off the nostril, the grey marks under the lip and on the cheek, and the chin lines are gone. Lips, smile and nose shading are unchanged.
- `face-in-game-before-after.jpg`: the same in the game. The two captures were rendered at different canvas sizes, so compare the lines, not the overall brightness.
- `seam-map-before-after.jpg`: marked line pixels went from 2,064 to 1,339 (−35%).

## Left for Pieter's eye

- **Forehead lines.** A few forehead lines (near the brows and the hairline) and the nose-bridge line survive. They fail the "mostly skin around it" test near the brows, and loosening it would start eating brow and hair edges.
- **The shading step on one cheek** (fixed in build 64, `docs/verification/hero-cheek-2026-09-26/`). A side light draws a hard terminator down the left third of the face. It is the decimated face geometry, not the texture: the unlit texture is even across the face (0.75–0.81).
  - Smoothing the face normals was tried. It looked worse (a hard band where the Head weights end), so it was reverted.
  - The real fix is re-topologising or subdividing the face in Blender by hand.

## Checks

482 tests / 85 files pass, including the hero GLB structure test, plus TypeScript and the production build. Checked in the city at `localhost:5191` with `__town.advance` and the capture receiver.
