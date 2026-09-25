# Build 40 — lighting pass (QA build, localhost:5188, in-app browser, 2026-09-25 13:00–13:45 PDT)

Branch `town-lighting-pass` (three commits on top of `073f397`). Not merged, not deployed.

`lighting-before-after.jpg`: left column is the Sept-13 atelier state as found (commit `263aeeb`), right column is the lighting pass plus the new camera. Same save (Alex, month 2), same player position, summer palette forced with `__town.setSeason('summer')`, canvas 2300 × 995 (1440 × 900 viewport, pixel ratio 1.6), High tier except the last row (Smooth). Before and after rows use each version's default follow camera; the night row uses the same street view (pitch .26, 8 m) for both.

How the frames were captured: the browser pane was hidden for most of the session, which pauses the animation loop (`document.hidden`). The new dev-only `__town.advance(frames)` runs and renders frames directly, so `canvas.toDataURL()` in the same task returns the rendered frame; the images were posted to a local receiver in the session scratchpad. This removes the "QA browser must be visible" constraint noted on 2026-09-06.

Tuning path (all captured, not kept):

- v1: Neutral tone mapping + sky environment + hemisphere cut to .28. Midday barely changed; night far too dark.
- v2: sun path offset to the south-east and peaking near 52°, because at midday the sun sat almost behind the default camera and hid every shadow. This was the change that made the difference.
- v3: night fill and exposure lift (nightHemi 2.4, nightExposure 1.9) and a brighter moonlit sky colour.
- Camera: pitch .6 / 10.5 m cropped the storefront signs; kept pitch .45 / 11.5 m / 40° field of view.

Interiors: bank lobby compared with `__town.toneMapping('aces' | 'neutral')` under the unchanged room lighting; same brightness, slightly warmer floor and sofas under Neutral, so `interiorExposure` stays 1.

Phone (390 × 844, Balanced tier): sky dome visible above the rooftops; the player is about 10% smaller on screen than before (distance 18.8 m at 52° versus 14.8 m at 58°).

Size: `createTownScene` chunk 118.33 kB / 44.58 kB gzip. Dev handles are absent from the production chunk (`advance`, `__town`, the tone-mapping switch: 0 matches).

Validation: 395 tests / 70 files (`tests.log`), production build (`build.log`). Physical phones and Chromebooks were not tested; the sky recapture (128 px PMREM, at most twice a second when the sky changes) is the new per-frame risk to watch on low-end GPUs.
