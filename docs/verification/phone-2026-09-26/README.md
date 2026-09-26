# Real-phone check of builds 52–59, and build 60 (2026-09-26, 06:12–06:37 PDT)

**Device and setup:** Pieter's iPhone (Dynamic Island model), Safari, driven through macOS iPhone Mirroring with full-screen control. The production build (`npm run build`) of `town-lighting-pass` at `e010f24`, whose code matches live build 59, was served on the LAN by `tycoon-lan-preview` (`vite preview --host 0.0.0.0 --port 5190`). The phone opened `http://192.168.1.80:5190/?stats` and started a fresh game as Alex.

## Frame rate (the `?stats` line)

| Where | Graphics | Result |
|---|---|---|
| City load after "Enter 3D city" | — | Under 10 s on Wi-Fi |
| Square | Detailed (left on from the Sept-25 check) | 57–60 fps, 509 calls, 440k tris |
| Square | Auto, which picks Balanced on this phone | 60 fps, 509 calls, 440k tris |
| Walking to the bank, camera following | Balanced | 60 fps, 569 calls, 461k tris |
| Bank interior | Balanced | 60 fps, 134 calls, 71k tris |
| **"See neighbourhood", zoomed out, 3 minutes** (06:19–06:22) | Detailed | **56–60 fps** throughout, 531 calls, 455k tris; no step-down |
| Walking home | Detailed | 60 fps, 595–610 calls, 466k tris |
| Home interior | Detailed | 60 fps, 97 calls, 48k tris |
| Café interior | Detailed | 60 fps, 166 calls, 63k tris |
| Café practice shift, four guests | Detailed | 60 fps, 214–291 calls, 130–181k tris |

Compared with earlier checks: build 43 ran 56–59 fps on Detailed with 683–689k triangles, and build 47 ran 55 fps. Build 48's lighter lettering took the square down to about 440k triangles. The AO texture (build 59) and the heavier characters cost nothing measurable.

## Features checked on the phone

- **52, pacing:** each difficulty states its pace ("Realistic: steady investing reaches freedom in about 15–20 years…"), and Play shows "Free in about 17 years at this pace".
- **53, Freedom Track:** the city strip reads "Your first business · 1/5". The dashboard card appears only after the first steps are reviewed, which this run didn't reach.
- **47 and 54, sleep and events:** Home → "Go to bed" ended month 1. The next event opened over the city with its place line ("📍 Rosa knocks on your door"). The event card covers the 3D view, so the build-54 marker wasn't seen on the phone.
- **55, course rewards:** the Sales quiz states "Pass for a 3% raise that stays with you. 3 tries included; after a third miss, a $150 retake fee buys 3 more."
- **56–58, characters:** Alex and the townspeople render correctly, and café guests sit with the new Sit clip. The blink and face detail can't be judged at iPhone Mirroring's resolution.
- **Café, not covered on Sept 25:** the destination row scrolls sideways to Café, Home, Work and Garage. A full order → brew → pick up → serve loop worked, Pause froze the guests' timers, and "Finish early" left cash unchanged ($12,136).

## Bug found and fixed: build 60, dialogs taller than a phone screen

**Symptom.** On the iPhone, "Start Certification" opened a dialog with its title cut off at the top and no close button. The page wouldn't scroll, and the quiz's own Close and Start buttons were below the screen. A player on a phone couldn't take the certification. The only way out was the 16 px strip at the side of the dialog.

**Cause.** The shared `components/Modal.tsx` centres every dialog in a fixed overlay and locks page scroll. A dialog taller than the screen overflowed equally above and below, out of reach. Dialogs that cap their own height (the event card, `TurnPreview`, the side drawers) were fine.

**Measured in iPhone 15 Pro WebKit (393×659), live site vs the fix** (`modal-sweep.cjs`):

| Dialog | Live (build 59) | Build 60 |
|---|---|---|
| Sales Accelerator quiz | top −73, bottom 733: close at −60, buttons at 672–708 | top 16, scrolls to Close/Start |
| Save and load | top −488, bottom 1147 | top 16, scrolls |
| Run summary, Glossary, Tutorial videos | fit, centred | unchanged |

`quiz-before-after.jpg` shows the live quiz, the fixed quiz at the top, and the fixed quiz scrolled to its buttons (`quiz-shots.cjs`).

**Fix** (`components/Modal.tsx`):
- The overlay scrolls (`overflow-y-auto overscroll-contain`).
- The dialog gets `margin-top/bottom: auto`: centred while it fits, starting at the top when it doesn't.
- A consumer's `contentStyle` still wins. The tutorial tip keeps its bottom-sheet placement on phones (`TutorialModal`: margins 0).
- The 3D city and the kids square pass `overflow: 'hidden'` so their full-screen layout can't scroll.

**Checks:**
- New test in `test/Modal.test.tsx`. 484 tests / 85 files, `tsc` and the production build pass.
- Browser pane at 393×660: the quiz starts at the top with its close button visible, and Start is hit-testable after scrolling. Quick actions and Glossary stay centred, and the city still fills the screen.
- Desktop at 1024×768: the quiz is still centred (90 px above and below), and the city is still centred (23 px).
- **On the iPhone:** after a reload, the quiz shows its title and close button, scrolls to Close / Start Certification, and closes without using an attempt (still 3 left). The city ran afterwards at 60 fps.

## Other findings (fixed in build 62, `docs/verification/phone-findings-2026-09-26/`)

1. **Event place line:** "Office Birthday Collection" is a `SOCIAL` event, and `services/townEvents.ts` maps every `SOCIAL` event to Rosa, so an office event reads "Rosa knocks on your door". Decide per event, or map SOCIAL events set at work to `work`.
2. **Destination row:** Café, Home, Work and Garage still need a sideways swipe on a portrait phone (known since Sept 25).
3. **Rooms on a portrait phone:** in the bank, the header, room buttons and mission strip leave the 3D view about a third of the screen (the square's is about 40%, noted Sept 25).

## Not covered

Rain, night, orientation, suspend/resume, the kids square, the Chromebook, and the hero's blink and face at close range.

## Left behind

- The LAN preview (`tycoon-lan-preview`, port 5190) serves the build-60 `dist/`.
- The phone's LAN origin holds an Alex save at month 2, and its graphics setting is back on **Auto**.
- The browser pane's `localhost:5190` origin holds another Alex save.
- The production site and Pieter's saves were not touched. The live site was only loaded read-only in headless WebKit.
