# Build 56: the hero Alex blinks (2026-09-25, branch `town-lighting-pass`)

This is item 1 of the visual list in HANDOVER §1b. **Not released.** It ships with the next release Pieter approves.

## Why it needed geometry

The AI-modelled Alex (build 42) has his eyes painted into the texture, so the townspeople's `Blink` morph had nothing to close. A morph target would not survive either: the hero GLB is Draco-compressed, and Draco drops morph targets.

## What was built

`scripts/build-town-hero.py` now adds `build_eyelids()`.

- **Where the eyes are.** The outline of each painted eye was measured once on the built hero, from an unlit orthographic front render (`EYE_X`, `EYE_TOP`, `EYE_LOW_CORNER`, `EYE_LOW_MID`). Each eye is about 3.7 × 1.8 cm, and its lower outline dips about 7 mm at the middle.
- **The lids.** One 12 × 6 grid per eye runs from a crease 5 mm above the eye down to just below its lower outline. Every vertex is raycast onto the face and lifted 1.5 mm along the normal, so the lid follows the face.
- **Colours.** Vertex colours give the skin just above the eyes (sampled from the texture) and a dark lash line along the bottom rows. The lash line fades out past the eye corners.
- **Material.** `alex-lid`: roughness .55, not metallic, back faces culled.
- **In the file.** Both lids are one object, `Eyelids`, parented to the `Head` joint and stored open: squashed to 2% of its height at the crease (`LID_OPEN`). It adds 2 KB to the GLB (501.6 → 503.8 KB).
- **At runtime.** `createBlink` (`components/town/townCharacterExpression.ts`) drives the lids with the same rhythm as the townspeople's morph. It scales `Eyelids` from `LID_OPEN` to 1 and back over 0.16 s, hides it between blinks, and keeps it hidden under reduced motion.
- **Dev handle.** `__town.blink(amount)` holds every lid and morph at a given closure for stills; `__town.blink()` releases it.
- **Safe defaults.** A build without the runtime code shows open eyes: the lids are stored open.
- **Version.** `HERO_VERSION` is `20260925e`.

The rebuild is deterministic: running the documented command twice gives byte-identical GLBs.

## Checks

- `blink-blender.jpg`: Blender stills straight on (top) and at 35° (bottom), with the lids open, half and closed.
- `blink-in-game.jpg`: the same three states in the game at `localhost:5191`, captured with `__town.advance` and the capture receiver while the pane was hidden.
  - Closed reads as a relaxed, content closed eye.
  - Half gives a natural heavy-lidded look.
  - No lid shows when open.
- **Tests:**
  - `test/TownPeople.test.ts`: the hero's lids close fully, are never shown while open, and stay hidden under reduced motion;
  - `test/TownControls.test.ts`: the shipped GLB has `Eyelids` under the `Head` joint, stored at `LID_OPEN`, with vertex colours.
- **Suite:** 482 tests / 85 files, TypeScript and the production build pass.

## Seen along the way

The close-ups also show the next visual item: light seam lines across the face texture (forehead, nose to cheek, chin, neck) and a vertical shade change down one side of the face. They are Meshy chart seams and show at café and bench distances.
