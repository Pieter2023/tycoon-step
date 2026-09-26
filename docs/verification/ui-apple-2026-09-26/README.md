# Build 67: the Apple-style UI upgrade (2026-09-26, not released)

Pieter asked for "a significant overall UI upgrade of the standard UI using apple design skill … it must really look and feel absolutely incredible. Don't change back end functionality. Also ensure the absolute best animations." He later allowed the 3D city's panels to be restyled where needed; the 3D scene itself is unchanged.

Nothing in `services/`, `constants.ts`, `types.ts` or the save format changed. Every handler, accessible name and role that tests and players rely on is kept, and the game plays exactly as before.

## Before and after

| | |
|---|---|
| `compare-menu-1280.jpg` | Landing and mode picker (left: live build 66, right: build 67) |
| `compare-play-1280.jpg` | The Play dashboard on a new game |
| `compare-money-1280.jpg` | Money → Invest |
| `compare-play-phone.jpg` | iPhone 15 Pro (WebKit), Play |
| `before/` | Live site, 2026-09-26, with the analytics opt-out set |
| `after/` | Build 67: the pages above plus Bank, Career, Learn, Life, the life-event dialog and a 1366×768 Chromebook-sized shot |

The WebKit phone shots show page content through the glass bars and sheets. Headless WebKit doesn't draw `backdrop-filter`, and it ghosts even a 96%-opaque layer. In Chromium the computed styles check out (`rgba(12,12,14,.84)` + `blur(24px) saturate(1.8)`), and real Safari blurs. **Check it on the iPhone before releasing.**

## What changed

**The system** (`index.css`; the guide is `docs/ui-design-system.md`):
- **The Tailwind palette is re-derived, so every existing utility renders the new look:**
  - slate/gray/zinc become Apple's neutral dark grays;
  - the accent families keep Tailwind's lightness steps with Apple's system hues: green `#30D158`, red `#FF453A`, orange `#FF9F0A`, blue `#0A84FF`, cyan `#64D2FF` and the rest (generated in OKLCH, sRGB-safe);
  - the old `!important` contrast hacks are gone, because the palette meets AA itself.
- **Type:** the system font (SF Pro on Apple devices, Inter elsewhere) replaces Sora. Every `text-*` size carries its own tracking and leading.
- **Shape, surfaces and materials:**
  - corners a step rounder;
  - quiet grouped surfaces with hairlines;
  - translucent materials (`.mat-chrome`, `.mat-bar`, `.mat-sheet`, `.mat-popover`) with no-blur, reduced-transparency and high-contrast fallbacks;
  - spring easings as CSS `linear()` curves;
  - `.pressable` press-in on pointer-down;
  - iOS inset grouped lists.
- **Scrollbars and the page:** native scrollbars (`color-scheme: dark`), and a near-black page with two soft pools of light.

**Motion primitives** (`components/ui/`):
- `springs`, `riseIn`, `stagger` and `materialize`;
- Apple's `project()` (momentum) and `rubberband()`;
- `AnimatedNumber`: money that counts to its new value on a spring and tints green or red;
- `SegmentedControl`, whose thumb glides between options;
- `ActivityRing`.
- Under Vitest (`MOTION_DISABLED`) everything renders final values synchronously. The App-level `<MotionConfig reducedMotion>` turns every spring into a cross-fade when the player or the OS asks for reduced motion.

**Shell** (lead):
- **Desktop:** a glass sidebar with coloured icon tiles and a selection pill that glides between sections. The large title condenses as the page scrolls under a glass bar, and "Year 1 · Month 7" rolls like an odometer when the month turns. Pages rise in. Next Month is a green capsule, and autoplay is a single control whose speed thumb slides.
- **Phone:** a compact glass header; tapping the avatar opens the profile, which was unreachable on phones before. The floating glass tab bar has a selection blob that springs between tabs.
- **Dialogs:** the shared `Modal` materialises dialogs (scale + blur + rise) and they leave the same way. Side sheets slide from their edge. The default width no longer overrides a caller's `max-w-*`, which had capped the Career, Learn and Life sheets at 512px. Build 60's scrolling overlay is kept.
- **Quick actions:** an iOS Settings list with a real switch for "Start in the 3D city".
- **Other App-owned pieces:**
  - notifications and toasts drop in as glass banners;
  - the money pop-up is a glass capsule;
  - hints and tooltips grow from their trigger;
  - the character select, city card, loading and error screens, custom-avatar builder and share-card buttons are restyled.
  - The coach highlight breathes twice instead of pulsing forever.
- **Bug fixed:** picking a character low in the list used to open the dashboard already scrolled down. New screens now start at the top.

**Pages and dialogs** (six parallel agents, one exclusive file set each):
- **Landing:** an apple.com-grade hero with a gradient headline, and the key art as a product shot that tilts toward the pointer on mouse or trackpad only. Resume cards are Wallet-style passes; the mode cards are Arcade-style and become a snap rail on phones. It is readable by about 250 ms with no fade from black.
- **Dashboard:**
  - Simple view: a freedom `ActivityRing` beside springing figures, and month-action tiles with tinted medallions.
  - Full view: the health ring, one green advisor action, Stocks-style sparklines and a grouped-list risk cockpit.
  - FirstSteps: tactile option cards.
- **Money:** a net-worth hero and segmented sub-tabs. Invest has App Store-style cards and a floating cart bar; Portfolio a storage-style allocation bar and a grouped holdings list; Bank a Wallet card with a credit ring.
- **Career and Learn:**
  - Career: a profile card, an experience meter to the next promotion, an AI-risk gauge, and a ladder timeline whose "current" highlight glides.
  - Learn: course artwork cards and Fitness-style medals.
  - Quizzes: answers pop green or shake red.
  - Two bugs fixed: the phone ladder's current/next levels and Promote button from level 3 up, and the dimming of completed programs.
- **Life, Profile, More, Actions:**
  - Life: vitals as rings, and lifestyle tiers with a gliding selection ring.
  - More: iOS Settings lists with real switches.
  - The monthly-actions drawer is a real sheet. On phones it follows the finger, rubber-bands at the top and dismisses on a projected flick; on desktop it slides in from the right.
- **Dialogs** (all 21, plus Unlock, Quest log, Shortcuts and Leaderboard):
  - The life-event dialog has full-bleed art and option cards with red/green money chips.
  - The confirm dialog is an Apple alert; Accessibility and Save & Load are Settings lists.
  - Victory arrives on a bouncy spring; Year in review has one big figure and small bars.
- **3D city chrome** (`components/town/town.css` only, Apple Maps-style; `compare-city-*.jpg`):
  - The header, destination row, room bar and mission strip share one neutral dark bar with hairlines. The teal and gold are gone.
  - On desktop the room's buttons and "What can I do here?" now share one row.
  - Everything over the 3D view is glass: the caption, tips, Camera and reset, the location card, joystick, side panel, camera menu, toasts and café overlay. There are solid fallbacks where blur isn't supported and for reduced transparency.
  - Capsule buttons: green primary, gray secondary, and segmented toggles. Money is white and tabular, and the freedom bar runs green to cyan.
  - The 44px targets, focus rings and the build-62 phone layout are kept. On phones the side panel stays solid to save GPU.
  - Kids mode keeps its blue header and yellow button. The 3D scene and all town logic are untouched, and 233 town and kids tests pass.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `npx vitest run`: 90 files / 524 tests pass (518 + `test/UiPrimitives.test.tsx`).
- `npm run build`: passes (the chunk-size warning is the known one).
- Visual checks at 1280×800, 1366×768, iPhone 393×659 (WebKit) and with reduced motion, using `scripts/qa/ui-shot.cjs`. It opts out of Umami, so shots of the live site aren't counted.

## Found on the way, not changed

- **City panels (TSX, not done):** about 15 panel files type their section labels in ALL CAPS ("COMMUNITY BANK · TELLER"), so CSS can't make them sentence case. Every panel action also uses the same primary class; a secondary class in the markup would let in-card actions be gray capsules.

- `MortgageModal`'s preview line ("reduce cash to X") leaves out closing costs, while App's confirm dialog includes them. The figures disagree, and they did before this build.
- On phones, `ActionsScreen` and `MoreScreen` are still unreachable. Their content is also in the dashboard and in Quick actions. The profile is now reached through the avatar.
