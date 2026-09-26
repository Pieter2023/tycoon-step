# Start here — Tycoon handover

Updated **September 26, 2026, 09:25 PDT**. **Build 66, the sound audit and upgrade, went live at 09:16 PDT** (release 10, `main` = `6bb25f1`, deploy `6ab7efe0`; §1c). **Builds 40–65 were live** after nine releases (four on Sept 25, five on Sept 26), each with Pieter's go-ahead. **Analytics are on** (build 65, release 9): Umami Cloud Hobby, Website ID `a8297643-15e9-4122-95b8-0b49cf4a7f98`. Receipts, live checks and one-line rollbacks: `docs/verification/release-2026-09-25/`.

**This session** (Sept 26, 06:00–08:20 PDT) ran the real-phone check of builds 52–59 (56–60 fps on the iPhone), then built and released builds 60–64:

| Build | What | Receipt | Released |
|---|---|---|---|
| 60 | Dialogs fit a phone: the shared `Modal` scrolls, so the Sales quiz and Save and load keep their buttons on screen | `phone-2026-09-26/` | 06:45, release 5 |
| 61 | Tileable paving, brick and asphalt, painted at runtime with normal maps (`townSurfaces.ts`); walls got their own materials | `surfaces-2026-09-26/` | 07:13, release 6 |
| 62 | The phone check's findings: events framed where they happen (`EVENT_PLACES`, a Property & Co. place), ‹ › on the destination row, a one-row room bar and journey strip on phones | `phone-findings-2026-09-26/` | 07:41, release 7 |
| 63 | The 3D city is the default screen ("Start in the 3D city" is on unless switched off) | `phase1-slice4-default-2026-09-26/` | 08:02, release 8 |
| 64 | The hero's cheek: the face's shading normals are relaxed at build time, and no vertex moves | `hero-cheek-2026-09-26/` | 08:02, release 8 |
| 65 | Analytics on: Umami Cloud (free Hobby) in Pieter's account, snippet in `index.html` limited to the live domain; `app_loaded` confirmed arriving | release 9 in `release-2026-09-25/` | 08:40, release 9 |

**The session before** (Sept 25) built 40–59, starting from a full game assessment:
- the art upgrade: the lighting pass (40), skinned townspeople (41), the AI-modelled Alex (42), the walk-bob fix (43) and lighter sign lettering (48);
- the economy: Phase 0 (44), property costs and loans (49), pacing (52) and course rewards that pay a raise (55);
- fixes and plumbing: the traffic deadlock (45), unique asset ids with a production-save migration test (51);
- Phase 1, the city as the game: wealth you can see (46), sleep and events in the world (47), "Start in the 3D city" as an opt-in (50), the Freedom Track (53) and events staged in 3D (54);
- the visual list: the hero blink (56), a cleaner hero face (57), a real wave, a Sit clip and tapered hair (58), and baked city AO (59).

Read sections 1–6 first. The numbered list under "Completed (chronological record)" is the history.

## 1. Where things stand

| What | State |
|---|---|
| Production (Netlify `tycoonjan22026`, auto-deploys `origin/main`) | **Builds 40–66 are live** after ten releases, each with Pieter's go-ahead:<br>• 40–51 at 17:21 PDT, deploy `6ab70fda`;<br>• 52–54 at 18:19 PDT ("ship it"), deploy `6ab71d6d`;<br>• 55–57 at 21:01 PDT ("ship it, release 55-57"), deploy `6ab743ad`;<br>• 58–59 at 22:27 PDT ("ship it, release 58-59"), deploy `6ab757c4`;<br>• 60 on 2026-09-26 at 06:45 PDT ("ship it, release 60"), deploy `6ab7cc8d`;<br>• 61 on 2026-09-26 at 07:13 PDT ("ship it, release 61"), deploy `6ab7d2f2`;<br>• 62 on 2026-09-26 at 07:41 PDT ("ship it, release 62"), deploy `6ab7d981`;<br>• 63–64 on 2026-09-26 at 08:02 PDT ("ship it, release 63-64"), deploy `6ab7de71`;<br>• 65 (analytics) on 2026-09-26 at 08:40 PDT ("drive this"), deploy `6ab7e74f`;<br>• **66 (sound) on 2026-09-26 at 09:16 PDT** ("ship it, release 66"): `origin/main` = `6bb25f1`, deploy `6ab7efe0`.<br>Before that, production was a Sept-13 **CLI** deploy (`6aa6c7fa`), not `origin/main` (`073f397`). Receipts, live checks and one-line rollbacks: `docs/verification/release-2026-09-25/`. |
| Branch `codex/game-overhaul-20260503-223748` | The old release branch at `073f397` (build 39); now behind `main`. |
| **Work branch `town-lighting-pass`** (checked out) | Pushed to `origin`. `main` was fast-forwarded to it for each release, most recently at `5ab30ca` (release 9, build 65). Later commits, such as the release-9 receipt, stay ahead of `main` until the next release; only `main` auto-deploys. See the commit list below. |
| Local `main` | Stale (99 behind `origin`). Never run `git checkout main` in this folder: its old history tracks `node_modules`, `dist` and `.env.local`. |
| Untracked, left on purpose | `graphify-out/` and `espresso-machine.png`. Also seven files deleted as dead code in `3d55d82` that have reappeared on disk: `components/ActionCard.tsx`, `components/CharacterSelect.tsx`, `components/FinancialFreedomBreakdown.tsx` and its test, `components/NewUiRoot.tsx`, `components/v2/DashboardScreen.tsx`, `components/v2/DashboardScreenEnhanced.tsx`, `components/v2/SidebarShell.tsx`. Nothing imports them. Delete them or leave them, but don't commit them. |
| Validation on the branch | 518 tests / 89 files, TypeScript and the production build (build 66, live). |
| Servers | Left running at the end of this session:<br>• `tycoon-lan-preview` on `0.0.0.0:5190`, serving the builds 63–64 `dist/` for the phone (`http://192.168.1.80:5190/?stats`);<br>• `tycoon-qa-5191` (a Vite dev server) on `localhost:5191`.<br>Older chats' Vite dev servers from Sept 25 may still hold 5188 and 5189; don't rely on them. The capture receivers were stopped. Pieter's own save lives on `127.0.0.1:5187` and was never touched. |
| Higgsfield (connected MCP) | Plus plan, 427.33 credits left. 2.5 were spent on concept images and 38 on the Alex model (Pieter approved up to 50). |
| Blender | 5.2.1 at `/Applications/Blender.app`. The Blender MCP add-on was connected. The open file has a `TownPeople` scene I added; the window was switched back to Pieter's `Scene`. Build 42 ran headless only and did not touch the live session. |
| Phone | Pieter's iPhone is reachable through macOS iPhone Mirroring (computer-use app `iPhone Mirroring`; clicks need full-screen control, background clicks do nothing). Checks passed: build 43 at 60 fps (`phone-2026-09-25/`); builds 52–59 at 56–60 fps on Detailed for 3 minutes, 60 on Auto (`phone-2026-09-26/`); build 61's textures at 58–60 fps on Detailed; build 62's layout at 60 fps. Tips are in §6. |

**Commits on `town-lighting-pass`, oldest first:**
1. `263aeeb`: snapshot of the Sept-13 atelier work, which was uncommitted until then.
2. `98ce027`: lighting.
3. `e1ab846`: camera.
4. `ff2dc6a`: docs.
5. `9a26f4d`: skinned townspeople.
6. `72ba80d`: docs.
7. `22b08f9`, `5092665`: handover docs and the backup-push note.
8. `14f93ed`: the AI-modelled Alex (build 42).
9. `0dc81d2`: walk bob in phase with the gait (build 43).
10. `08d6e74`: `?stats` readout and the first phone check.
11. `8fc78bf`: economy fix, Phase 0 (build 44).
12. `c627dc9`: traffic deadlock fixed (build 45).
13. `b1997af`: Phase 1 slice 1, wealth you can see (build 46).
14. `0000bd1`: Phase 1 slices 2–3, sleep and events in the world (build 47).
15. `c354281`: lighter sign lettering (build 48).
16. `6514911`: property costs, PMI, one FHA loan, no lender re-roll, slower credit (build 49).
17. `4d3c30b`, `fee4f2a`: handover docs, then the "Start in the 3D city" setting as work in progress.
18. `aa9fea8`: the "Start in the 3D city" setting finished, tested and checked in the browser (build 50).
19. `15c4812`: unique asset ids and a real production save as a migration test (build 51). **Released: `main` = `15c4812`.**
20. `5c3c0a9`: release receipt; the harness runs any difficulty.
21. `388c9bc`: pacing (build 52): "free in about N years at this pace", Maria's student budget, and each difficulty's description states its pace. Receipt: `docs/verification/pacing-2026-09-25/`.
22. `736a0a7`: Phase 1 slice 5, the Freedom Track (build 53): one milestone track in four chapters, with story and side goals alongside and energy and stress leading the meters. Receipt: `docs/verification/phase1-slice5-2026-09-25/`.
23. `2c462a7`: events staged at their place in 3D (build 54): a marker at the event's place, a letter on the doorstep, hazard lights on the parked car. Receipt: `docs/verification/event-stage-2026-09-25/`.
24. `a2d6207`, `4436196`: handover docs. **Released: `main` = `4436196`** (builds 52–54, Netlify deploy `6ab71d6d`).
25. `61a80be`: release-2 docs.
26. `3364c54`: the course rewards (build 55): a lasting raise instead of cash and a $150 retake fee. Receipt: `docs/verification/course-rewards-2026-09-25/`. **Not released.**
27. `b9e41a6`: build-55 docs.
28. `e135de3`: the hero Alex blinks (build 56): eyelid meshes on the Head joint, stored open. Receipt: `docs/verification/hero-blink-2026-09-25/`. **Not released.**
29. `e09ec4b`: cleaner face texture for the hero (build 57): Meshy's seam lines replaced with the local 3D skin tone. Receipt: `docs/verification/hero-face-2026-09-25/`.
30. `21f7771`: builds 56–57 docs. **Released: `main` = `21f7771`** (builds 55–57, deploy `6ab743ad`; receipt in `docs/verification/release-2026-09-25/`).
31. `8c9961c`: release-3 docs.
32. `a36d1b8`: a real wave, a Sit clip and tapered hair (build 58). Receipt: `docs/verification/characters-polish-2026-09-25/`.
33. `6bde70f`: baked ambient occlusion for the city (build 59). Receipt: `docs/verification/city-ao-2026-09-25/`.
34. `e3097ca`: builds 58–59 docs. **Released: `main` = `e3097ca`** (builds 58–59, deploy `6ab757c4`).
35. `b689c41`: release-4 receipt; then `e010f24`, the 06:00 handover.
36. `e8e1d16`: build 60, dialogs fit a phone (`components/Modal.tsx`), found by the phone check of builds 52–59. Receipt: `docs/verification/phone-2026-09-26/`. **Released: `main` = `e8e1d16`** (deploy `6ab7cc8d`).
37. `9bed375`: the release-5 receipt.
38. `1bc4d4e`: build 61, tileable paving, brick and asphalt (`components/town/townSurfaces.ts`, `dressTown`, wall materials in `scripts/build-town-assets.py`, `MODEL_VERSION` `20260926b`). Receipt: `docs/verification/surfaces-2026-09-26/`. **Released: `main` = `1bc4d4e`** (deploy `6ab7d2f2`).
39. `c079952`: the release-6 receipt.
40. `7a4d644`: build 62, the phone check's findings (`services/townEvents.ts` `EVENT_PLACES`, the `property` stage, the destination scroll buttons and the phone room bar in `TownModal`/`town.css`). Receipt: `docs/verification/phone-findings-2026-09-26/`. **Released: `main` = `7a4d644`** (deploy `6ab7d981`).
41. `f9a6d40`: the release-7 receipt.
42. `9f3cdf1`: build 63, the 3D city is the default screen (`App.tsx` `startInCity`, `test/StartInCity.test.tsx`).
43. `cc2df03`: build 64, the hero's cheek (`smooth_face_normals()` in `scripts/build-town-hero.py`, `HERO_VERSION` `20260926a`). Receipt: `docs/verification/hero-cheek-2026-09-26/`. **Released with build 63: `main` = `cc2df03`** (deploy `6ab7de71`).
44. `23ac83c`: the release-8 receipt.
45. `9e8a52c`: the end-of-session handover; `fc91480`: the daily challenge stays demo-gated.
46. `5ab30ca`: build 65, analytics on (Umami). **Released: `main` = `5ab30ca`** (deploy `6ab7e74f`).
47. The release-9 receipt.

## 1b. Where the last session stopped (2026-09-26, 08:20 PDT)

**Live: builds 40–65**, in four releases on 2026-09-25 and five on 2026-09-26. Each has a receipt, live checks and a one-line rollback in `docs/verification/release-2026-09-25/`:

| Release | Builds | Time (PDT) | `main` | Netlify deploy |
|---|---|---|---|---|
| 1 | 40–51 | 17:21 (Sept 25) | `15c4812` | `6ab70fda` |
| 2 | 52–54 | 18:19 | `4436196` | `6ab71d6d` |
| 3 | 55–57 | 21:01 | `21f7771` | `6ab743ad` |
| 4 | 58–59 | 22:27 | `e3097ca` | `6ab757c4` |
| 5 | 60 | 06:45 (Sept 26) | `e8e1d16` | `6ab7cc8d` |
| 6 | 61 | 07:13 | `1bc4d4e` | `6ab7d2f2` |
| 7 | 62 | 07:41 | `7a4d644` | `6ab7d981` |
| 8 | 63–64 | 08:02 | `cc2df03` | `6ab7de71` |
| 9 | 65 (analytics) | 08:40 | `5ab30ca` | `6ab7e74f` |
| 10 | 66 (sound) | 09:16 | `6bb25f1` | `6ab7efe0` (current) |

Build 66 (sound, §1c) went live in release 10. The branch is ahead of `main` only by docs (the release-10 receipt). There is no unreleased code.

**Pieter's calls this session:** "ship it" for each release, and "yes to all 3" on his open decisions:
- **The city as the default screen:** done (build 63). The ledger drawer, the plan's other half of slice 4, is **not built**. Ask before building it.
- **The hero's cheek:** done (build 64). It is done in code, by relaxing the shading normals. Moving the vertices was tried first and slid the painted eyes out from under the eyelids.
- **The daily challenge's demo gate:** **kept**. Pieter confirmed on 2026-09-26: "keep the daily challenge demo-gated". There was no code change.

**Next, in order:**
1. ✅ The daily challenge stays demo-gated (Pieter confirmed).
2. **A Chromebook check**, the classroom device. It has never been done, and it matters more now that the city is the first screen. It needs Pieter or a Chromebook on the network.
   - Use the LAN preview and `?stats`, like the iPhone.
   - Watch the load time, the fps on Auto, and whether the graphics governor steps down.
   - If WebGL is missing, the city falls back to its text panels.
3. **The ledger drawer**, only if Pieter wants it: a half-height money sheet opened from inside the city (`docs/phase1-plan.md`, slice 4).
4. **Visual items never started** (assessment §3): a modular building kit to replace the box shopfronts; splitting the city into blocks for culling; the male hip/waist ratio. Also the hero's remaining texture lines: the forehead lines and the line above the nose (build 57 receipt).
5. ✅ **Analytics: on** (build 65, release 9 at 08:40 PDT). Pieter signed up for Umami Cloud himself, and Claude did the rest.
   - **Site:** "Tycoon", on the Hobby plan ($0, 100K events a month, 6-month retention). Website ID `a8297643-15e9-4122-95b8-0b49cf4a7f98`.
   - **Dashboard:** https://cloud.umami.is/analytics/us/websites/a8297643-15e9-4122-95b8-0b49cf4a7f98 (Pieter's Google account `pieterhouseofrealtors@gmail.com`).
   - **Snippet:** `index.html`, with `data-domains="tycoonjan22026.netlify.app"`, so local and LAN QA is not counted. The funnel events come from `services/analytics.ts`.
   - **Verified live:** Umami's realtime view showed the pageview and `app_loaded`.
   - **Excluding QA:** the browser pane's production origin has `localStorage['umami.disabled']='1'`. Set the same in any browser whose visits should not count.
   - **Next:** after a week or two of traffic, read the funnel (demo started → wall hit → unlock opened → Gumroad click → purchase). A Umami Funnel report can be set up in the dashboard.

**QA state:**
- **The browser pane's production origin** (`tycoonjan22026.netlify.app`) holds the throwaway Alex save at month 8 ($10,091, Sales certified in release 3).
  - It has no `tycoon_start_in_city` key, so Continue opens the city (checked after release 8).
  - It was continued after each release, never advanced.
- **`localhost:5191`** (`tycoon-qa-5191`) holds the production fixture save at month 8, with first steps reviewed and `tycoon_start_in_city=1`. To reload the fixture: see §5.
- **The phone's LAN origin** (`192.168.1.80:5190`) holds an Alex save at month 2, with graphics on Auto.
- **Blender's live session** was not touched; every build ran headless. The capture receivers are stopped.

## 1c. Build 66: the sound audit and upgrade (live since 2026-09-26, 09:16 PDT, release 10)

Pieter switched the city's sound on at the bank teller, and it "tweeted loudly like a broken speaker". Receipt, measurements and listening files: `docs/verification/sound-2026-09-26/`.

- **The cause:** the night-cricket layer (`components/town/townAtmosphere.ts`) connected a 27 Hz square LFO straight into its gain. An audio-rate input adds to a gain's value, so a 4.3 kHz whine played at −10.5 dBFS RMS in every place and at every hour whenever city sound was on, about 15 dB louder than anything else. It is fixed, and `test/Sound.test.ts` guards it (the test fails on the old file).
- **A second bug:** a new gain sits at 1.0 until its first event, so a sound starting a hair after a sample boundary let one full-scale sample through, a crack up to −0.4 dBFS after a high-pass. `envelope()` in `services/soundDesign.ts` zeroes it first.
- **One engine** (`services/audioService.ts`): one AudioContext instead of two, a limiter (the master trims the compressor's automatic +5.7 dB), a generated room reverb, and `ui` and `world` buses. It:
  - creates no audio before the first click;
  - pauses when the tab is hidden and when muted;
  - drops a toast chime that follows an action sound;
  - plays repeated month sounds quieter during fast autoplay.
- **Every sound redesigned:**
  - the UI sounds in `playUiSound`, all in C major: a ka-ching, a coin that gains notes with the amount, a fanfare;
  - the city in `townSfx`: gusting wind, rain with drops, a babbling fountain, crickets with real rhythms, three birds, varied footsteps, Doppler car passes panned by the camera, firework booms, café bells.
- **One sound switch:** the city's Sound button now shows and sets the game's sound (`soundOn`/`onToggleSound` from App). So the city soundscape plays by default when sound is on, starting at the first click. Before, the city started muted on every visit, and its "Sound off" still let purchase beeps play. Pieter can reverse this default.
  - Money Quest's square keeps its own switch.
- **Checked:** 518 tests / 89 files, `tsc` and the build. Live in the dev build with an `AnalyserNode` on the output (`window.__audio.output`, dev only):
  - at the teller, sound off and on again: −54 dBFS RMS and no 4.3 kHz;
  - walking the street with traffic: peak −29.
- **Not done:** an ear test. Pieter should listen to `audio/bank-before-then-after.m4a` (turn the volume down for the first 3 s) and the `after-*` files, then say what to change.
- **Released** on Pieter's "ship it, release 66": deploy `6ab7efe0`. On the live site, at the teller with sound switched off and on, the output measured −52.9 dBFS RMS with nothing at 4.3 kHz. The receipt and a one-line rollback are under release 10 in `docs/verification/release-2026-09-25/`. The engine ships in the shared `investmentModel-*.js` chunk, not `main-*.js`.

## 2. Decisions waiting on Pieter

1. ✅ **Shipped** 2026-09-25 (builds 40–51; `docs/verification/release-2026-09-25/`). The notes below are kept for the record.
   - Review `docs/verification/lighting-2026-09-25/lighting-before-after.jpg`, `docs/verification/characters-2026-09-25/characters-before-after.jpg` and `docs/verification/hero-alex-2026-09-25/`, or play the branch as Alex.
   - Then merge into the release branch and push `main`, which auto-deploys.
   - Do a real-phone check first. The new costs are the skinned people, the sky recapture and the 502 KB hero download.
2. **The economy fix is done** (build 44, approved 2026-09-25): see `docs/verification/economy-2026-09-25/`. **Pacing was delegated to Claude on 2026-09-25** ("decide whatever you think works best overall"); the decision and its numbers go in §3.
3. ✅ **The Daily Challenge demo gate: kept.** Pieter confirmed on 2026-09-26 ("keep the daily challenge demo-gated"). The GTM analysis had recommended opening it to the free demo (CLAUDE.md, GTM section); he decided against that.
4. **Walk bob:** fixed in build 43 (approved).
5. **Phase 1:**
   - **Slice 4:** ✅ the city is the default screen (Pieter's yes on 2026-09-26; build 63, live since 08:02 PDT). The "ledger" drawer is not built. The Chromebook, the classroom device, is still untested.
   - **Slice 5:** built as the Freedom Track (build 53). Say what to change.
6. ✅ **Builds 52–54 shipped** on 2026-09-25 at 18:19 PDT ("ship it"; `docs/verification/release-2026-09-25/`).
7. ✅ **Course rewards: live** (build 55, release 3 at 21:01 PDT; receipt `docs/verification/course-rewards-2026-09-25/`). Certified negotiators on existing saves now get the corrected, slower growth.
8. ✅ **Builds 56–59 shipped** (releases 3 and 4). Pieter saw the AO before-and-after and said "ship it".
9. ✅ **The hero's cheek shading step:** Pieter said yes on 2026-09-26; fixed in build 64 (`docs/verification/hero-cheek-2026-09-26/`), live since 08:02 PDT.
10. ✅ **Analytics: on** since 2026-09-26 (build 65; §1b item 5).

Done 2026-09-25: Pieter picked **concept 2** and approved up to 50 credits; the AI Alex cost 38 (receipt: `docs/verification/hero-alex-2026-09-25/`). Still: never spend credits without a fresh yes.

## 3. Next steps, in recommended order

1. ✅ **Economy fix (Phase 0)**, build 44: price drift from expected returns, saturating businesses that can lose money, shortfalls on a credit card, monthly tax withholding, the 4% rule toward freedom, and `test/StrategyRanking.test.ts`. The smaller §1 issues remain.
2. ✅ **Traffic deadlock** fixed in build 45 (`docs/verification/traffic-2026-09-25/`).
3. **The city as the game (Phase 1)**, plan in `docs/phase1-plan.md`:
   - ✅ slice 1, wealth you can see: freedom meter in the city header, window displays, the Freedom Fountain, milestone moments (build 46);
   - ✅ slices 2–3: sleep at home to end the month with morning mail; events open over the city with a place line (build 47);
   - ✅ slice 4: "Start in the 3D city" as an opt-in (build 50), the default since build 63 (`docs/verification/phase1-slice4-default-2026-09-26/`). The ledger drawer is not built;
   - ✅ slice 5, one milestone track: the Freedom Track (build 53);
   - ✅ events staged at their place in 3D (build 54): the marker, the doorstep letter and the car's hazard lights.
   - ✅ course rewards (build 55, live): a lasting raise instead of cash, a $150 retake fee, and two course bugs fixed.
4. **More visuals:**
   - ✅ lighter sign lettering (build 48: −125k triangles; kept 3D, dropped the bevel and curve resolution);
   - ✅ AO bake (build 59, live); ✅ tileable textures for pavement, brick and road (build 61, live; `docs/verification/surfaces-2026-09-26/`);
   - ✅ hair polish, the armpit crease in Wave and a Sit clip (build 58, live);
   - ✅ a blink for the hero Alex (build 56, live);
   - ✅ an even skin tone on the hero's face texture (build 57, live), and the cheek's shading step smoothed (build 64, live).
5. **Phone**: ✅ iPhone checks passed at build 43 (60 fps) and builds 52–59 (56–60 fps; `docs/verification/phone-2026-09-26/`), which found builds 60 and 62. A Chromebook is still untested (§1b item 2).
6. ✅ **Analytics: on** (build 65). Read the funnel once there is traffic (§1b item 5).

## 4. What Pieter wants (standing)

- A polished, stylised city inspired by The Sims, with a character-following camera and financial learning through doing.
- Simple controls and short explanations.
- On 2026-09-25 he asked for the lighting pass on a branch first, then chose the **hybrid** character route: a free Blender-built cast now, and an AI hero only after he approves a concept.
- Explain paid tiers and costs before introducing a paid tool, and get a yes before spending Higgsfield credits.

## 5. How to run and verify

```sh
cd '/Users/pietervanderwalt/Desktop/Current High Value Apps/tycoon-step-main 2'
git status --short && git log --oneline -8
npm run test:run          # 498 tests / 88 files on the branch
npm run build
npx vite --host 127.0.0.1 --port 5188 --strictPort   # or preview_start "tycoon-qa-5188" (.claude/launch.json)
'/Applications/Blender.app/Contents/MacOS/Blender' --background --factory-startup --python scripts/build-town-people.py   # then bump PEOPLE_VERSION
'/Applications/Blender.app/Contents/MacOS/Blender' --background --factory-startup --python scripts/build-town-hero.py     # then bump HERO_VERSION; TYCOON_PREVIEW=<dir> renders QA stills
'/Applications/Blender.app/Contents/MacOS/Blender' --background --factory-startup --python scripts/build-town-assets.py   # the city incl. the AO bake (~70 s); then bump MODEL_VERSION
```

Two side effects of those scripts:
- `build-town-people.py` also saves `assets/town/town-people.blend`, and `build-town-assets.py` rewrites the legacy `town-character.glb` and `.blend`. For scratch builds, redirect `OUT_GLB`, `OUT_BLEND`, `OUT` and `SOURCE` (exec the script with those lines replaced), and `git checkout` the legacy character files after a real city build.
- The hero build is byte-deterministic. The people build differs only by float noise (same accessors and bounds).

**QA save on `localhost:5188`:** Alex, month 2, $11,249 cash, cart bought and licensed, investor journey 2/4. To reach the city: Continue Adult → Enter 3D city.

**Later QA saves:**
- `localhost:5189`: Alex at month 4 or 5, with a coffee cart and `tycoon_start_in_city=1`. It runs on the previous chat's server.
- `localhost:5191` (`tycoon-qa-5191`): the production fixture save (`test/fixtures/save-production-2026-09-13-month7.json`), played on to month 8, with first steps reviewed and `tycoon_start_in_city=1`, so Continue lands in the city. It was used for the builds 51–54 checks. To reload the fixture: `fetch('/test/fixtures/save-production-2026-09-13-month7.json')` → `localStorage.tycoon_saves_v2`.

### Visual QA with a hidden browser (added 2026-09-25)

The in-app browser pane is often hidden (`document.hidden` is true), which pauses the city's animation loop. Dev builds expose these handles; production builds strip them.

| Handle | What it does |
|---|---|
| `__town.advance(frames)` | Steps the simulation and renders the frames directly, even while hidden |
| `__town.setView({x,z,yaw,pitch,distance})` | Puts the player and camera at an exact view |
| `setPhase(p)` | Time of day: 0 sunrise, .25 noon, .5 sunset, .75 midnight |
| `setSeason(s)`, `setQuality(mode)` | Season and graphics tier |
| `__town.info()` | Draw calls and triangles for the last frame, shadow pass included |
| `__town.lighting` | The live light balance, editable |
| `__town.toneMapping('aces'\|'neutral')` | Switches the tone curve for comparisons |
| `__town.fountain(level)`, `__town.moment('ribbon'\|'coins'\|'fireworks')` | Freedom Fountain fill (0–1) and milestone moments (build 46) |

Capture recipe:

1. Run `python3 scripts/qa/capture-receiver.py <scratch-dir> [port]` in the background. The default port is 5199; if an older chat still holds it, pass 5198 and use that port in `__snap`.
2. In the page:
   ```js
   window.__snap = async (name, frames = 100) => { __town.advance(frames); const c = document.querySelector('canvas[role=application]'); await fetch('http://127.0.0.1:5199/' + name, { method: 'POST', body: c.toDataURL('image/jpeg', .9) }); };
   __town.setSeason('summer'); __town.setPhase(.25); __town.setView({x:.6,z:7.5,yaw:-.55,pitch:.45,distance:11.5}); await __snap('square.jpg');
   ```
3. Compose the images with ffmpeg `hstack`/`vstack`. This ffmpeg has no `drawtext`, so draw labels on a page canvas, POST them as PNGs, and `overlay` them.

Standard views:

| View | Settings |
|---|---|
| Square | `{x:.6,z:7.5,yaw:-.55,pitch:.45,distance:11.5}` |
| Street | `{x:-3,z:6.2,yaw:.05,pitch:.26,distance:8}` |
| Cart close-up | `{x:1.4,z:10.6,yaw:-.25,pitch:.2,distance:4.2}` |
| Bench | `{x:-5,z:8.2,yaw:.3,pitch:.18,distance:3.2}` |

To enter a room while the pane is hidden:
1. Click the destination (for example `[aria-label="Walk to work"]`).
2. Loop `advance(30)`.
3. Click the door button (for example "Go to work →" or "Enter bank →").

### Blender

- **Headless** is the source of truth: the `--background --factory-startup` command above writes the GLB and `assets/town/town-people.blend`.
- **Live** through the Blender MCP:
  1. Exec `scripts/build-town-people.py` with `__file__` set. It builds into a separate `TownPeople` scene and only writes the GLB.
  2. Exec `scripts/qa/blender-preview-rig.py` for the camera and lights, plus the `place()`, `style()` and `only(clip)` helpers.
  3. Render with `bpy.ops.render.render(write_still=True)`.
  4. Switch the window back to Pieter's `Scene` when done.

## 6. Gotchas learned on 2026-09-25 and 26

**Phone check (2026-09-26)**
- iPhone Mirroring:
  - Taps need full-screen control.
  - The page scrolls only with `scroll` at amount 100, repeated. A mouse drag selects text instead.
  - `left_click_drag` does work on the joystick.
  - View → Zoom In makes the window large enough to read the `?stats` line.
- The Bash shell can't `screencapture` the mirroring window, and `save_to_disk` gave no file path. For receipt images, use headless WebKit with the iPhone 15 Pro profile: `docs/verification/phone-2026-09-26/quiz-shots.cjs` uses the cached Playwright 1.63 (`~/.npm/_npx/420ff84f11983ee5`, WebKit 2359 already installed).
- The shared `Modal` scrolls its overlay and gives the dialog auto top/bottom margins. A dialog that wants another placement sets its own margins through `contentStyle`, as `TutorialModal` does. The 3D city modals pass `overflow: 'hidden'`.

**Lighting**
- Neutral tone mapping has none of ACES's hidden ~1.7× exposure boost, so night has its own lift (`LIGHT_BALANCE.nightExposure`).
- The sun path is offset on purpose (+12 on x) so midday shadows face the default camera. Don't move it back overhead.

**Skinned people**
- Never change bone orientation in `build-town-people.py`: every joint's identity rest rotation is the contract with the direct `rotation.x` poses. `test/TownControls.test.ts` pins it.
- Clones must use `SkeletonUtils.clone`.
- Seated poses must call `sitHips` (`SIT_DROP` .125).
- Clip speeds live in `CLIP_GROUND_SPEED`.
- The old `town-character.glb` and Sept-13 `alex-atelier.glb` stay on disk for rollback but are not loaded.

**Blender**
- `shape_key_add` can leave the last key at value 1, which renders every eye shut; the keys are zeroed explicitly.
- Metaball surface radius is 0.575 × the nominal size.
- The Decimate modifier's ratio counts triangles, not quads.
- In a Decimate vertex group, weight 1 decimates *more*.
- The glTF export needs `use_active_scene=True`, or it exports every scene in the file.
- NLA solo does not isolate a clip for rendering; mute the other tracks instead.

**AI hero (build 42)**
- Meshy GLBs split vertices at every UV seam. Weld them (`remove_doubles`, 1e-4) before measuring or auto-weighting; UVs stay per face corner.
- Meshy textures the A-pose from the camera side, so anything the arms hid comes out as white smudges. `build-town-hero.py` repaints them per part (bone plus the face's own median colour). Check any new AI model from the side and back in a walk frame.
- The hero keeps his own proportions. `town_rig.add_clips(arm, names, legs)` scales the motion to his legs, and the stride and timing never change, so `CLIP_GROUND_SPEED` holds.
- The hero GLB is Draco-compressed like the city. Draco does not carry morph targets: export without Draco if the hero ever gets a `Blink` morph.
- The café apron hangs off the `Torso` joint; the hero's fit is `HERO_APRON` in `townAtelier.ts`. The café cameras only see his back, so check the fit in Blender.
- Synthetic `KeyboardEvent`s don't move the player; use `__town.walk(x,z)` outdoors.

**Animation and the three.js mixer (builds 58–59)**
- The mixer only writes a joint when its value changes. A still clip (Sit), or any clip at dt 0 under reduced motion, writes nothing. So any per-frame offset applied after the mixer must be idempotent: `sitHips` stores what it applied.
- Aim limbs with target directions (`rotation_difference`, the `aim()` helper in `town_rig.py`) rather than Euler angles when the result must land somewhere specific (the wave's hand).
- A new clip needs its name added to the clip-list tests (`TownControls`, `TownLife`); the old atelier model keeps six.

**Hero texture and blink (builds 56–57)**
- The painted eyes were measured once from an unlit orthographic Workbench render (`color_type='TEXTURE'`, `light='FLAT'`). Workbench shows untextured meshes as plain white, so an open lid sliver appears as a white line in those QA renders only.
- Meshy's face lines sit mostly on chart borders but some inside charts; the rules in `repair_face()` cover both.

**Hero face shading (build 64)**
- The face's custom normals come from `smooth_face_normals()`, the last step before export. Anything that changes the head's geometry must run before it.
- The held boxes and the region (`FACE_*`) are in built-hero coordinates.
- Don't move face vertices to smooth the light: the eyelids are placed at fixed 3D eye outlines, so the painted eyes slide out from under them.

**Phone layout and event places (build 62)**
- **Event places:** an event's place comes from `EVENT_PLACES` by id first, then its category. A new place needs a label in `eventPlace` and a spot in `EVENT_STAGE`. `test/TownEventPlaces.test.ts` fails on an unknown id or an unwalkable ring.
- **Phone-only layout:** everything is in `town.css` under `max-width: 767px`: the room bar, "?", "Exit ↗" and the one-row journey strip. On desktop the room bar is `display: contents`.
- **Hidden pane:** it throttles scroll and resize events and smooth scrolling. Check the ‹ › buttons in visible headless WebKit (`docs/verification/phone-findings-2026-09-26/phone-layout.cjs`, iPhone 15 Pro), not the pane.
- **QA gotcha:** `__town.setView` inside a room moves the player outdoors while the UI still says the room, so the exit button then does nothing. Leave the room first.

**Tileable surfaces (build 61)**
- The textures are painted at runtime in `townSurfaces.ts`: pure pixel arrays uploaded as `DataTexture`s, so tests run them without a canvas. `DataTexture`s aren't flipped, so rows run with v, and `normalsFromRelief` follows that.
- The maps are light and nearly neutral; the material colour sets the hue. Walls and road divide their colour by the map's mean; paving doesn't, because the season palette sets it outright.
- UVs are world-space (`projectSurfaceUVs`) and replace `TEXCOORD_0`. The AO stays on `TEXCOORD_1`.
- A new material for a wall needs a name starting with `wall` and an entry in `dressTown`'s `colors`.
- Anything buried inside another box shows up in the AO bake as a dark line. The centre-line dash under the crosswalk did.

**City AO (build 59)**
- three.js applies `aoMap` to indirect light only (hemisphere, environment), so it needs strength above 1 here. At strength 1 the difference image was black.
- A 1 m reach gave grimy facade streaks; 0.6 m was cleaner.
- The seasonal palette recolours materials in place, so the `aoMap` survives. The atelier art (`dressTown`) uses `TEXCOORD_0`, so AO lives on `TEXCOORD_1`.

**Browser checks**
- React's "update while rendering" warning is logged once per page, and the console tool keeps messages across reloads. To prove a warning is gone, hook `console.error` on a fresh page before the action.
- With the pane hidden, `computer screenshot` shows a blank canvas; use `__town.advance` with the capture receiver. `resize_window` to 1600×1400 gives larger canvases.
- On the square the camera always aims at 1.65 m and the lens is long; for face shots use distance ~1.9 and a larger canvas.

**Tooling**
- Higgsfield's `get_cost` with `count` > 1 returns one item's price. For a single 3D job it was exact (38 quoted, 38 charged).
- Vite re-optimises dependencies on the first load after a new `three/examples` import, which reloads the page once.

## Completed (chronological record)


1. **Five financial/gameplay foundations:** decision autosaves with failure recovery; investment distributions separate from price growth; more honest risk/loss teaching; simpler opening repair/investment flow; reserve goals that cannot be earned by new borrowing.
2. **Freedom Square:** original Blender buildings and animated character, bank/stocks/business/property destinations, camera-relative movement, tap-to-walk, joystick, collision-aware city routes, follow/overview camera, saved city viewpoint and portfolio return routes.
3. **Opening journey:** reserve → buy coffee cart → $60 permit → owner shift → monthly review; persistent entrepreneur badge without a cash reward. Ownership and the $350 cart upgrade appear in the scene.
4. **Bank and cart:** walkable bank/teller, savings transfers, loan comparisons and a separate cart owner shift with price/stock choices, animation and receipt.
5. **Living city and café:** rain/puddles, residents, optional ambience; walkable café, lease, furnishings, price/stock/staff plans, monthly reports and net-worth accounting.
6. **Hands-on café shift:** walk to take orders, brew, carry and serve coffee; arriving/queued/seated guests, patience, reactions, optional helper, waste and profit/loss receipt. Free practice requires no ownership and changes no money. Paid owner shifts persist and resume paused.
46. **Lighting pass (branch `town-lighting-pass`, 2026-09-25, NOT merged or deployed):** commit `263aeeb` snapshots the previously uncommitted Sept-13 atelier work as found; `98ce027` adds the sky-lit outdoor rig (`components/town/townLighting.ts`: Neutral tone mapping, captured sky environment + visible dome, sun path offset south-east so midday shadows show, longer golden hour, readable moonlit night, contact shadows under figures and vehicles); `e1ab846` gives the square a longer lens (pitch .45, 11.5 m, 40°; rooms unchanged), revertable on its own. Dev handle `__town.advance(frames)` renders while the tab is hidden, so visual QA no longer needs a visible browser. Receipt and before/after grid: `docs/verification/lighting-2026-09-25/`. 395 tests / 70 files + build pass. To ship: Pieter reviews the grid or plays the branch, then merge into the release branch and deploy as usual.
47. **Skinned townspeople (same branch, 2026-09-25, NOT merged or deployed):** every person in the city is now one skinned body from `scripts/build-town-people.py` (`public/models/town/town-people.glb`), replacing the 45-part rigid mannequin; joints keep the old names and identity rest rotation, so all direct poses still work. New helpers: `sitHips`/`SIT_DROP` and the skinned branch of `styleCharacter` (`townResidents.ts`), `CLIP_GROUND_SPEED` (`townLocomotion.ts`), `createBlink` (`townCharacterExpression.ts`). Draw calls on the square 1,431 → 815. The Sept-13 rigid Alex is switched off (`characterAtelier: false`). Receipt: `docs/verification/characters-2026-09-25/`. The AI-modelled Alex followed on this rig (item 48).
48. **AI-modelled Alex (same branch, 2026-09-25, build 42, NOT merged or deployed):** Pieter picked concept 2 and approved up to 50 Higgsfield credits; 38 were spent (Meshy 7 image-to-3D, textured, A-pose, 10k triangles, no Meshy rig). `scripts/build-town-hero.py` welds the source (`assets/town/alex-meshy-source.glb`), rigs it onto the town skeleton at Alex's own joints, swings the arms to the 12° rest pose, repairs the A-pose texture smudges and exports `public/models/town/town-hero-alex.glb` (502 KB, Draco). The clip generator moved to `scripts/town_rig.py` (shared with the townspeople; their animation is unchanged, max difference 0). Runtime: `hero?: 'alex'` in `createTownScene` (TownModal passes it for Alex only), `HERO_APRON` for the café apron. Licensing: Higgsfield ToS §4.4, no ownership claim and no commercial restriction. Receipt: `docs/verification/hero-alex-2026-09-25/`. 401 tests / 71 files + build pass.
49. **Builds 43–59, all live after releases 1–4 (2026-09-25):** each has a receipt in `docs/verification/`:
   - 43, walk bob: `walk-bob-2026-09-25/`;
   - 44, economy Phase 0: `economy-2026-09-25/`;
   - 45, traffic: `traffic-2026-09-25/`;
   - 46–47, Phase 1 slices 1–3: `phase1-slice1-…`, `phase1-slices2-3-…`;
   - 48, sign lettering: `sign-lettering-…`;
   - 49, property costs: covered by the economy receipt;
   - 50, "Start in the 3D city": `phase1-slice4-…`;
   - 51, unique asset ids: `release-2026-09-25/`;
   - 52, pacing: `pacing-2026-09-25/`;
   - 53, the Freedom Track: `phase1-slice5-…`;
   - 54, event staging: `event-stage-…`;
   - 55, course rewards: `course-rewards-…`;
   - 56, hero blink: `hero-blink-…`;
   - 57, hero face: `hero-face-…`;
   - 58, wave, Sit and hair: `characters-polish-…`;
   - 59, city AO: `city-ao-…`.

   Tests grew from 401 to 483 over the day.
45. **Dashboard shell translated (committed, build 39):** the v2 shell (`components/v2/*`, the App.tsx header and quick-actions menu) reads every visible string through `useI18n().t` under `shell.<component>.<slug>` keys (342, both languages). `scripts/i18n-shell-transform.py` did the mechanical pass; interpolated sentences were keyed by hand; module-level copy helpers take a `Translate` parameter. Tab bodies (`components/tabs/*`) and the monthly-action cards are still English by choice: next slice if the whole adult game should speak Spanish.
44. **Dashboard Spanish rewritten (committed, build 38):** `i18n/translations/es.json` regenerated from the English structure with full Spanish (accents/ñ, ¿?, tú, city vocabulary; 323 previously-English strings translated: `events.*` used by `data/events.json`, character questlines, `salesQuiz.*`, `quiz.sales_q*`). Recipe in the receipt: flatten en.json, translate into a flat dict, refill the English structure, assert placeholders match. The dashboard's translation and the city's now share one vocabulary.
43. **Spanish read (committed, build 37):** every city `tl` pair (1,474) read in full; 21 strings fixed (neutral gender, LatAm terms, phrasing; list in the receipt). Recipe: extract pairs with a regex over `components/town`, `services/town*`, `i18n/town.ts` into one file and read it; heuristics catch untranslated/Spain-only/¿¡ slips. A true native-speaker pass by a person remains worthwhile; the dashboard's `es.json` was not part of this read.
42. **Dead code removed (committed, build 36):** `CharacterSelect.tsx` (never rendered; cards are inline in App), `NewUiRoot.tsx`, `FinancialFreedomBreakdown.tsx` + its test, `ActionCard.tsx`, `v2/SidebarShell.tsx`, `v2/DashboardScreen.tsx`, `v2/DashboardScreenEnhanced.tsx`. Scan recipe: for each file under components/hooks/services, grep for `from '…/<basename>'` outside tests; the only remaining unreferenced-by-code files are intentionally none. `components/INTEGRATION_GUIDE.md` is marked historical.
41. **Marcus survives a do-nothing run (committed, build 35):** `Character.startingLifestyle` (applied in App's `handleSelectCharacter`, `createDailyChallengeState` and the balance harness); Marcus starts FRUGAL with the "Bootstrapper" trait; ENTREPRENEUR rung one pays $2,400 (was $2,000). Twelve-seed do-nothing runs: 12/12 bankrupt → 3/12.
40. **Balance pass (committed, build 34):** `test/BalancePass.test.ts` is a headless 36-month harness (seeded `Math.random`, scripted coaster/saver/driver players, cheapest open event option) that asserts the balance envelope; run it after any change to premiums, event costs, car prices or college payback. It found that insured event options were open to everyone: `optionLocked(state, eventId, label)` now gates "Use insurance…" options behind the policy (ScenarioModal `lockedOption` prop, App refuses locked picks). Health premiums repriced to $240/$160/$110, home & car to $80. Open balance note: Marcus Johnson goes bankrupt in every do-nothing run (by design: hustles questline).
39. **Vehicles in the city (committed, build 33):** `services/townGarage.ts` (`garage`/`carCard`: true monthly cost = upkeep + 0.5% depreciation + loan interest, resale at a 10% dealer haircut, equity, five-year value; `LISTINGS` lot; `buyVehicle` cash or financed → CAR_LOAN liability with `assetId`; `sellVehicle` clears the loan, refuses underwater; `garageFigures` for the 3D car). `GaragePanel.tsx` opens at spot `garage` (bay at (-14.2, 8.0); obstacle (-14.7, 9.5) in `TOWN_OBSTACLES`); scene `setGarage`/`walkToGarage`; TownModal `onBuyVehicle`/`onSellVehicle` → App. Rosa `car-heavy` (month ≥ 6, share ≥ 40% or underwater). Every adult surface now has a city stop.
38. **Quest log on the notice board (committed, build 32):** `services/townQuests.ts` (`questBoard` → ready/active/upNext/completed with `getQuestProgress`; `rewardText`, `progressText`; `noticeSheet` for the 3D paper). `NoticeBoardPanel` gained the Quest log block (`onClaimQuest` = App `handleClaimQuest`, `onOpenQuests` opens the dashboard QuestLog; uses `useI18n().t` for quest title keys). Scene: the board's paper canvas is redrawn by `setNotices(noticeSheet(state, t))` from TownModal.
37. **Insurance at the bank (committed, build 31):** new mechanic in `services/townInsurance.ts` (health / home & car / business policies: premium, deductible, co-insurance share, claim loading; `COVERAGE` lists the covered event ids; `pricesCover(label)` decides whether an option already priced insurance). Hooks: `insurancePremiums` in both cash-flow calculators and the turn preview; `settleClaim`+`applyClaim` in `applyScenarioOutcome` (which now takes the option label as a third argument; App passes `option.label`); `settleRepairs` and the premiums tally in `processTurn`; `MonthlyReport.insurancePremiums/insurancePaid`; `GameState.insurance`. UI: `InsurancePanel.tsx` as the teller's third tab (`onBuyPolicy`/`onCancelPolicy` through TownModal → App `buyPolicy`/`cancelPolicy`), an INSURANCE sign in the bank, Rosa's `uninsured` warning from month 6.
36. **Family at home (committed, build 30):** `services/townFamily.ts` (`household`, `childCard` with the same age bands as `calculateChildrenExpenses`, `remainingToAdulthood`, `grow`/`monthlyToReach` at the savings yield, `householdFigures`, `contributeCollegeFund` → teller transfer + `townProgress.collegeFund` tally + mail). HomePanel "Family" block with the college-fund buttons (`onCollegeFund` prop → App `contributeCollegeFund`). Flat: `home.setFamily` (crib, toy box) and scene actors (spouse + up to three scaled children; `setFamily` controller method, `applyFamily` re-applied after the model loads). Rosa `college-fund` tip (place home). Six negative-money formatters fixed to "-$".
35. **Community College (committed, build 29):** `components/town/townCollege.ts` (north-facing facade on the south lawn at door (4.4, 10.4); classroom interior), `services/townCollege.ts` (`courseCard`/`studyPlan`/`enrolment`/`registrarLine`/`certificates`/`collegeBoard`: every Education-tab course priced by deposit, loan, monthly raise and payback months; relevance and the 3× cap match `getEducationSalaryMultiplier`; deposit/loan rules match `handleEnrollEducation`), `CollegePanel.tsx` (study plan, course in progress, self-study certificates, shelf; Enrol → `onEnroll` = App's `handleEnrollEducation`). Scene: room `college`, spots `college`/`registrar`, `walkToCollege`/`enterCollege`/`walkToRegistrar`/`setSyllabus`, and a camera ease to the north (`yawGoal`) when the player reaches the door, because the building sits where the camera normally hangs. Rosa points here (`study`, `quick-course`); guide target `registrar`; `townProgress.collegeVisitedMonth`.
34. **Playthrough continued (committed, build 28):** `pushApart` could freeze the player behind anyone standing on the route (cart queue, notice board): radial push went backwards and a non-walkable push discarded the step. `steerAround` in `townResidents.ts` deflects sideways only, ignores people behind, tries the far side when the near side is a wall, and never blocks; occupied waypoints count as reached from 0.75. Resume card on the mode picker rounds and signs money (`formatSigned`, `-$8,996`). Café practice shift, office, Rosa, board and home verified on 5188 after the change.
33. **Live playthrough fixes (committed):** Pieter played and asked for three things. Women now wear fitted pants in the skirt palette (the cone skirt is retired: `Fem_Skirt` hidden, legs and hips recoloured; `styleCharacter`). Pavements keep right: east- and west-bound walkers use separate lines (`WALK_KEEP_RIGHT` ±0.42) so residents never pass through each other; the cyclist moved to the kerb (z 5.3). The player is steered around people (`steerAround`, 0.6; build 28 replaced the radial push that wedged the player behind the cart queue) and blocked by vehicles (`traffic.obstacles()` footprints, 0.35 margin; a stopped car is a wall). Measured: closest resident-to-resident 0.84, resident-to-player 1.11, player stopped 0.37 short of a van.
32. **Money Quest square (kids mode, committed):** `components/town/KidsSquareModal.tsx` + `services/kidsSquare.ts`. The kids game (`KidsApp.tsx`, weeks/coins/energy hearts) gets a "Visit your square" button on its home tab that opens the same 3D square with a kid-sized figure (`playerScale` option in `createTownScene`) and four stops mapped onto the buildings: piggy bank (coins, allowance next week, goal progress, energy explanation, Next week), lemonade stand (the kids hustles with earn range, energy and start-up cost; Start), toy shop (collectibles with buy, the shelf with paid vs now arrows), goal jar (the savings goals with weeks-of-allowance-away; Save for this; the win). Next week runs the kids weekly turn in place; a pending kids event closes the square so Money Quest shows it. The cart appears when the lemonade hustle runs; the goal win lights the fireworks. Own lazy chunk (13 KB) sharing three.js with the city. Bilingual.
31. **Unemployment insurance at the bank (committed):** `services/townBenefits.ts`. Only an involuntary gap qualifies (a city layoff sets `townProgress.laidOffMonth`; the dashboard job-loss event now sets it too and its "file for unemployment" option files the claim through a new `filesUnemployment` outcome flag; leaving to change careers does not qualify). The benefit is half of prior pay capped at $2,400 for up to six months of the gap, first payment the month after filing, and each paid month needs a job application on record (the office's search; the filing month counts); a month without one pauses the benefit with a warning; the claim closes the month work resumes. `payUnemploymentBenefit` runs in `processTurn` before the job-loss countdown (never in challenges). The teller shows the block while between jobs (eligibility, the claim amount, File the claim, then the live status); the office's Between jobs block points at the bank and shows the claim.
30. **Side-hustle desk at home (committed):** `services/townHustle.ts` reads the Life tab's catalogue, state and income model: every hustle priced on the teaching estimate (`calculateSideHustleIncomeEstimate` for that hustle alone), hours, energy, stress, automation exposure, start-up cost, requirements, and the exact reason a start is blocked (already running, cash, education, career level/path, energy). `HomePanel` gains a "Side-hustle desk" block: running hustles with monthly estimate, months in and next milestone, Stop; the Hustle Sprint monthly action; a milestone prompt that opens the dashboard's upgrade chooser; a collapsible catalogue with Start. Starts and stops use App's existing handlers. The flat shows a hustle corner (work table, laptop, mug, parcels; more parcels from the second hustle) via `setHustles`.
29. **One-on-one and recovery plan (committed):** `mentorTalk` explains the last review's weakest factors (cause + fix, bilingual), opens differently after a D, a C, a good year, no review, or a layoff, and projects the grade if the year ended today. `proposeRecoveryPlan` picks two or three goals from the weak spots (stress down, networking up, a recovery month, training, a networking event, overtime, landing a job); `acceptRecoveryPlan` stores a three-month plan with a snapshot of the cumulative desk-action log (`townProgress.workLog`, incremented for overtime/network/training/recover and never reset); `planProgress` tracks it live; `judgeRecoveryPlan` runs in `processTurn` when the plan ends: completed → +10 credit on the next review (`recoveryCredit`), a D notice lifted (`noticeLiftedMonth`, honoured by the layoff hazard and promotion odds), an ACHIEVEMENT event; missed → a NEWS event, no penalty. Panel block "One-on-one" at the office.
28. **Performance reviews, layoffs and the job search (committed):** every January `processTurn` (normal games only) grades the closed year (`performanceReview` in `services/townCareer.ts`: network, stress, energy, morale, desk actions counted in `yearStats.workActions`, months between jobs in `yearStats.monthsUnemployed`), pays an A/B bonus, stores `townProgress.lastReview`, adds an event and a line in the annual report; the grade feeds promotion odds for a year and the layoff hazard. Each turn rolls one seeded layoff hazard (`layoffHazard`/`applyLayoff`: 0.4% base × AI exposure × recession × review grade × seniority, capped 5%/month, off in challenges); a cut pays severance (half a month to three months of salary by experience) and sets three months between jobs. While unemployed the office shows a Between jobs block with cash runway, a once-a-month job search with honest odds (`jobSearch`), and the job board stays open (a change ends any longer search with the usual one-month gap). Job security now prints the annual layoff risk with its multipliers.
27. **Deeper career play at the office (committed):** `services/townCareer.ts`. **Ask for a raise** at the manager's desk: 8% or 15% with honest odds and named factors (network, time in the role, a bold ask, recession, visible stress, already paid above the rung); success applies the raise to base salary, failure still nudges pay 2–3% and costs some happiness/stress; six-month cooldown (`townProgress.lastRaiseAskMonth`); a DECISION event records it. **Job board**: every other career path with entry title and pay (difficulty-scaled), the delta against current pay, future-proof score, exposure and whether a qualification on file is relevant; a two-step Apply changes path with a month between jobs (no salary), the ladder reset to rung one, six months of experience credit for relevant education, +10 stress and a twelve-month cooldown (`townProgress.careerChangedMonth`). **This month at work**: the dashboard's Overtime / Networking / Skill Training actions at the desk, same handler and limit. The office wall gained a job-board canvas. Also fixed a June bug: the dashboard's raise negotiation event never changed salary; scenario outcomes now support `salaryChangePct` and the negotiation results carry 15/3 and 8/2.
26. **Cold-start playtest (committed):** fresh-save playthrough of the first hour; found and fixed the office interior rendering on the square before any door transition (`root.visible=false` in `createTownWork`, test pinned). Everything else in the opening and investor arcs, month advance with return to the square, badges, events, autoplay pause and the demo wall behaved. Bank poster translated.
25. **Spanish for the city (committed):** `i18n/town.ts` adds `tl(en, es)`, which returns Spanish only when the game locale is `es` (module-level `getLocale`, with `setTownLocaleOverride` for tests). Every city panel, the modal chrome, guide labels, captions, the journey/advisor/challenge/market/workplace/café-incident/shift-task copy, the teller's speech, the canvas boards and the dashboard city card carry both languages inline. Persisted records (events, receipts) stay English; Spanish incident copy is substituted at render by id. English tests are untouched; `test/TownSpanish.test.ts` pins the Spanish side. Proper names (Rosa, Main Street, career titles from `CAREER_PATHS`) stay as they are.
24. **Soak + return to the city (committed):** four open/close cycles leave no canvases or errors; rapid navigation and sound toggling are clean. Closing the month from the notice board now brings the player back to the square once the turn settles (`returnToTown` in App; skipped when an event, the annual report, bankruptcy or a fresh win needs the 2D shell first).
23. **Neighbourhood tour, download progress, city after winning (committed):** a third guided arc (`tourJourney` in `services/townJourney.ts`, stage 3, badge "Settled in") starts once the investor journey is done: read the pay stub with the manager → check the bills at your desk → ask Rosa → complete a notice-board challenge → finish. One-tap guiding chains through the office and apartment doors (`GuideTarget` manager/desk/rosa/board, new hops in `townGuide.ts`); visits are recorded by `resolveTownAction` (`visit-work`/`visit-home`/`visit-rosa`, `townProgress.workVisitedMonth` etc.); the annual report lists the badge. The city loading overlay now shows download progress across the three model files (`onProgress`), and the dashboard's city card no longer disables after financial freedom, so Freedom Day is reachable.
22. **Main Street Offices, the player's workplace (committed):** an office building mirrors the townhouse at the east end of the promenade (Work button, door at x 15.7). Inside: manager's desk, two seated colleagues, a payroll board and career-ladder board drawn from the real state, and a "Pay yourself first" poster. The manager panel (`WorkPanel.tsx`) shows a pay stub that reconciles line by line (base, education premium, AI pressure, recession squeeze, overtime, layoff, perks) to `calculateEffectiveMonthlySalary`, the player's share of income tax and take-home; the promotion outlook (next title and salary, experience progress bar, blockers such as months short, missing qualification, recession, stress; boosters; monthly odds and expected months once eligible, using `checkPromotion`'s formula without the dice) with an "Ask about a promotion" button wired to App's `handleManualPromotion`; and a job-security read (future-proof score, AI exposure, what shields you) with links that open the Career and Education tabs (`onOpenLife` → `navigateToTab`). `services/townWork.ts`, `components/town/townWork.ts`; `getNegotiationRaiseBonus` is now exported from gameLogic; `createHomeFacade` takes a palette.
21. **City accessibility pass (committed):** the side panel and camera menu take keyboard focus when they open and return it to their trigger when they close; Escape closes the innermost overlay (camera menu, then side panel) before the whole city; a visually hidden status line announces "On Freedom Square" / "Inside the Community Bank" on room changes; the canvas is `role=application` with Enter as an alias for E; the Accessibility panel's large-text and high-contrast preferences now reach the city HUD (`.tycoon-text-lg` zooms HUD and panels 15%, `.tycoon-high-contrast` brightens muted copy, borders and focus rings). `test/TownA11y.test.tsx`.
20. **Residents make room + Freedom Day (committed):** walking residents drift to the far side of their lane when the player is within 1.7 units and pause if the player stands in their path (`yieldTo` in `townResidents.ts`; per-resident `wait` is subtracted from the lane clock). When `state.hasWon` is true the caption reads FREEDOM DAY, fireworks burst over the square every 2.2 s (`createFireworks` in `townLife.ts`, deterministic origins, additive points, off under reduced motion), a celebration chime plays on every third burst, and Rosa's first line becomes the win line with a warning about lifestyle creep. `cityCaption` in `townGuide.ts` owns the caption copy. Dev handles: `window.__town.celebrate(true)`, `walk(x,z)`, `residents()`.
19. **Petite women, A-line skirts (committed):** Pieter's note that the women looked muscular with trousers showing through their dresses. `Fem_Skirt` in `scripts/build-town-extras.py` is now an A-line cone whose top (0.32) is wider than the hips (0.29) and whose hem reaches the knee; `styleCharacter` in `townResidents.ts` gives women a petite build (`FEMALE_BUILD`: 0.95 height, narrower hips and torso which also bring the shoulders in, slimmer sleeves/forearms/legs, head kept near normal) and recolours the legs under the skirt to the skin tone. Model re-exported (`MODEL_VERSION` 20260906a).
18. **Adaptive graphics quality (committed):** `components/town/townQuality.ts` defines three tiers (Detailed / Balanced / Smooth: resolution cap, shadows, shadow-map size) and a frame-time governor (steps down after 2 s of slow frames, climbs back only after 12 s of fast frames and a 90 s cooldown; warm-up and tab switches ignored). Auto starts one tier down on phone-like devices. The Camera menu has a Graphics row (Auto / Detailed / Balanced / Smooth, saved in `tycoon_town_quality`); an automatic switch shows a short status note. Dev handle: `window.__town.quality()` / `setQuality(mode)`.
17. **Townhouse around the apartment door (committed):** Pieter's morning note was that 12 Square St was "only a door". `createHomeFacade` in `components/town/townHome.ts` now builds a two-storey townhouse behind the door (sand walls, cornices, slate roof, five windows sharing the shopfront night glow, canopy, lamp, planter); its bounds join the camera collision list. Tree canopies now only push the camera when it would sit inside a canopy, which fixes the camera jamming against the door.
16. **Overnight build 9 (committed):** the annual report gains a "Your city this year" section (badges, challenge totals, café profit, owner shifts, reputation); `YearStats` accumulates café profit and shifts.
15. **Overnight build 8 (committed):** café incidents tied to decisions (machine breakdowns by equipment, inspections by reputation, staff quitting unloved shops, regulars for strong ones), settled in the turn with events and receipt lines (`cafeIncidents`/`settleCafeMonth` in `services/townCafe.ts`).
14. **Overnight build 7 (committed):** seasons by game month, recolouring the merged city materials (snow-white winter, orange autumn) with snow and leaf fall (`components/town/townSeasons.ts`).
13. **Overnight build 6 (committed):** the player's home at 12 Square St furnished by lifestyle tier with a desk panel (bills, mail, bookshelf, lifestyle chooser); Rosa the neighbour on the west bench with situational advice from the player's real numbers (`services/townAdvisor.ts`), a speech bubble and "Show me" routing; the dashboard city card; a mobile-width pass over every new panel.
12. **Overnight builds 4–5 (committed):** ten-minute day-night cycle with street lamps, glowing windows, headlights and crickets (`townDaylight.ts`); the community notice board with three deterministic monthly challenges judged at month close against a start-of-month snapshot, twelve-month log and clean-sweep badges (`services/townChallenges.ts`, `NoticeBoardPanel.tsx`; `townProgress.challengeSnapshot/challengeLog`).
11. **Overnight build 3 (committed):** Property & Co. estate office interior with listings wall, rates board, agent speech bubble and an agent panel (rent after upkeep/vacancy, mortgage quotes with eligibility, rent-or-buy comparison, mortgage preview handoff to the existing modal). `services/townProperty.ts`, `components/town/townProperty.ts`, `PropertyPanel.tsx`.
10. **Overnight build 1–2 (committed):** café reputation links owner-shift stars to monthly demand; the Exchange is a walkable trading floor with a ticker, broker speech bubble and broker panel (market mood, S&P/dividend/bitcoin with Buy 1/5/10 and Sell all, contributions calculator); a teaching market index in `GameState.marketIndex`; a second guided arc, the investor journey, ending in the Patient investor badge. Receipts in `docs/completed-improvements.md`.
9. **Cyclist, dog walker, café shift rework (committed `17add88`):** bike and dog models in the vehicles file; `createCyclist`/`createDogWalker` in `townLife.ts`; café service now supports taking orders while a drink brews, collecting ready drinks from the machine, a helper who takes orders, four guests on busy days, tighter patience, tips for quick service and a 0–3 star rating. Receipt in `docs/completed-improvements.md`.
8. **Street life, character polish, vehicles, sound (late evening, commit `8baad7d`):** one animated character with optional female/male parts (`townResidents.ts` styles player, twelve residents, teller, café staff and guests); cars and a van on Main Street that brake for the player and queue (`townTraffic.ts`); pigeons that scatter and bunting between lamp posts (`townLife.ts`); two bench sitters; a layered synthesized soundscape with birdsong, traffic, fountain, footsteps, espresso machine and service chimes (`townAtmosphere.ts`). New Blender step `scripts/build-town-extras.py`; new `public/models/town/town-vehicles.glb`. Receipt and measurements in `docs/completed-improvements.md`.
7. **Loop pacing pass (evening):** the guide button is now one tap per mission leg. A guided walk chains through the bank door to the teller (and into the café) on its own; any manual input cancels it. Long routes and the cart's customer visit jog (5.3 s instead of 10.8 s). Side panels scroll to the new step after a purchase/permit, the reserve confirmation sits first in the teller panel, guide labels track where the player stands, and the guide can confirm the reserve, pay the permit, start a practice shift and complete the journey when the matching panel is open. Timings and the before/after table are in the receipt. No financial rule or save shape changed.

The current scene is a small playable preview. Detailed crowd collision, full conversations, free furniture placement and a complete restaurant/open-world simulation are not implemented.

## Start or resume the preview (September 6 notes; the current recipe is §5 above)

The production preview was listening on `http://127.0.0.1:5187/` at handover (pid 67841, serving the rebuilt `dist/`). Port 5188 was stopped after the pacing pass. Check ports before starting another server; runtime processes may not survive a new session.

```sh
cd '/Users/pietervanderwalt/Desktop/Current High Value Apps/tycoon-step-main 2'
git status --short
npm run build
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
```

`npm run dev` uses port 5173. `netlify dev` is needed for local server functions; plain Vite preview does not exercise real access validation, cloud services or payments. Dependencies are already installed; install only if missing or required by an intentional dependency change.

For isolated browser QA, serve the same build on port **5188**. Different ports are different localStorage origins; this protects the user's 5187 save. `localhost` and `127.0.0.1` are also different origins. Do not clear, seed or replace the user's save. A rebuild replaces hashed assets: finish building, then fully refresh existing preview pages to avoid a stale dynamic-import URL.

In the game: **Continue → Enter 3D city → Visit café → Enter café → Play a shift → Try a practice shift**. Visit café first walks to the building; the button then changes to Enter café. Practice is unsaved and repeatable. The action button walks to a station, then changes to the action; E performs the current action too.

## Saved progress and last browser handoff

These are last-observed snapshots, not values to restore over newer play:

- User origin 5187: Alex, month 3, **$16,180 cash / $24,100 net worth**. The user had progressed beyond an older $16,330 checkpoint; that newer progress was preserved. Last view was a free café practice shift paused with **Resume** visible. Practice vanishes on reload; start it again if needed. No ownership purchase was made on the user's save by QA.
- Isolated QA origins (throwaway): `127.0.0.1:5188` earlier: Alex, month 4, **$12,234 cash**. `localhost:5188` (evening pacing pass, Chrome): Alex, month 2, $12,245 cash, badge earned, no café lease. Earlier 5188 detail: Café with seating and machine, recorded owner shift of two happy guests and one impatient departure, $8 sales, $9 costs, $1 loss. Last normal monthly café receipt was $580 profit; saved monthly plan was $6, 700 stock, helper on, open. Verify in the UI before relying on these snapshots.
- 2026-09-25 QA origin `localhost:5188`: Alex, month 2, $11,249 cash, cart bought and licensed, investor journey 2/4 (used for every before/after capture; throwaway).
- Latest QA tab/server closed; only the user's preview was left open. Temporary viewport override was reset. Final original and QA browser consoles were clear.

## Financial rules to preserve

- All rates/demand are fictional teaching assumptions, not live financial data. Spot crypto and price appreciation do not generate passive cash. Knowledge does not multiply investment payouts; savings principal stays nominal. Preserve quantities, cash, cost basis and completed goals during migration.
- Café lease: $1,200 refundable deposit + $1,800 fit-out, initially $600 equipment salvage. Seating $650 (salvage $325); machine $900 (salvage $450). Café value belongs in net worth and portfolio business assets.
- Café incidents (deterministic per month): basic machine breakdown 1/6 ($250 + lost capacity) vs upgraded 1/18 ($180); inspections ~1/4 months: fine $150 and −6 reputation under 40, +4 over 70; helper quits at reputation < 45 (30%); regulars +$120 at 80+. Never in forecasts; settled in processTurn.
- Normal monthly café trading: $600 rent + $120 utilities, $600 barista and optional $400 helper, supplies $2 per stocked cup. Plans: price $4/$6, stock 400/700, helper and open status. Closed trading still incurs $720 rent/utilities. Net profit enters the existing income engine once, with costs already included.
- Hands-on extra owner shift: price $4/$6, stock 3/6 at $2 each, $3 extra operating cost and optional $3 helper. All costs charged on opening; each sale plus any tip ($1, or $2 at premium prices, for service within the first 45% of a guest's patience) credited once when served. Guests: four on busy days, three in rain, one fewer at premium prices. One paid shift per game month, no restart refund or repeated sale reward. Monthly trading remains separate. Closing/upgrading/changing the café plan is blocked during an active paid shift. Month advance ends unfinished service without paying it again.
- Practice uses local UI state only. Paid shift uses `GameState.cafe.service`. Leaving/hiding the game pauses the timer; restored paid service starts paused. Pausing service must not freeze walking outside the café.

## Source map

| Area | Files |
|---|---|
| App/state and city entry | `App.tsx`, `components/v2/CommandDashboard.tsx`, `components/modals/ScenarioModal.tsx` |
| 3D lifecycle, movement, guests, camera | `components/town/createTownScene.ts`, `townWorld.ts`, `townControls.ts`, `townNavigation.ts`, `town.css` |
| Street life | `components/town/townResidents.ts` (sex/style/seating), `townTraffic.ts`, `townLife.ts` (pigeons, bunting, cyclist, dog), `townAtmosphere.ts` (weather + soundscape) |
| Workplace | `components/town/townWork.ts` (office room + payroll/ladder/job boards), `WorkPanel.tsx`, `services/townWork.ts` (pay stub, promotion outlook, job security, manager line), `services/townCareer.ts` (raise odds and outcomes, job board, career change) |
| Money Quest square | `components/town/KidsSquareModal.tsx`, `services/kidsSquare.ts`; button + lazy import in `KidsApp.tsx`; `playerScale` in `createTownScene.ts` |
| Unemployment insurance | `services/townBenefits.ts` (eligibility, claim, monthly payment in the turn, status); teller block in `TellerPanel.tsx`; note in the office's Between jobs block |
| Side-hustle desk | `services/townHustle.ts` (cards, summary, milestones); desk block in `HomePanel.tsx`; hustle corner in `townHome.ts` (`setHustles`) |
| Home and Rosa | `components/town/townHome.ts`, `HomePanel.tsx`, `AdvisorPanel.tsx`, `services/townAdvisor.ts` |
| City copy in Spanish | `i18n/town.ts` (`tl`, label maps, test override); `tl('English','Español')` calls throughout `components/town/*` and the town services |
| Graphics quality | `components/town/townQuality.ts` (tiers, governor, stored mode); applied in `createTownScene.ts`, chosen in the Camera menu of `TownModal.tsx` |
| Daylight and challenges | `components/town/townDaylight.ts`, `services/townChallenges.ts`, `components/town/NoticeBoardPanel.tsx` |
| Property office | `components/town/townProperty.ts` (room + listings canvases), `PropertyPanel.tsx`, `services/townProperty.ts` (mortgage quotes, landlord month, rent vs buy) |
| Exchange | `components/town/townExchange.ts` (room + canvas ticker), `ExchangePanel.tsx`, `services/townMarket.ts` (mood, index change, downside copy), `marketIndexStep` in `gameLogic.ts`, `investorJourney`/`activeJourney` in `townJourney.ts` |
| Rooms and ambience | `components/town/townBank.ts`, `townCafeRoom.ts`, `townAtmosphere.ts` |
| UI orchestration | `components/town/TownModal.tsx`, `townGuide.ts` (guide labels + one-tap chaining), `TellerPanel.tsx`, `CartShiftPanel.tsx`, `CafePanel.tsx`, `CafeServicePanel.tsx`, `CafeServiceHUD.tsx` |
| Finance and activities | `services/townProgress.ts`, `townJourney.ts`, `townActivities.ts`, `townCafe.ts`, `cafeService.ts`, `gameLogic.ts` |
| Foundations and persistence | `services/firstSteps.ts`, `investmentModel.ts`, `storageService.ts`, `hooks/useSaveLoad.ts`, `types.ts` |
| Lighting (2026-09-25) | `components/town/townLighting.ts` (sky dome, captured sky environment, outdoor balance `LIGHT_BALANCE`, contact shadows), `townDaylight.ts` (sun path, golden hour, zenith/bounce colours), camera lens in `townControls.ts` (`cameraPreset`, `cameraFov`) |
| Hero Alex (2026-09-25) | `assets/town/alex-meshy-source.glb` → `scripts/build-town-hero.py` → `public/models/town/town-hero-alex.glb`; clips from `scripts/town_rig.py`; `hero` option and `HERO_VERSION` in `createTownScene.ts`, `HERO_APRON` in `townAtelier.ts` |
| People (2026-09-25) | `scripts/build-town-people.py` (clips in `scripts/town_rig.py`) → `public/models/town/town-people.glb` (+ `assets/town/town-people.blend`); `townResidents.ts` (`styleCharacter` skinned branch, `sitHips`/`SIT_DROP`), `townLocomotion.ts` (`CLIP_GROUND_SPEED`), `townCharacterExpression.ts` (`createBlink`), clones via `SkeletonUtils.clone` in `createTownScene.ts` |
| QA tools | `scripts/qa/capture-receiver.py`, `scripts/qa/blender-preview-rig.py`; dev handle `window.__town` in `createTownScene.ts` |
| Editable art and rebuild | City: `assets/town/`, `scripts/build-town-assets.py` → `build-town-extras.py` (city, vehicles; the old character parts are no longer used). People: `scripts/build-town-people.py`. See `assets/town/README.md` |
| Runtime models/decoder | `public/models/town/`, `public/decoders/draco/` |

## Validation and evidence

Latest validation (2026-09-26, build 66, released as `main` = `6bb25f1`): **518 tests / 89 files**, TypeScript and the production build. The latest receipts:

| Build(s) | Receipt |
|---|---|
| 66 (sound) | `docs/verification/sound-2026-09-26/` |
| 64 | `docs/verification/hero-cheek-2026-09-26/` |
| 63 | `docs/verification/phase1-slice4-default-2026-09-26/` |
| 62 | `docs/verification/phone-findings-2026-09-26/` |
| 61 | `docs/verification/surfaces-2026-09-26/` |
| 60, and the phone check of 52–59 | `docs/verification/phone-2026-09-26/` |
| All ten releases | `docs/verification/release-2026-09-25/` |
| 59 | `city-ao-2026-09-25/` |
| 58 | `characters-polish-2026-09-25/` |
| 57 | `hero-face-2026-09-25/` |
| 56 | `hero-blink-2026-09-25/` |
| 55 | `course-rewards-2026-09-25/` |
| 52 | `pacing-2026-09-25/` |
| 53 | `phase1-slice5-2026-09-25/` |
| 54 | `event-stage-2026-09-25/` |
| 50 | `phase1-slice4-2026-09-25/` |

Earlier receipts are in `docs/verification/lighting-2026-09-25/`, `docs/verification/characters-2026-09-25/` and `docs/verification/hero-alex-2026-09-25/`; assessment in `docs/assessment-2026-09-25.md`.

Earlier validation (live playthrough fixes): **333 tests / 59 files passed**, TypeScript + production build passed; `git diff --check` passed. Existing chunk-size warnings remain. `dist/` was rebuilt at the end of that pass, so an already-open 5187 page needs a full refresh before opening the city. Commit `35a074d` (townhouse facade) is deployed: Netlify deploy `6a9d135b` published 2026-09-06 07:17 UTC and the live `TownModal-*.js` chunk contains the facade code. Note: the 3D city is a code-split chunk, so the `index-*.js` hash does not change for town-only work; grep the `TownModal` chunk instead. This handover does not repeat financial/cloud testing.

- Portable logs: [tests](docs/verification/live-play-2026-09-06/tests.log), [build](docs/verification/live-play-2026-09-06/build.log); earlier in `kids-square-2026-09-06/`, `benefits-2026-09-06/`, `hustle-2026-09-06/`, `mentor-2026-09-06/`, `reviews-2026-09-06/`, `career-2026-09-06/`, `playtest-2026-09-06/`, `spanish-2026-09-06/`, `tour-2026-09-06/`, `workplace-2026-09-06/`, `a11y-2026-09-06/`, `freedom-2026-09-06/`, `petite-2026-09-06/`, `quality-2026-09-06/`, `home-facade-2026-09-06/`, `annual-city-2026-09-06/`, `cafe-incidents-2026-09-06/`, `seasons-2026-09-06/`, `home-rosa-2026-09-06/`, `daylight-board-2026-09-06/`, `property-2026-09-06/`, `exchange-2026-09-05/`, `cafe-cyclist-2026-09-05/`, `street-life-2026-09-05/`, earlier logs in `docs/verification/pacing-2026-09-05/` and `gameplay-2026-09-05/`.
- Full chronological implementation/playtest receipt: [docs/completed-improvements.md](docs/completed-improvements.md). Earlier test counts and balances in that file are historical checkpoints.
- Regression checklist: [docs/qa-checklist.md](docs/qa-checklist.md).
- Service tests: `test/CafeService.test.ts`, `test/CafeServicePanel.test.tsx`, `test/CafeServiceResume.test.tsx`; broader tests use `Town*`, `FinancialLearning`, `DecisionAutosave` and existing service suites.
- Browser checks: desktop 1280×720, portrait 390×844, all three practice deliveries, paid supplies and two sales, save/reload, impatient departure/loss receipt, and current console. Previous stages also tested teller transfer, café lease/upgrades, monthly profit/loss and mission progression.

## Next session priorities

The current ordered list is §3 above. Standing items from earlier sessions:

- **Chromebook check** (never done). The iPhone is checked (builds 43, 52–59, 61 and 62). On the phone, these are still untested: orientation, suspend/resume, rain and night, the kids square, and the soundscape on a real speaker.
- **Spanish:** a Latin American Spanish speaker's read is still worth an afternoon, the quiz especially. The tab bodies and the monthly-action cards are still English.
- **Publishing discipline:** preserve all work, review unrelated changes, recheck tests and build, and inspect the real hosting target. For town-only changes, verify the `TownModal-*.js`/`createTownScene-*.js` chunks, not `index-*.js`.

No secret values are included here. Do not copy `.env` contents, private access codes or account credentials into future handovers.
