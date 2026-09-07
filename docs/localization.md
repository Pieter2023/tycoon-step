# Localization Guide

> **September 5 scope note:** the existing translation system remains in place, but most new `components/town/` labels, guest text and service receipts are currently English literals. Do not describe the city/café as fully localized. Extract these strings, check plural/currency formatting and test layout expansion before claiming another language is supported for the new activity. See [HANDOVER.md](../HANDOVER.md).

## Overview
This project uses a lightweight i18n layer in `i18n/index.ts` with JSON translation files in `i18n/translations/`.

## Adding a new language
1) Copy `i18n/translations/en.json` to a new file (e.g., `fr.json`).
2) Translate the values, keep the keys the same.
3) Add the locale to `i18n/index.ts`:
   - Extend `Locale` and `translations` to include the new file.
4) Add the language option in the Settings language selector in `App.tsx`.

## Using translations
- Use the `t()` helper from `useI18n()` for UI text:
  - Example: `t('quests.claimAll')`
- For dynamic values, pass params:
  - Example: `t('quests.completeTitle', { title: t(quest.title) })`
- Plurals are stored as objects with `one`/`other` keys:
  - Example: `"quests.claimAllBody": { "one": "...", "other": "..." }`
  - Use `t('quests.claimAllBody', { count: 2 })`

## Formatting
- `formatCurrency`, `formatCurrencyCompact`, `formatNumber`, `formatPercent`, `formatDateTime` are available from `useI18n()`.
- Non-React modules can use helpers in `i18n/index.ts` such as `formatCurrencyValue`.

## Event authoring
- `data/events.json` now uses localization keys:
  - `titleKey`, `descriptionKey`
  - `choices[].labelKey`
  - `effects.messageKey`
- Add the corresponding text in `i18n/translations/en.json` (and other locales).

## Notes
- The default locale is stored in `localStorage` under `tycoon_locale`.
- The HTML `lang` attribute is updated when the locale changes.

## City copy review (2026-09-07)

All 1,474 `tl(en, es)` pairs in the city were read in one sitting (extract with a regex over `components/town`, `services/town*`, `i18n/town.ts`). House rules that came out of it: tú register everywhere; Latin American vocabulary (renta, enganche, cochera, auto, tasa anual, sala de operaciones); avoid gendered participles addressed to the player ("Te damos la bienvenida", "Ya puedes pasar a", "¿Te despidieron?"); couples' statuses in plural ("Prometidos", "Casados"); badge names keep the generic masculine. The dashboard's `es.json` is the June translation and has not had the same read.

## Dashboard es.json rewrite (2026-09-07)

The June file lacked accents and ñ, left 323 strings in English (all live: `events.*` feed `data/events.json`, character questlines, the sales certification and quiz) and had no ¿. It was regenerated from `en.json`'s structure: flatten the English, translate into a flat dict, refill the structure, assert every `{placeholder}` set matches. Keep the two vocabularies aligned with the city (ingresos extra, flujo de efectivo, cartera, contactos). Five strings equal the English by design (formats, the title, "Normal").

## Dashboard shell keys (2026-09-07, build 39)

Shell chrome lives under `shell.<component>.<slug>` (for example `shell.desktopShell.workspace`, `shell.commandDashboard.actions_left`, `shell.header.next_month`, `shell.quickActions.back_to_menu`). Rules that made the pass work:

- Components call `const { t } = useI18n();` once, right after the parameter list. Module-level helpers that build copy take the translator as a parameter typed `Translate` (exported from `i18n/index.tsx`) so they stay pure and testable.
- Interpolations are single keys with placeholders (`{remaining} of {max} actions left…`), never concatenated fragments; Spanish word order differs.
- `scripts/i18n-shell-transform.py` does the mechanical rewrite (dry run by default, `--apply` writes the files and a keys JSON). It refuses strings with newlines, `;=()[]|`, or that do not start with a letter or emoji, so template strings and `{x} of {y}` sentences must be keyed by hand. Do not let it touch all-caps identifiers (`RECOVER`, `OVERTIME`).
- Any test that renders a shell component must wrap it in `I18nProvider`; `useI18n` throws otherwise.
- Under Vite HMR, editing the translation JSON can re-create the context and trip the error boundary ("useI18n must be used within I18nProvider"); reload the page. Production is unaffected.
- Still English by choice: `components/tabs/*` bodies and `services/monthlyActions.ts` card copy.
