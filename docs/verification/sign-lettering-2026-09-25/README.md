# Build 48: lighter sign lettering (2026-09-25, branch `town-lighting-pass`, not merged or deployed)

From the assessment's visuals list ("replace the 3D sign lettering … −130k triangles").

**What changed.**
- **Letters in the city model.** The eight shop signs' letters are Blender font curves converted to mesh (`text()` in `scripts/build-town-assets.py`). They used the font's default curve resolution (12) plus a bevel, which made about half of the city's triangles. They now use resolution 3, no bevel, and the same slight raised depth.
- **Triangles.** `freedom-square.glb` 246,424 → 121,556 triangles; 1,163,764 → 894,944 bytes. The whole square view drew about 690k triangles with the shadow pass; after the change it draws about 440k.
- **Model version.** `MODEL_VERSION` → `20260925a`, so browsers fetch the new city and vehicles.

**How it was made safely.**
- The build script writes into the project and also regenerates the retired `town-character` files kept for rollback. So a copy ran against a scratch root first.
- That copy reproduced the committed city exactly (the same 246,424 triangles; 12 bytes of metadata differ).
- The changed copy's GLB and `.blend` replaced the city's files only. `town-character.*` was not touched.

**Look.** `lettering-day-night.jpg` shows the bank and Exchange signs up close by day and at night, with no visible faceting on curved letters. `square-view.jpg` shows the standard square view.

Also here: the Main Street window displays moved to the middle of the window glass (x offset 1.5 → 1.85, 1.0 × 0.63). The bank pillar had hidden the first word of the note.

**Checks.** 432 tests / 77 files and the build pass (the city test still checks Draco and a size under 2 MB).
