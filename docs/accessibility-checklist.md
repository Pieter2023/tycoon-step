# Accessibility Checklist

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
