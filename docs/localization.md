# Localization Guide

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
