# Tycoon: Financial Freedom - Implementation Plan

**Version:** 1.0
**Date:** 2025-12-30
**Status:** Discovery Complete - Ready for Prioritization

---

## Quick Reference

| Phase | Task Count | Effort Range | Key Focus |
|-------|------------|--------------|-----------|
| **Quick Wins** | 8 tasks | Hours to 2 days each | UX fixes, bug fixes |
| **Medium** | 6 tasks | 3-10 days each | Component extraction, testing |
| **Large Refactors** | 4 tasks | 2-6 weeks each | Architecture overhaul |

---

## Phase 1: Quick Wins

*Target: Immediate UX improvements with minimal risk*

### QW-1: Fix Button Touch Targets

**Problem:** Buttons use `px-3 py-2` (approx 32px height), below the 44px iOS/48px Android minimum.

**Files:** `App.tsx`, `ModeSelector.tsx`, `KidsApp.tsx`

**Fix:**
```diff
- className="px-3 py-2 rounded-lg"
+ className="px-4 py-3 min-h-[44px] rounded-lg"
```

**Effort:** 2-4 hours
**Risk:** Low - visual only
**PR Boundary:** Single PR touching all affected files

---

### QW-2: Fix Autoplay Blocklist

**Problem:** Autoplay continues during some modals because the blocklist is incomplete.

**File:** `App.tsx:1414-1428`

**Current:**
```typescript
const isAutoplayBlocked =
  !!gameState.pendingScenario ||
  !!showMortgageModal ||
  // Missing entries...
```

**Fix:**
```typescript
const isAutoplayBlocked =
  !!gameState.pendingScenario ||
  !!showMortgageModal ||
  !!confirmDialog ||
  !!introVideoTabId ||
  !!showTurnPreview ||
  !!marketSpecialAction ||
  !!imageLightbox;
```

**Effort:** 1 hour
**Risk:** Low - additive logic only
**PR Boundary:** Single small PR

---

### QW-3: Consolidate Video Player State

**Problem:** 8 separate `useState` hooks for video player logic.

**File:** `App.tsx:374-389`

**Fix:** Create `useVideoPlayer` hook:
```typescript
// hooks/useVideoPlayer.ts
export function useVideoPlayer() {
  const [state, dispatch] = useReducer(videoReducer, initialState);
  // Consolidates: tabId, muted, isPlaying, hasStarted, error, dismissed, autoplay, minimized
  return { state, play, pause, mute, unmute, dismiss, reset };
}
```

**Effort:** 4-6 hours
**Risk:** Medium - behavioral changes possible
**PR Boundary:** New hook + refactor of video logic

---

### QW-4: Add Tailwind Config File

**Problem:** Tailwind loaded via CDN with inline config, no class validation or purging.

**Current:** `index.html:15-32`

**Fix:**
1. Install Tailwind properly: `npm install -D tailwindcss postcss autoprefixer`
2. Create `tailwind.config.js` with custom colors/animations
3. Create `src/index.css` with Tailwind directives
4. Remove CDN script from `index.html`

**Effort:** 2-3 hours
**Risk:** Low - CSS output should be identical
**PR Boundary:** Single PR with Tailwind migration

---

### QW-5: Fix Modal Backdrop Close Inconsistency

**Problem:** Some modals close on backdrop click, others don't.

**Files:** `App.tsx` (8+ modal instances)

**Audit Results:**
| Modal | Backdrop Close | Line |
|-------|----------------|------|
| Intro Video | Yes | 2656 |
| Turn Preview | Yes | 2872 |
| Scenario | No | 3380 |
| Market Special | Partial | 3501 |
| Mortgage | Yes | 3857 |

**Fix:** Standardize all modals to close on backdrop click with `onClick={() => closeModal()}` on outer div.

**Effort:** 2-3 hours
**Risk:** Low - explicit behavior already exists
**PR Boundary:** Single PR standardizing modals

---

### QW-6: Add Basic Error Boundaries to Tabs

**Problem:** ErrorBoundary only wraps the entire app; a tab crash takes down everything.

**File:** `App.tsx` (tab rendering section)

**Fix:**
```tsx
{activeTab === 'invest' && (
  <ErrorBoundary fallback={<TabErrorFallback tab="invest" />}>
    <InvestTabContent />
  </ErrorBoundary>
)}
```

**Effort:** 2-3 hours
**Risk:** Low - additive only
**PR Boundary:** Error boundary wrapper for each tab

---

### QW-7: Type-Safe Tab Constants

**Problem:** Tab IDs are magic strings prone to typos.

**Files:** `App.tsx`, `types.ts`

**Fix:**
```typescript
// types.ts
export const TABS = {
  OVERVIEW: 'overview',
  INVEST: 'invest',
  ASSETS: 'assets',
  // ...
} as const;
export type TabId = typeof TABS[keyof typeof TABS];

// App.tsx
const [activeTab, setActiveTab] = useState<TabId>(TABS.OVERVIEW);
```

**Effort:** 2-4 hours
**Risk:** Low - compile-time checks only
**PR Boundary:** Single PR with type additions

---

### QW-8: Add Vitest Setup (Zero Tests)

**Problem:** No test infrastructure exists.

**Fix:**
1. Install: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom`
2. Add to `vite.config.ts`:
   ```typescript
   test: {
     globals: true,
     environment: 'jsdom',
   }
   ```
3. Add `test` script to `package.json`
4. Create first smoke test for `gameLogic.ts`

**Effort:** 3-4 hours
**Risk:** None - additive only
**PR Boundary:** Test setup + 1-2 sample tests

---

## Phase 2: Medium Tasks

*Target: Component extraction and structural improvements*

### M-1: Extract Tab Content Components

**Problem:** All 10 tabs are inline JSX in `App.tsx` (~4300 lines).

**Goal:** Create `components/tabs/` folder with one file per tab.

**Proposed Structure:**
```
components/
├── tabs/
│   ├── OverviewTab.tsx
│   ├── InvestTab.tsx
│   ├── AssetsTab.tsx
│   ├── BankTab.tsx
│   ├── CareerTab.tsx
│   ├── EducationTab.tsx
│   ├── SideHustleTab.tsx
│   ├── LifestyleTab.tsx
│   └── index.ts
```

**Approach:**
1. Start with smallest tab (e.g., Lifestyle)
2. Extract JSX + handlers that are tab-specific
3. Pass shared state via props or context
4. Repeat for each tab

**Effort:** 8-12 hours (1-2 hours per tab)
**Risk:** Medium - may introduce bugs in prop threading
**PR Boundary:** One PR per tab extraction (safer) or batch of 2-3

---

### M-2: Create UI Component Library

**Problem:** Button/Modal/Card patterns repeated throughout; no reusable components.

**Goal:** Create `components/ui/` folder with primitives.

**Proposed Components:**
```
components/
├── ui/
│   ├── Button.tsx          # Variants: primary, secondary, danger
│   ├── Modal.tsx           # Standard backdrop + close behavior
│   ├── Card.tsx            # Glass effect wrapper
│   ├── Badge.tsx           # Risk levels, categories
│   ├── Notification.tsx    # Toast component
│   ├── Tooltip.tsx         # Click-triggered info
│   └── index.ts
```

**Button API Example:**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Continue
</Button>
```

**Effort:** 6-10 hours
**Risk:** Medium - must maintain visual consistency
**PR Boundary:** One PR per component or batch all primitives

---

### M-3: Game State Context Provider

**Problem:** 44+ useState hooks; props drilling everywhere.

**Goal:** Create React Context for game state.

**Proposed Structure:**
```typescript
// context/GameStateContext.tsx
interface GameContextValue {
  state: GameState;
  dispatch: (action: GameAction) => void;
  // Derived values
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  // ...
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be within GameProvider');
  return ctx;
}
```

**Effort:** 10-15 hours
**Risk:** High - touches all components using game state
**PR Boundary:** Context creation → Gradual migration (multiple PRs)

---

### M-4: Test Coverage for gameLogic.ts

**Problem:** Core game mechanics have zero test coverage.

**Target Functions:**
```typescript
// Priority 1 - Pure, high-value
processTurn()
calculateNetWorth()
calculateMonthlyCashFlow()
calculateMonthlyCashFlowEstimate()

// Priority 2 - Business logic
applyScenarioOutcome()
updateAssetPrices()
checkPromotion()

// Priority 3 - Edge cases
createMortgage()
calculateLoanPayment()
getQuestProgress()
```

**Effort:** 8-15 hours
**Risk:** Low - tests only, no prod changes
**PR Boundary:** One PR per function group

---

### M-5: Lazy Load Course Components

**Problem:** EQ and Negotiations tabs (33KB each) are bundled upfront.

**Fix:**
```tsx
const UpgradeEQTab = React.lazy(() => import('./components/UpgradeEQTab'));
const MasterNegotiationsTab = React.lazy(() => import('./components/MasterNegotiationsTab'));

// In render:
{activeTab === 'eq' && (
  <Suspense fallback={<TabSkeleton />}>
    <UpgradeEQTab {...props} />
  </Suspense>
)}
```

**Effort:** 2-4 hours
**Risk:** Low - React.lazy is stable
**PR Boundary:** Single PR

---

### M-6: Separate Kids Mode Bundle

**Problem:** `KidsApp.tsx` (43KB) bundled with adult mode, even if never used.

**Fix:** Use dynamic import in `ModeSelector.tsx`:
```tsx
const [AppComponent, setAppComponent] = useState<React.ComponentType | null>(null);

const loadKidsMode = async () => {
  const { default: KidsApp } = await import('./KidsApp');
  setAppComponent(() => KidsApp);
};
```

**Effort:** 3-5 hours
**Risk:** Low - isolated feature
**PR Boundary:** Single PR

---

## Phase 3: Large Refactors

*Target: Architectural improvements for long-term maintainability*

### L-1: Split App.tsx into Feature Modules

**Problem:** 6500-line monolith is unmaintainable.

**Target Architecture:**
```
src/
├── App.tsx                    # Shell: providers, routing, layout (~200 lines)
├── features/
│   ├── game/
│   │   ├── GameProvider.tsx   # State context
│   │   ├── GameHeader.tsx     # Top bar, stats
│   │   └── GameFooter.tsx     # Tab navigation
│   ├── tabs/                  # From M-1
│   ├── modals/
│   │   ├── ScenarioModal.tsx
│   │   ├── TurnPreviewModal.tsx
│   │   ├── MortgageModal.tsx
│   │   └── ConfirmDialog.tsx
│   └── onboarding/
│       ├── IntroVideoModal.tsx
│       └── CoachHints.tsx
```

**Approach:**
1. Complete M-1 (tab extraction) first
2. Extract modal components
3. Extract header/footer
4. Create feature folders
5. Slim App.tsx to orchestration only

**Effort:** 4-6 weeks
**Risk:** High - major restructuring
**PR Boundary:** Multiple PRs following extraction sequence
**Dependencies:** M-1, M-2, M-3 should be done first

---

### L-2: Introduce Proper State Management

**Problem:** useState + prop drilling doesn't scale.

**Options:**
| Option | Pros | Cons |
|--------|------|------|
| **Zustand** | Simple, minimal boilerplate | Another dependency |
| **Redux Toolkit** | Already in node_modules | Overkill for this app |
| **React Context + useReducer** | No new deps, React-native | Verbose, re-render concerns |

**Recommendation:** Zustand - simple API, good DevTools, minimal learning curve.

**Proposed Structure:**
```typescript
// stores/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameStore {
  state: GameState;
  actions: {
    advanceMonth: () => void;
    buyAsset: (item: MarketItem, quantity: number) => void;
    sellAsset: (assetId: string, quantity: number) => void;
    // ...
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: INITIAL_GAME_STATE,
      actions: {
        advanceMonth: () => {
          const result = processTurn(get().state);
          set({ state: result });
        },
        // ...
      },
    }),
    { name: 'tycoon-game' }
  )
);
```

**Effort:** 3-4 weeks
**Risk:** High - changes all state interactions
**PR Boundary:** Store setup → Feature-by-feature migration
**Dependencies:** Complete M-3 first to understand context patterns

---

### L-3: Enable TypeScript Strict Mode

**Problem:** `tsconfig.json` has strict mode off; unsafe patterns allowed.

**Current State:**
```json
{
  "compilerOptions": {
    "strict": false,  // or omitted
    // ...
  }
}
```

**Approach:**
1. Enable `noImplicitAny` first (catches ~80% of issues)
2. Fix all errors
3. Enable `strictNullChecks`
4. Fix remaining errors
5. Enable full `strict: true`

**Common Fixes Needed:**
```typescript
// Before (implicit any)
const handleClick = (item) => { ... }
// After
const handleClick = (item: MarketItem) => { ... }

// Before (nullable not checked)
const value = obj.property.nested;
// After
const value = obj?.property?.nested ?? defaultValue;
```

**Effort:** 2-3 weeks
**Risk:** Medium - compile errors only, no runtime changes
**PR Boundary:** One PR per strict flag enabled

---

### L-4: Comprehensive Test Suite

**Problem:** Zero tests; high regression risk.

**Target Coverage:**
| Layer | Target | Priority |
|-------|--------|----------|
| **gameLogic.ts** | 80%+ | P0 |
| **storageService.ts** | 80%+ | P1 |
| **UI Components** | Smoke tests | P2 |
| **Integration** | Key user flows | P2 |
| **E2E** | Critical path | P3 |

**Proposed Test Stack:**
- **Unit:** Vitest + @testing-library/react
- **Integration:** Vitest with mock localStorage
- **E2E:** Playwright (future - not in initial scope)

**Key Test Scenarios:**
1. Starting a new game with each character
2. Month progression without errors
3. Buying/selling each asset type
4. Taking out and repaying loans
5. Win/bankruptcy conditions
6. Save/load round-trip integrity

**Effort:** 4-6 weeks for 80% unit coverage
**Risk:** None - tests only
**PR Boundary:** One PR per module tested

---

## Risk Assessment Matrix

| Task | Effort | Risk | Impact | Priority |
|------|--------|------|--------|----------|
| QW-1 Button Targets | Low | Low | High | P0 |
| QW-2 Autoplay Fix | Low | Low | High | P0 |
| QW-3 Video Hook | Medium | Medium | Medium | P1 |
| QW-4 Tailwind Config | Low | Low | Low | P2 |
| QW-5 Modal Backdrop | Low | Low | Medium | P1 |
| QW-6 Tab Error Boundaries | Low | Low | Medium | P1 |
| QW-7 Tab Constants | Low | Low | Low | P2 |
| QW-8 Vitest Setup | Low | None | High | P0 |
| M-1 Tab Extraction | High | Medium | High | P0 |
| M-2 UI Library | Medium | Medium | Medium | P1 |
| M-3 Game Context | High | High | High | P1 |
| M-4 gameLogic Tests | Medium | None | High | P0 |
| M-5 Lazy Load Courses | Low | Low | Low | P2 |
| M-6 Kids Bundle Split | Low | Low | Low | P2 |
| L-1 App.tsx Split | Very High | High | Very High | P0 |
| L-2 State Management | Very High | High | Very High | P1 |
| L-3 Strict TypeScript | High | Medium | High | P1 |
| L-4 Test Suite | High | None | Very High | P0 |

---

## Recommended Execution Order

### Sprint 1 (Week 1-2): Foundation
1. QW-8: Vitest Setup
2. QW-2: Autoplay Fix
3. QW-1: Button Targets
4. QW-5: Modal Backdrop
5. M-4: gameLogic Tests (start)

### Sprint 2 (Week 3-4): Component Extraction
1. QW-7: Tab Constants
2. M-1: Tab Extraction (first 3 tabs)
3. M-4: gameLogic Tests (complete)
4. QW-6: Tab Error Boundaries

### Sprint 3 (Week 5-6): Infrastructure
1. M-1: Tab Extraction (remaining tabs)
2. QW-4: Tailwind Config
3. M-2: UI Library (Button, Modal)
4. M-5: Lazy Load Courses

### Sprint 4+ (Week 7+): Major Refactors
1. M-3: Game Context
2. L-1: App.tsx Split
3. L-3: TypeScript Strict (phased)
4. L-2: State Management (if needed after L-1)

---

## Notes for Implementation

### Before Any Change
1. Manually test the affected feature
2. Document current behavior
3. Create branch from `main`

### PR Guidelines
- One logical change per PR
- Include before/after screenshots for UI changes
- Link to relevant section of this plan in PR description
- Smoke test in browser before requesting review

### Testing Strategy
1. Write test for existing behavior first
2. Verify test passes
3. Make change
4. Update test if behavior should change
5. Verify all tests pass

---

*This plan does not modify gameplay balance. All changes are structural, UX, or infrastructure improvements.*
