# Accessibility Checklist

## September 5 city additions

New city/café controls expose labelled destinations, order actions, pause/resume, guest patience and textual receipts. Keyboard movement/E, next-action walking buttons and the joystick coexist. Financial offers provide a fallback if WebGL is unavailable; hands-on serving requires the 3D renderer. Optional effects respect reduced motion.

Desktop and 390×844 browser layout/play checks were completed; café portrait framing was widened. These checks are not a full accessibility certification. Screen-reader usability of the world/task flow, keyboard-only navigation through every shift, colour contrast of all overlays and real-phone touch/multitouch remain explicit follow-ups. Most new town text is English-only. See [QA checklist](qa-checklist.md) and [handover](../HANDOVER.md).

## Contrast audit
- Muted text on dark backgrounds (e.g., `text-slate-500`, `text-slate-400`) was too low contrast in dense UI areas.
- Small label text in summary cards and status chips also relied on muted tones.
- Action labels on dark buttons needed stronger borders in high-contrast mode.

## Contrast adjustments
- Default theme lifts muted text one step for AA contrast on dark surfaces.
- High-contrast mode now boosts muted text plus key accent colors (emerald/amber/red) and borders.

## Keyboard navigation
- Focus rings are visible for keyboard users via `:focus-visible`.
- Modal focus trapping and restore-on-close remain enabled.
- Core HUD controls remain reachable in a logical order.

## ARIA / labels
- Icon-only buttons (HUD home, save/load, sound, accessibility, notification close, delete save) now have `aria-label`.
- Modals use `aria-label`/`aria-labelledby` so titles are announced.

## Screen reader sanity check
- Modal titles announced via `aria-label`.
- Action buttons use descriptive labels or aria-labels.

## Screenshots
- Not captured in this environment.
- Suggested: capture Settings (default vs high-contrast) and HUD (before/after focus ring) for documentation.
