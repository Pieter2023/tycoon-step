# UI Refactor Map

## Current Navigation
- Navigation is custom tab state in `App.tsx` (no React Router). `activeTab` drives which tab component renders.
- Tab ids come from `TABS` in `types.ts`.
- Primary tabs shown in the UI: Overview, Invest, Assets/Portfolio, Bank, Career, Education, Self Learn, Side Hustles, Lifestyle.
- `EQ` and `NEGOTIATIONS` exist in `TABS`, but UI content is embedded inside the Self Learn tab (`components/tabs/SelfLearnTab.tsx`).

## State + Core Calculations
- Core state lives in `App.tsx` via `useState<GameState>`; persistence handled by `services/storageService.ts`.
- Game logic and calculations are in `services/gameLogic.ts` (e.g., `calculateNetWorth`, `calculateMonthlyCashFlowEstimate`, `getCreditTier`, `processTurn`, `applyMonthlyAction`).
- Credit score is stored on `gameState.creditRating` and surfaced with `getCreditTier` and `getCreditTierColor` in `App.tsx`.
- Cash flow (income/expenses/passive) comes from `calculateMonthlyCashFlowEstimate(gameState)` in `App.tsx`.

## Overview Tab Composition
`components/tabs/OverviewTab.tsx` composes these sections and must remain functionally identical:
- Monthly Actions (uses `handleUseMonthlyAction`, energy/stress/health logic, monthly action counts).
- Credit Overview (credit score, tier, change reasons, chart).
- Goals & Quests (quest tracking, claim rewards, uses `getQuestProgress`, `getQuestById`).
- AI Disruption card (uses `aiImpact`, `gameState.aiDisruption`, `getAIRiskColor`).
- Economy card (recession state, inflation, market trend).
- Recent Events + Event Lab (life events list and simulation controls).
- Financial snapshot tiles and charts (net worth + cash flow data).

## Existing Tabs + Data Sources
- Overview: `components/tabs/OverviewTab.tsx` + data from `services/gameLogic.ts` and `constants.ts`.
- Invest: `components/tabs/InvestTab.tsx` + `MARKET_ITEMS`, filters, quiz flow.
- Assets/Portfolio: `components/tabs/PortfolioTab.tsx` + asset/liability state.
- Bank: `components/tabs/BankTab.tsx` + mortgage/loan logic from `services/gameLogic.ts`.
- Career: `components/tabs/CareerTab.tsx` + career progression, AI impact.
- Education: `components/tabs/EducationTab.tsx` + degrees, tuition, multipliers.
- Self Learn: `components/tabs/SelfLearnTab.tsx` (Sales Training, Upgrade EQ, Master Negotiations).
- Side Hustles: `components/tabs/SideHustlesTab.tsx` + upgrades/milestones.
- Lifestyle: `components/tabs/LifestyleTab.tsx` + expense tiers.

## Functional Invariants (Must Not Change)
- Financial calculations: net worth, cash flow, passive income, credit score, interest, and inflation.
- Monthly action effects, quest completion rules, and rewards.
- Investment pricing, market trend logic, and AI disruption effects.
- Save/load behavior and autosave semantics.

## UI v2 Feature Flag (Local)
- Set `VITE_UI_V2=true` in a local `.env` file, or
- Use the dev-only toggle button in the bottom-right corner, or
- Press `Ctrl+Shift+U` (Windows/Linux) or `Cmd+Shift+U` (macOS) to flip the local override stored in `localStorage` (`tycoon_ui_v2`).
