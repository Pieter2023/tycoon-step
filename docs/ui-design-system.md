# Tycoon UI design system (Apple-style, September 2026)

The 2D shell, its pages, dialogs and the mode picker follow Apple's interface principles, translated for the web. The system lives in `index.css` (tokens and component classes) and `components/ui/` (motion primitives). This page is the reference: read it before changing any 2D UI.

## 1. What it should feel like

- **Calm, dark, precise.** The background is near-black with two soft pools of light (green top-left, blue top-right). Content sits on quiet grouped surfaces. Colour marks meaning (money up = green, risk = orange or red, information = blue or cyan). It is never decoration.
- **Hierarchy comes from type and space, not borders.** Use one large title per page, section titles in semibold, and secondary text in gray. Don't box every block inside another box.
- **Everything responds on pointer-down.** Buttons press in (`scale .96`) the moment they're touched and spring back on release.
- **Motion is physical and interruptible.** Framer-motion springs start from the current value and carry velocity. Nothing uses a fixed-duration keyframe when a spring fits. Content arrives with a short stagger and a rise of a few points, and it leaves along the path it came in by.
- **Reduce motion means cross-fades.** App wraps the tree in `<MotionConfig reducedMotion>`, and CSS kills transitions under `html.tycoon-reduce-motion` and `prefers-reduced-motion`. Design every animation so it still reads as a fade.

## 2. Tokens (index.css)

**The palette is re-derived; the markup is unchanged.** Every Tailwind colour utility now renders in the Apple system:

| Tailwind | Renders as | Use for |
|---|---|---|
| `slate-950` | `#0c0c0d` | the deepest panels |
| `slate-900` | `#1c1c1e` (elevated background) | cards |
| `slate-800` | `#2c2c2e` | nested fills, hairlines on cards |
| `slate-700` | `#3a3a3c` | borders that must be seen, control fills |
| `slate-600` | `#5b5b60` | disabled text, strong separators |
| `slate-500` | `#8e8e93` | tertiary label (captions, hints) |
| `slate-400` | `#aeaeb2` | secondary label (descriptions) |
| `slate-300`/`200` | `#d1d1d6`/`#e5e5ea` | emphasised body text |
| `emerald-*`/`green-*` | Apple green `#30D158` (the 400 step) | money, progress, primary action |
| `red-*`/`rose-*` | Apple red `#FF453A` / pink `#FF375F` | losses, danger |
| `amber-*`/`orange-*` | Apple orange `#FF9F0A` | warnings, autoplay |
| `cyan-*`/`sky-*`/`blue-*` | Apple cyan `#64D2FF` / blue `#0A84FF` | information, net worth |
| `purple-*`/`violet-*`/`indigo-*` | Apple purple, violet, indigo | learning, rarity |

The old `!important` text-lifting hacks are gone; the palette itself meets AA.

**Semantic variables:**
- labels: `--label-1..4`;
- control fills: `--fill-1..4`;
- surfaces: `--bg-elevated`, `--hairline` (white at 8%), `--hairline-strong`, `--separator`;
- tints: `--tint-green`, `--tint-blue`, and the other system colours;
- the accent: `--accent`, and `--accent-ink` for text on the accent.

**Type:**
- `--font-sans` is the system font: SF Pro on Apple devices, with Inter as the fallback.
- Every `text-*` size carries its own tracking and leading. Large text tightens (−0.02em at 30px and up) and 12px text opens slightly. Don't add `tracking-wide` or the 0.16–0.22em uppercase "kicker" style. It is gone from the system.
- Named styles, when a bare size isn't enough: `.t-large-title` (34/40 bold), `.t-title-1` (28), `.t-title-2` (22), `.t-title-3` (20 semibold), `.t-headline` (17 semibold), `.t-body`, `.t-callout`, `.t-subhead` (15), `.t-footnote` (13), `.t-caption` (12).
- `.eyebrow` / `.tycoon-kicker`: a 13px semibold secondary label in sentence case.
- `.num` / `.tabular-nums`: tabular figures. Use them on every money value and count. Never use `font-mono` for money.

**Radii** are a step rounder than Tailwind's defaults:
- `rounded-lg` 12px, `rounded-xl` 16px, `rounded-2xl` 20px, `rounded-3xl` 28px;
- cards 18–22px, dialogs 28px;
- buttons are capsules (`rounded-full`), and small icon buttons are circles.

**CSS springs:**
- `--ease-spring` goes with 530 ms (`--spring-duration`).
- `--ease-spring-bouncy` goes with 520 ms.
- They are Tailwind utilities too: `ease-spring`, `ease-spring-bouncy`.

## 3. Component classes (index.css `@layer components`, so utilities still override)

| Class | What it is |
|---|---|
| `.surface` (= `.tycoon-panel`, `.ds-card`, `.glass-panel`) | A grouped content surface: a faint top-lit gradient over `#161618`, a hairline, radius 22 and a long soft shadow. The page's main blocks. |
| `.surface-card` (= `.tycoon-card`, `.glass-card`) | A smaller card, radius 18. |
| `.surface-inset` (= `.glass-card-compact`) | Something nested inside a surface: white at 4.5%, radius 14, no shadow. |
| `.surface-interactive` | Add to any clickable card: it brightens on hover, presses to .985 and springs back. |
| `.mat-chrome`, `.mat-bar` | Translucent bars and sidebars (blur 24–44px, saturate 180%); content scrolls under them. |
| `.mat-sheet` | Dialogs and sheets (thick material, bright top edge, deep shadow). The default for `Modal`. |
| `.mat-popover` | Menus, tooltips and floating banners. |
| `.pressable` | Press-in on pointer-down (`scale .96`), spring back on release. Put it on every button that isn't a `.ds-button`/`.btn-*`. |
| `.btn-primary` / `.ds-button--primary` | A green capsule with dark ink. One per view, for the main action. |
| `.btn-secondary` / `.ds-button--secondary` | A gray-fill capsule. |
| `.ds-button--ghost` | Blue text, no fill: tertiary actions. |
| `.chip` | A small gray-fill capsule for tags and filters. |
| `.ds-badge--low/med/high/extreme/neutral` | Tinted capsule badges with no borders. |
| `.meter` + `.meter-fill` | A thin rounded progress track; the fill's width springs. |
| `.list-group` + `.list-row` | An iOS inset grouped list with half-pixel separators inset 16px. Use a `button.list-row` for tappable rows. |
| `.stagger-in` | CSS-only: its children rise in, 40 ms apart (use it where framer-motion would be overkill). |
| `.no-scrollbar` | Hides the scrollbar on horizontal rails. |

Plain Tailwind still works. The same look in utilities is:
- a card: `rounded-[22px] border border-white/[0.08] bg-white/[0.04]`;
- nested: `rounded-2xl bg-white/[0.045]`;
- a hairline: `border-white/[0.08]`.

Prefer white-alpha fills and hairlines over `border-slate-700` boxes.

## 4. Motion primitives (`components/ui/`)

- `springs` (`motion.ts`): framer transitions.
  - `smooth` (bounce 0, 0.42 s) is the default for appear and move.
  - `snappy` (0.28 s) is for toggles and highlights.
  - `glide` (bounce 0.12) is for selection indicators.
  - `bouncy` (bounce 0.24) is only for momentum: a released drag or a flick.
  - `settle` (0.9 s) is for numbers and meters.
- Variants:
  - `riseIn` + `stagger(gap)` for page and section entrances;
  - `materialize` for glass surfaces (scale .96 + blur 6px → 0, with an exit on the same path).
- `project(velocity)` and `rubberband(overshoot, dimension)`: Apple's momentum projection and soft edge, for drag gestures.
- `MOTION_DISABLED` is true under Vitest. Components render final values synchronously there, so tests never see a half-animated number.
- `<AnimatedNumber value format />`: a figure that springs to its new value, with tabular digits and a brief green or red tint as it rises or falls. Use it for cash, net worth, passive income, scores and counts that change month to month.
- `<SegmentedControl options value onChange role />`: Apple's segmented control with a thumb that glides. `role="tablist"` gives `role=tab` + `aria-selected`, so existing tab tests keep working. Pass `buttonProps` for ids or `aria-controls`.
- `<ActivityRing progress colors size stroke>{centre}</ActivityRing>`: an Activity-style ring that draws in on a spring. Use it for freedom coverage and health scores.

**Rules for new motion:**
- Only animate `transform`, `opacity` and (briefly) `filter`. Never animate layout-heavy properties on large elements; a width on a small meter is fine.
- Use a `layoutId` for anything that moves between positions: the selected nav item, segmented thumbs, tab underlines.
- Entrances are springs of about 0.4 s with a 40 ms stagger. Don't delay interaction: content is clickable while it arrives.
- Never put `AnimatePresence mode="wait"` on page content. The new page must not wait for the old one to leave.
- Hover lifts are at most 2–3px. Presses scale to .96–.985 depending on the element's size: small buttons .96, large cards .985.
- No infinite looping animations (glows, pulses, shimmer loops). A one-shot sheen on arrival is fine.
- Motion must never change behaviour: the same handlers, names and roles.

## 5. Contracts (don't break these)

- **Accessible names and roles** drive the integration tests. For example, "More options" opens the "Quick actions" dialog, which holds the "Start in the 3D city" toggle. If you restyle a button, keep its text or `aria-label`. If you turn tabs into a `SegmentedControl`, keep `role="tab"` and the names.
- **Sound** fires from App's handlers (`playPurchase`, `playClick` and the others). Restyled controls must call the same props. Don't add sound calls in components.
- **Money on screen** comes from props (`financialFreedom`, `freedomPace`). Never recompute it in the UI.
- **Copy** is in English and Spanish. New visible strings need both: `tl('English','Español')` or i18n keys in `i18n/translations/en.json` and `es.json`.
- **`Modal`:**
  - The overlay scrolls and the dialog keeps its auto margins (build 60).
  - `contentClassName` is appended to `mat-sheet rounded-[28px]`. Don't pass `bg-slate-900 border …` unless you mean it: let the material show.
  - Under Vitest it unmounts instantly; in the browser it leaves by the path it came in.
- **Don't touch** the untracked dead files: `components/v2/DashboardScreen*.tsx`, `SidebarShell.tsx`, `components/ActionCard.tsx`, `CharacterSelect.tsx`, `FinancialFreedomBreakdown.tsx` and `NewUiRoot.tsx`.

## 6. Checks

- `npx tsc --noEmit -p .`
- `npx vitest run` (518+ tests)
- Visual: desktop 1280×800, a Chromebook-like 1366×768 and an iPhone at 393×659, with reduce motion on and off.
