# QA Checklist

Use this list to verify critical flows after UI refactors or logic changes.

## Core Progression
- Start a new game with a character and confirm starting cash, stats, and month/year.
- Click "Next Month" and verify month advances, cashflow updates, and an event appears.
- Toggle Autoplay on/off and confirm it advances months only when no blocking modals are open.

## Monthly Actions
- Take a monthly action (Overtime or Training) and confirm cash/stats change.
- Open "View All Actions" and execute one action from the drawer.
- Confirm actions remaining decreases and re-renders correctly.

## Goals & Quests
- Claim a ready reward from Play/Goals and confirm cash/stats change immediately.
- Open the full Goals list and verify all quests are accessible.

## Money
- Buy an asset in Invest and confirm cash decreases and net worth updates.
- Sell an asset and confirm cash increases and holdings decrease.
- Open Portfolio/Bank sub-tabs and verify content renders without errors.

## Career
- Trigger a career action (apply/upgrade if available) and confirm salary or level changes.
- Verify Skills/EQ/Negotiation values render correctly.

## Learn
- Start or continue a course and verify progress is saved.
- Complete a quiz and confirm results/rewards apply.

## Life
- Change Lifestyle and verify monthly expenses/cashflow update.
- Start/upgrade a side hustle and confirm income/stats update.

## Save/Load
- Save the game to a slot and reload it; verify cash, month, assets, and quests are preserved.

## UI v2 Toggle
- Enable UI v2 and confirm all five top-level pages render (Play, Money, Career, Learn, Life).
- Disable UI v2 and confirm the legacy tabbed UI still works.
