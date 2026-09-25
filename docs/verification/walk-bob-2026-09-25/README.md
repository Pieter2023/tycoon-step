# Build 43 — walk bob fixed (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

Pieter approved the fix on 2026-09-25.

**Problem.** The shared Walk clip (`scripts/town_rig.py`) had the hips' bob out of phase with the gait:
- The hips were lowest at mid-stance and highest in double support, the reverse of a real walk.
- The knees stayed about 51° bent under the body, so every walker looked crouched.
- At heel strike and toe-off the leg was asked to reach 0.852 against its 0.838 length, so the feet floated slightly.

**Fix.**
- The hips now peak at mid-stance (t = .3 and .8) and dip in double support: `rest − .054k + .025k·cos(4π(t − .3))`.
- The mid-stance knee is about 30°, and the stretched leg stays within reach (0.834).
- Run already dipped at mid-stance, which is correct for running, and is unchanged.
- The stride and timing are unchanged, so `CLIP_GROUND_SPEED` holds.

**Rebuilt.**
- `town-people.glb` and `town-hero-alex.glb`: only the Walk keys changed (max 0.17 rad); the other five clips are identical to the key.
- `assets/town/town-people.blend` was re-saved by the headless build.
- `PEOPLE_VERSION` and `HERO_VERSION` are now `20260925d`.

**Files.**
- `walk-before-after.jpg`: Blender, the same Walk frame (t = .25) before (left) and after (right).
- `walk-in-game.jpg`: localhost:5189, Alex walking along the promenade.
- `tests.log`: 401 tests / 71 files.
- `build.log`: production build.
