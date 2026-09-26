# Build 62: the phone check's findings (2026-09-26)

Fixes for the three "Other findings" in `docs/verification/phone-2026-09-26/`.

## 1. Events framed in the right place

Every `SOCIAL` event opened with "📍 Rosa knocks on your door", including "Office Birthday Collection". A scan of all ~120 events found others framed by a category that didn't fit:
- rental-property events read "At home, 12 Square St";
- work bonuses read "A letter from the Community Bank";
- a cracked phone was a `VEHICLE` event staged at the garage.

**Fix** (`services/townEvents.ts`): `eventPlace(category, eventId)` checks a per-event table, `EVENT_PLACES`, before the category. Both callers pass the event id: the event card's place line (`App.tsx`) and the 3D stage (`TownModal`).

| Where | Events |
|---|---|
| At the office | coworker birthday, work and major bonus, stock options, layoff wave, job loss |
| A letter on your doormat | friend's wedding, reunion, tax refund, insurance discount, rent increase |
| On Main Street | avocado toast, coffee habit, restaurant bill, partner dispute, and fraud, lawsuit or fine at your business |
| At home | 3 AM shopping, dating app, sales emails, vacation deal, break-in |
| On Freedom Square | going viral, both lottery wins, cracked phone |
| At the garage bay, the bank | parking ticket; mystery card charge |
| **At Property & Co.** (new place) | the eight rental and landlord events |

- The new `property` place is staged over the Property & Co. door (`EVENT_STAGE`, `stage-property.jpg`).
- Events not in the table follow their category, so new SOCIAL events still go to Rosa.
- Test: `test/TownEventPlaces.test.ts`. Every id in the table is a real event, and every place has a stage ring on walkable pavement.

## 2. The destination row on a portrait phone

Only 3 of the 12 destinations fit on screen, with no sign that the row scrolls.

**Fix** (`TownModal`, `town.css`):
- While the row overflows, a › button with an edge fade appears on the right, and ‹ on the left once scrolled. Each tap scrolls 70% of the row, instantly with reduced motion.
- The chosen destination scrolls into view.
- A `ResizeObserver` keeps the buttons right through rotation.
- On desktop the row fits, so no buttons show.

## 3. Rooms on a portrait phone

On phones only (`max-width: 767px`):
- **Destinations:** hidden inside rooms. The room bar already has its walk-to button and the exit.
- **Room bar:** "What can I do here?" becomes a round "?" at the start of the row. Its accessible name keeps the full text.
- **Buttons:** "Walk to exit" is hidden; the quick exit reads "Exit ↗". The café's four buttons fit at 393 px.
- **Journey strip:** folds into a single row of summary, guide button and Sound. A long guide ("Confirm my cash reserve →") wraps to two lines rather than being cut off.

Desktop keeps the full labels and the separate lines: the room bar is `display: contents` there.

## Measured

iPhone 15 Pro WebKit (393×659), live build 61 against build 62; `phone-layout.cjs`, `phone-layout-before-after.jpg`:

| | HUD above the 3D view | 3D view |
|---|---|---|
| Square, before | 254 px (header 78, destinations 65, strip 111) | 405 px |
| Square, after | 200 px (strip 57) | **459 px** |
| Bank, before | 354 px (+ room buttons 56, help 44) | 305 px |
| Bank, after | 192 px (header 78, room bar 56, strip 58) | **467 px (+53%)** |

- **All seven rooms at 393 px:** the room bar fits without scrolling. The 3D view is 469 px in the bank, café, office and college, and 485 px at home, the Exchange and Property & Co.
- **Destination row:** one › shows Café, Home and Work; a second reaches the end and › hides (`destinations-scrolled.jpg`).
- **Real iPhone** (LAN build, iPhone Mirroring):
  - › appears and scrolls;
  - in the bank the room bar reads "?  Walk to teller  Exit ↗" with the destinations gone;
  - the 3D view fills most of the screen;
  - 60 fps.
- **Desktop at 1,400 px:** unchanged. There are no scroll buttons; the bank keeps its destinations, "Walk to exit", "Return to square ↗" and the full help line; and leaving works.

## Tests

- `test/TownEventPlaces.test.ts` (3 tests) and `test/TownPhoneLayout.test.tsx` (2 tests): overflow buttons and scrolling, the room class, the compact help, and the exit labels and action.
- The suite (496 tests / 88 files), `tsc` and the production build pass.
