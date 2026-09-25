# Build 42: the AI-modelled Alex (QA build, localhost:5189, in-app browser + headless Blender, 2026-09-25 14:35–15:05 PDT)

Branch `town-lighting-pass`, on top of builds 40–41. Not merged, not deployed.

Pieter picked **concept 2** and approved **up to 50 Higgsfield credits**. **38 were spent** (balance 465.33 → 427.33, checked with `balance` before and after), so 12 of the approval were not used.

## What was made

1. **Model.** Higgsfield `generate_3d` with `meshy_v7_image_to_3d`. Input: concept 2's job id (`97825dfd-…`) as `image_references`, `should_texture: true`, `pose_mode: 'a-pose'`, `target_polycount: 10000`, and no Meshy rigging.
   - The preflight `get_cost` said 38. With Meshy rigging it would have been 44, but we don't need it: we rig onto our own skeleton.
   - Job `c2c6a0f6-ffd9-4455-9da9-44fde5b14df4`.
   - The source is kept as `assets/town/alex-meshy-source.glb` (3.7 MB): 10,315 triangles and one 2048² JPEG atlas.
2. **Rig.** `scripts/build-town-hero.py` rigs it (see the file header for the steps). It writes `public/models/town/town-hero-alex.glb` (502 KB, Draco). A rebuild from the source is byte-identical.
   - It welds the UV-seam splits: 14.6k → 5.1k vertices, one piece, 95 non-manifold edges.
   - It scales the hair crown to 2.0 m, the old player's height.
   - It places the town joints at Alex's own joints, measured from cross-sections: legs part at 0.885, armpits at 1.325, the arm axis runs 31° from vertical.
   - It binds with automatic weights in the A-pose (0 unweighted vertices).
   - It swings the arms to the town rest pose (12°) and applies that pose as the rest pose.
   - It points every bone up with no roll, then keys the six clips.
3. **Shared clips.** The clip generator now lives in `scripts/town_rig.py`, shared with `build-town-people.py`. It takes the leg geometry as a parameter.
   - Alex keeps his concept proportions: longer legs (thigh 0.457 / shin 0.441 instead of 0.43 / 0.41) and a smaller head.
   - His clips are the same motion scaled to his legs. Stride and timing are unchanged, so `CLIP_GROUND_SPEED` holds.
   - Refactor check: rebuilding the townspeople gives identical animation keys (max difference 0) and the same meshes, nodes, skins and file size. Only the triangle index order differs, which is the exporter's usual nondeterminism. The committed `town-people.glb` was not touched.
4. **Texture repair.** Meshy textures the A-pose from the camera side, so surfaces the arms hid came out as white smudges that showed once the arms swung. The affected areas were the torso sides, the inner sleeves and the inner legs.
   - The script repaints near-white texels by part. Each face's part comes from its bone (jacket or trouser bones) and its own median colour (the jacket hem and trouser waist share the Hips bone).
   - It skips the open front (tee and zipper), the head, the hands and the shoes.
   - The atlas is halved to 1024². It is fully dilated, so charts don't bleed.
5. **Game.**
   - `createTownScene` has a new `hero?: 'alex'` option. It loads `town-hero-alex.glb?v=HERO_VERSION` in place of the player's styled townsperson; download progress includes the file.
   - `TownModal` passes `hero: 'alex'` when `state.character.id === 'alex'`. Every other character still plays as a townsperson.
   - `dressPlayer` takes a fit, and `HERO_APRON` (front .185, half .2, lift −.11) puts the café apron outside his jacket at chest height (`hero-apron-fit.jpg`).
   - The player never sits (only NPCs use `seatActor`), so his different hip height needs no `sitDrop`.

## Files here

- `hero-concept-to-model.jpg`: concept 2, Meshy's A-pose output, and the rigged rest pose.
- `hero-turnaround.jpg`: Blender EEVEE renders of the exported rig. From left: rest front, rest side, Idle, Walk, Run, Wave, Serve, Celebrate.
- `hero-in-game.jpg`: localhost:5189 with a fresh Alex save.
  - Top: the square at the default lens, and the bench next to Rosa.
  - Bottom: the closest camera (distance 2.6), and autumn at sunset.
- `hero-before-after.jpg`: the cart view in build 41 (Alex as a styled townsperson) next to the same view now. The fresh save has no cart yet.
- `hero-apron-fit.jpg`: the `dressPlayer` apron geometry rebuilt in Blender on the hero's Torso joint. In game the café camera only sees his back.
- `tests.log`, `build.log`.

## Measured

| | Build 41 (Alex as a townsperson) | Build 42 (AI Alex) |
|---|---|---|
| Player model | shared `town-people.glb` (8k visible triangles) | `town-hero-alex.glb`, 10,315 triangles, 1024² texture |
| Extra download | 0 | 502 KB (191 KB geometry, 214 KB texture, 98 KB clips) |
| Square view, High tier, shadow pass included | 815 draw calls | 494–559 draw calls (two captures on a fresh save); 696–699k triangles |

The draw-call numbers are not a controlled comparison: build 41 was measured on the older QA save (cart bought, different traffic and time of day). The hero adds one skinned mesh, so it costs at most two draw calls: the colour pass and the shadow pass. No physical phone or Chromebook was tested.

## Checks

- **Browser:** the GLB was requested with a 200 response, and the console had no errors.
- **Play-through:**
  - walked the square;
  - opened the café;
  - ran a practice shift;
  - saw the café apron in place.
- **Tests and build:** 401 tests / 71 files (one new: the hero GLB keeps the town joint names, identity rests, six clips, Draco and a size under 700 KB), plus the production build.

## Licensing (checked 2026-09-25)

Generated through Higgsfield on the paid Plus plan.

- **Ownership and commercial use:** Higgsfield's Terms of Use §4.4 say it does not claim ownership of outputs and does not restrict commercial use, on any plan. Rights survive cancellation.
- **Conditions:**
  - Higgsfield may use inputs and outputs to train its models.
  - Outputs may not be used to train other AI models.
  - IP indemnity is Enterprise-only.
- **Meshy:** Meshy's own help centre says paid-plan outputs belong to the user.

This is a reading of the published terms, not legal advice. Sources: <https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially>, <https://help.meshy.ai/en/articles/9992001-can-i-use-my-generated-assets-for-commercial-projects>.

## Known gaps and follow-ups

- **No blink.** The eyes are painted into the texture, so `createBlink` finds no `Blink` morph and does nothing for Alex.
- **Face texture.** Up close, the AI texture has soft light and dark patches on one cheek and the chin. At game distance they read as shading.
- **Walk bob (shared with every townsperson).** In `town_rig.add_clips` the hips sit lowest at mid-stance and highest at double support, the reverse of a natural gait, which makes the walk look crouched.
  - Fix: shift the bob's phase by the stance. That changes `town-people.glb`, so it needs a look first.
- **Real phone check.** Still open for the whole branch.
