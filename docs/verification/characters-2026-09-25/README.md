# Build 41 — skinned townspeople (QA build, localhost:5188, in-app browser + live Blender, 2026-09-25 13:50–14:25 PDT)

Branch `town-lighting-pass`, on top of the lighting pass. Not merged, not deployed.

Route chosen by Pieter: **hybrid** — a free Blender-built skinned body for everyone now; an AI-modelled Alex (Higgsfield / Meshy, about 40–50 credits after retargeting onto our rig) only after he approves a concept.

## Files here

- `characters-before-after.jpg`: top left is the old rigid mannequin cast under the new lighting; the other three are the new cast (square, close-up at the cart, Rosa on the bench in autumn evening light). Same save, positions set with `__town.setView`.
- `characters-turnaround.jpg`: Blender EEVEE renders of the new body: idle, female build with long hair, walk, wave with ponytail, run.
- `concept-alex-options.jpg`, `concept-residents.jpg`: the Higgsfield concept images (GPT Image 2.5, medium quality; 2.5 credits in total, 0.5 per image — the preflight with count 4 had reported the price of one image) used as the style target. Alex options are numbered 1–4 left to right.

## What was measured

| | Old mannequins | Skinned townspeople |
|---|---|---|
| Draw calls, square view, High tier (incl. shadow pass) | 1,431 | 815 |
| Draw calls, same view, Smooth tier | 658 | 374 |
| Triangles, High tier (incl. shadow pass) | 709k | 791k |
| Model file | 331 KB, 45 meshes | 511 KB, 8 meshes, 1 skin |
| Visible triangles per person | ≈5k | ≈8k (body 7.0k + hair 1.0k) |

Old numbers came from a temporary dev-only switch that loaded `town-character.glb` into the same scene; the switch was removed before commit. `__town.advance(120)` took 4.3 ms per simulated and rendered frame on this Mac (CPU submit time, not a GPU measurement). No physical phone or Chromebook was tested.

## Contract kept with the game code

The exported joints (`Hips, Torso, Head, Shoulder±1, Elbow±1, Grip±1, Thigh±1, Knee±1, Ankle±1`) all have identity rest rotation and Y-up translations, verified by parsing the GLB and pinned in `test/TownControls.test.ts`. That keeps every direct `joint.rotation.x = …` pose working (benches, café chairs, office desks, the cyclist, the café cup carry) without code changes. What did change:

- Standing hips at .945 instead of .82 (the old clips held a 67° knee bend; the rigid limbs hid it). Seats were fitted to .82, so `sitHips()` lowers seated hips by 0.125 (`SIT_DROP`); the rider's hips are set to .82.
- Stride shortened to fit the leg: Walk .66 m (1.03 m/s at timeScale 1), Run .80 m (1.5 m/s); `CLIP_GROUND_SPEED` replaces the old 1.3125 / 1.6875 literals.
- Clones use `SkeletonUtils.clone` so each person has their own skeleton.
- `styleCharacter` has a skinned branch: parts by name, `Fem` morph target, colours by material, women's trousers in the skirt palette.
- `createBlink`: everyone blinks on their own rhythm through the `Blink` morph target.
- The Sept-13 rigid Alex model is switched off (`characterAtelier: false` in `TownModal.tsx`) so the whole cast shares one style; the AI Alex will return on the same rig.

## Iteration notes

v1 had a jacket hem sized from the forearms (floating hoop), a long neck and slit eyes (the Blink shape key was left at 1 by Blender); v2 fixed those; v3 found the crouched gait and the NLA preview bug (solo did not isolate a clip, mute does); v4 swapped the painted tee for a separate panel with lapels because decimated triangle edges made the painted boundary jagged, removed shoulder skin patches, and gave limbs about 6% more girth for readability at camera distance.

Validation: 400 tests / 71 files (`tests.log`), production build (`build.log`).
