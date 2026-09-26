# Build 58: a real wave, a Sit clip and tapered hair (2026-09-25, branch `town-lighting-pass`)

These are the character items from the visual list in HANDOVER §1b and assessment §3: the Wave armpit crease, a Sit clip and hair polish. **Not released.**

## Wave

**Before** (`wave-townspeople-before-after.jpg`, top row; `wave-hero-before-after.jpg`, left):
- Everyone's arm went straight out to the side, and the elbow folded the forearm back to the neck. It read as scratching the neck, not waving.
- On the townspeople, the sideways raise stretched the jacket into a web from the ribs to the elbow.

**Now** (`scripts/town_rig.py`):
- **Aimed, not angled.** The upper arm points out, forward and a little down, about 60° from hanging, so the armpit opens far less. The forearm stands up beside the head with the hand clear of the face, and it sweeps side to side. Joint rotations come from target directions (`rotation_difference`); Euler angles kept landing the hand on the face.
- **Weights.** `tether_torso_sides()` in `scripts/build-town-people.py` gives most of the shoulder's weight on torso vertices below the armpit to the Torso bone, fading toward the armpit. The arm itself (anything within reach of its axis) keeps its weights. This trims what is left of the web; Idle, Walk and Celebrate are unaffected.
- **Both models.** The townspeople and the hero share the clip.
- **In the game** (`wave-in-game-manager.jpg`): the office manager waves as the player walks up.

## Sit (a new seventh clip)

**Before:** seated people (the bench sitters, the café guests, the office workers, the college students) played the standing Idle clip. The code then bent the legs onto the seat, and the arms hung straight down into it.

**Now:**
- **The clip.** `Sit` has the hands resting on the thighs, a slight lean back and slow breathing (`sit-blender.jpg`: townspeople and the hero).
- **Legs.** The legs are still set per seat (`seatActor`, the café chairs) after the mixer runs.
- **Where it plays.** `seatedClip()` in `createTownScene.ts` plays `Sit` wherever someone sits, and falls back to Idle for a model without it.
- **In the game** (`sit-in-game-office.jpg`): both office workers sit at their desks with their hands forward.

**A bug the clip exposed:** `sitHips` lowered the hips 12.5 cm every frame, relying on the clip to put them back first. three.js's mixer only writes a joint when its value changes, so under a still clip the office workers sank 23 m through the floor.
- The same happened already with Idle at dt 0 (reduced motion, or paused): seated people sank.
- `sitHips` now applies the drop once per value the mixer writes. Test: `test/TownPeople.test.ts`.

## Hair

**Before** (`hair-before-after.jpg`, top): the short hair stopped in a flat, bowl-shaped edge at mid-head, with bare skull below it at the back.

**Now** (bottom): two smaller, narrower pieces under the back of the cap (`cap_of_hair`) taper the hair down to the nape. The ponytail and the long hair share the cap. There are no triangle changes (the hair is still decimated to its budget).

## Files and versions

- **Rebuilt:** `town-people.glb` (511 → 526 KB) and `town-hero-alex.glb` (509 → 523 KB); the new clip adds about 14 KB each.
- **Versions:** `PEOPLE_VERSION` is `20260925e` and `HERO_VERSION` is `20260925g`. `assets/town/town-people.blend` was rebuilt with them.
- **Determinism:** the people build gives the same accessors and bounds as before, with float noise in the binary. The hero build stays byte-deterministic.

## Checks

- **Tests:** 483 tests / 85 files, TypeScript and the production build pass.
  - The clip lists in `TownControls` and `TownLife` now include `Sit`.
  - There is a new `sitHips` idempotence test.
- **Browser:** checked in the city at `localhost:5191` with `__town.advance` and the capture receiver.
