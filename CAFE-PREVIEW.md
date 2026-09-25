# Little Square — playable art prototype

Prepared 13 September 2026. **Local preview; not deployed or merged into the original game.**

Open http://127.0.0.1:5195/cafe-preview.html while the local preview server is running.

## Try it

- Switch **Original / Updated** to compare the existing artwork with the café treatment.
- Use **Coffee cart**, **Café frontage**, and **Meet your character** for review viewpoints.
- **Serve a coffee** runs the existing approach, cup handoff and return animation.
- **Visit the café** walks to the building and enters; **Return to square** exits.
- Compare day, golden hour and night. Drag to orbit, scroll or use the zoom buttons, tap pavement to walk, or use WASD. Smaller screens also have directional buttons.
- Graphics can switch between automatic and smooth. Sound starts off.

This page instantiates the existing town controller with an in-memory demonstration café. It never reads or writes the player's financial save and does not perform transactions.

## Artwork and implementation

- Original Blender espresso machine: green enamel casing, brass controls and gauge, metal brewing heads, drip tray, steam wand and cups. The GLB is 44,928 bytes, 7,972 triangles, six meshes/materials.
- Editable scene: `assets/town/cafe-atelier.blend`. Only the new café scene is included. The separate pre-existing Blender project was restored as the active scene.
- Walnut cart fluting, curved striped canopy, new signage, soft contact shading and a practical canopy light.
- Deterministic locally drawn paving, wood and fine-grain textures; richer architectural palette and lower daytime fill.
- Featured player clothing and apron. Existing articulated rig and all six animation clips are retained; this is not a new deforming character rig.
- Foreground college cutaway improves the square view. Portrait framing widens to keep more context visible.
- Café interior receives coordinated surfaces and the same new machine.

Main change locations: `components/town/townAtelier.ts`, `townBusiness.ts`, `townCafeRoom.ts`, `createTownScene.ts`, `preview/`, `cafe-preview.html`, and the additional Vite entry. The `art: 'atelier'` option enables the treatment. The copied main application still uses its original default; only the isolated study opts in.

## Validation

- TypeScript and production build passed. Existing large-chunk warnings remain.
- 44 existing tests passed across controls, quality settings, activities, café service, café economics and guided navigation.
- Browser review at the desktop default viewport and 390×844: rendering, art comparison, character/frontage bookmarks, café entry/exit, coffee service completion, day/night controls, and responsive layout.
- Approximately 60 fps observed in this Mac's browser during the desktop review. A phone-sized viewport is not a physical-phone performance test.
- Blender machine render reviewed with combined, key-only and world-only lighting. Export contains only the six intended machine meshes.

No Unity integration, paid AI generation, credit spend, account setup or deployment was performed. Higgsfield's connected Blender tools were used for local asset authoring/export.

## Browser QA receipt

| Check | Result |
|---|---|
| Page identity and meaningful content | Pass — built Little Square page at local port 5195 |
| Framework error overlay | None observed |
| Browser errors/warnings | None in the built preview during final checks |
| Viewed visual evidence | Desktop cart, original/updated character, café interior, mobile day/night, golden hour |
| Interaction | Serve → handoff → completion; walk → café → return; original/updated preserves café room |
| Responsive | 390×844 layout inspected; cart framing widened; controls fit |
| Physical phone | Not tested |

Browser control used the in-app browser. The built preview was tested separately from the development server. Original project git status remained unchanged from the start of this work.

## Run later

This directory is a separate copy of the current working app, including the existing untracked UI files, excluding `.git`, private `.env` files and build caches. Local `node_modules` is a symlink to the original project's installed dependencies.

From this directory:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5195
```

For development: `npm run dev -- --host 127.0.0.1 --port 5194`, then open `/cafe-preview.html`.

Before any wider rollout, test on a physical iPhone/Android device, review the art direction, and integrate the selected changes into the original game deliberately. The whole town has not been remeshed or rebuilt.

## Gameplay clarity pass — 13 September 2026

The **full game at http://127.0.0.1:5195/** now uses the upgraded artwork in this separate copy. The café study remains a comparison playground; its actions do not change game money. Its footer links to the full game.

Implemented:
- Every interior opens with a short explanation of what to do, how to do it, and the financial or learning consequences. A dedicated button leads to the teller, broker, agent, manager, registrar or home desk and opens their real tools after arrival. The guide can be reopened.
- Free practice, paid owner shifts, monthly income, badges, quest rewards, education and wellbeing are distinguished. Garage is identified as vehicle management; Rosa is free advice. All amounts are fictional saved-game money.
- Notice board now opens after arrival, so opening the panel cannot freeze the walk halfway there.
- A blocked automatic walk replans around current vehicle footprints after a short pause. It retains solid vehicle collision rather than walking through cars.
- Home cash-flow estimates explicitly say before tax. Stock guidance distinguishes unrealized price gains from dividends. Selling clears the old purchase receipt.
- Café shift budget explicitly says it is simulated in free practice.
- Player apron appears in café/service contexts; everyday town visits use the normal outfit.
- Blender bistro set replaces upgraded café seating: curved bentwood chairs, upholstered seats, inset stone table and brass feet. Two sets preserve the central service aisle and the existing seats-upgrade visibility.

Blender asset: `public/models/town/bistro-furniture.glb` — 72,248 bytes, 8,696 triangles, four materials/draw calls per set. Editable source: `assets/town/bistro-furniture.blend`. Built through the connected Higgsfield Blender tools; no paid generation. Existing unrelated Blender scene retained with its 63 objects. Target geometry allowance adjusted from 8,000 to 9,000 triangles to retain round table and chair profiles.

Validation so far: production build succeeds; all 180 town/café tests in 38 suites pass, including new room-entry, desk re-entry, notice-board arrival and vehicle-detour regressions. Later targeted checks also pass. The test environment emits existing canvas-not-implemented warnings; rendered browser checks cover the actual WebGL view.

Browser checks use a separate local test save. Office → home → college → property → exchange → bank → businesses → cart routes and their action panels were exercised. A previously stalled exchange route reached its destination after the recovery fix. Test transactions: $501 index buy/sell reconciled; $500 savings deposit/withdraw reconciled; $1,504 cart purchase, $60 permit and a $18 net shift profit reconciled with receipts. Overtime used one of three monthly actions without immediate cash. The phone-size cart interface remained readable at 390×844. This is viewport testing, not testing on a physical phone.

Status: local preview only. Original project and production site unchanged. Unity excluded. Existing characters still use the established articulated rig and clips; this is an asset and interaction upgrade, not a new character animation system.

Final browser follow-through: café practice on 390×844 took orders, brewed and collected coffee, then ended early; the simulated −$15 result left game cash at $8,454. The new bistro furniture and espresso model were visible in that actual service view. Notice-board walk arrived before opening; claiming First Investment added exactly $150 and removed its claim button. Garage and Rosa were reached and their panels opened; reading Rosa's advice left cash unchanged. A final café-navigation regression passes (181 distinct town/café checks across the run); final production build passes. New explanatory guide prose is English in this preview; existing localized controls remain.


## Next gameplay pass — 13 September 2026

Phone-accessible draft: https://civic-preview--tycoonjan22026.netlify.app

This pass is a separate preview, not the production release. It adds smooth route corners and arrival braking, continuous joystick response, walk/run transition hysteresis and stride-phase preservation, keyboard text-field protection, multi-pointer joystick ownership, compact phone controls, and a reversible landscape “More room” view. It fixes the fractional-width mobile/desktop gap that could leave the dashboard blank around 767–768 CSS pixels.

Bank and property interiors now load locally authored Blender desks: teller 24,464 bytes / 3,388 triangles / 6 draws; estate 27,404 bytes / 3,648 triangles / 8 draws. Their original placeholders remain available if an asset fails to load. The editable source is assets/town/civic-atelier.blend. All new building-purpose guides have Spanish copy.

Validation: production build and 187 tests across 39 suites passed. Browser checked bank approach, teller service panel, cross-town walk to property, office entry, phone panel scrolling, joystick movement/release and landscape focus/restore. The fractional-width blank-dashboard issue was reproduced and retested successfully at the same width. Portrait and landscape were browser viewport checks, not physical-device performance or real multitouch tests. No paid AI generation was used.

Phone check: open the preview, start or resume an adult demo, enter the 3D city, walk to Bank, enter and approach the teller; then visit Property. Drag the joystick lightly and fully, release it, rotate the phone and try More room / Show menus. Verify smooth movement, readable panels and comfortable camera control. Higgsfield cinematic media remains a later step after this device check.

Final preview deploy: `6aa6bd9d31cf6b184a195544`. The previously approved production deploy remains `6aa6b9f27b7306f0932ec8e9`.


## Walk-through entrances — 13 September 2026
All seven adult-city buildings now enter automatically when keyboard or joystick movement pushes into the doorway. Narrow, directional thresholds prevent entry while passing a facade; a short transition lock prevents immediate re-entry. Existing buttons remain available, and the arrival guide still explains actions and consequences. This does not purchase anything or change money.

Verified bank and opposite-facing college entry with the visible movement joystick, arrival guides, and returning outside without automatic re-entry. All 68 test suites / 385 tests pass with two workers; the shared screen-size mock now respects desktop/mobile breakpoints. Build passes.

Published this pass to https://tycoonjan22026.netlify.app — deploy `6aa6c1041250a0db34bc7033`. Live homepage, scene bundle and both civic desk models match the tested build byte-for-byte. Higgsfield sign-in restored: 1,056 credits on Plus. User approved the single five-second Cinema Studio espresso-machine test. Submitted job `de5b99a9-a2a8-4061-808c-c9a6b1e3ed3b`, using reference `09c49555-1d05-4abe-b1e9-34cdadfd2721`; 16:9, standard mode, silent, slow camera orbit. Exactly 5 credits deducted; verified balance 1,051. Generation completed and was reviewed at the opening, midpoint and end using the browser player. Actual output: 5.041667 seconds, 1108 × 828 (approximately 4:3 despite the 16:9 request). Camera orbit and lighting are useful as a cinematic study; gauge/rail details and steam placement drift. Keep as a review clip; not added to the live game. No additional credits spent.

Cinematic review: https://d8j0ntlcm91z4.cloudfront.net/user_33sYoILWzmkuWMkVCTSQPsHnaRq/hf_20260913_153020_de5b99a9-a2a8-4061-808c-c9a6b1e3ed3b.mp4


## Café film released — 13 September 2026
The approved five-second film is now optional inside the café opportunities panel. It does not autoplay, pauses when collapsed, and clearly states it changes no game money, time or points. Production deploy: 6aa6c4b8d8321baa0111464d. Homepage, poster and MP4 match the tested build byte-for-byte. Live café UI and playback verified. No additional generation credits spent.

## Approved Alex released — 13 September 2026
User approved the character pilot and requested production. Promoted only the nine character integration, asset, source, test and comparison-page files. Production build and 387 tests in 69 suites passed. Deploy: 6aa6c7fa8dda57c6ba139c3b. Live homepage, Alex GLB and comparison HTML match the tested build. Existing Alex saves select the new model without reset; remaining characters retain their existing models pending the next pass.
