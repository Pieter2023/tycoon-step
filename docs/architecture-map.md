# Tycoon: Financial Freedom - Architecture Map

**Version:** 3.4.3
**Last Updated:** 2025-12-30
**Document Type:** Technical Discovery & Planning

---

## 1. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | React | 18.3.1 | Functional components with hooks |
| **Language** | TypeScript | 5.6.3 | Strict mode disabled |
| **Build Tool** | Vite | 6.0.1 | Dev server on port 3000 |
| **Styling** | Tailwind CSS | CDN | Loaded via `<script>` tag |
| **Animation** | Framer Motion | 11.15.0 | Modal transitions, floating numbers |
| **Charts** | Recharts | 3.5.1 | Net worth history visualization |
| **Icons** | lucide-react | - | 468+ icons available |
| **Audio** | Web Audio API | - | Custom service for sound effects |
| **Confetti** | canvas-confetti | - | Victory celebrations |
| **Deployment** | Netlify | Node 20 | Configured in netlify.toml |

---

## 2. Project Structure

```
/
├── index.html              # Entry HTML, Tailwind config, custom CSS
├── index.tsx               # React DOM entry point (415 bytes)
├── App.tsx                 # Main game component (6500+ lines, 297KB) ⚠️ MONOLITH
├── KidsApp.tsx             # Kids mode game (43KB)
├── ModeSelector.tsx        # Auth/mode selection screen (43KB)
├── types.ts                # Type definitions (15KB, 400+ lines)
├── constants.ts            # Game data & config (2340 lines, 139KB)
├── kidsTypes.ts            # Kids mode types (3KB)
├── kidsConstants.ts        # Kids mode data (303 lines)
├── vite.config.ts          # Build configuration with code splitting
├── tsconfig.json           # TypeScript config (ES2020, non-strict)
├── package.json            # Dependencies
├── netlify.toml            # Deployment config
│
├── components/
│   ├── ErrorBoundary.tsx       # React error boundary (1.9KB)
│   ├── UpgradeEQTab.tsx        # EQ course quiz (33KB)
│   └── MasterNegotiationsTab.tsx # Negotiations course (33KB)
│
├── services/
│   ├── gameLogic.ts            # Core game mechanics (2600 lines, 112KB)
│   ├── storageService.ts       # Save/load system (12KB)
│   └── audioService.ts         # Sound effects (1.8KB)
│
├── public/
│   ├── videos/                 # 7 educational videos (~95MB)
│   ├── images/                 # Poster images
│   └── event-images/           # 101 scenario images
│
└── dist/                       # Build output
```

---

## 3. State Management Architecture

### Current Approach: Colocated `useState` Hooks

All game state lives in `App.tsx` using **44+ individual `useState` hooks**:

```typescript
// App.tsx - State Distribution
const [gameState, setGameState] = useState<GameState>()     // Core game data
const [activeTab, setActiveTab] = useState('overview')       // Navigation
const [confirmDialog, setConfirmDialog] = useState()         // Modal state
const [notification, setNotification] = useState()           // Toast state
const [soundEnabled, setSoundEnabled] = useState()           // Audio pref
const [showTurnPreview, setShowTurnPreview] = useState()     // Preview modal
const [introVideoTabId, setIntroVideoTabId] = useState()     // Video modal
const [introVideoMuted, setIntroVideoMuted] = useState()     // Video audio
const [introVideoIsPlaying, setIntroVideoIsPlaying] = useState()
const [autoPlaySpeed, setAutoPlaySpeed] = useState()         // Autoplay
// ... 34+ more useState calls
```

### GameState Interface (from `types.ts`)

```typescript
interface GameState {
  // Time
  month: number; year: number;

  // Financials
  cash: number;
  assets: Asset[];
  liabilities: Liability[];
  mortgages: Mortgage[];
  creditRating: number; // 300-850

  // Career & Education
  career: PlayerCareer;
  education: PlayerEducation;
  playerJob: PlayerJob;

  // Life
  lifestyle: Lifestyle;
  family: Family;
  vehicles: Vehicle[];
  stats: PlayerStats; // happiness, health, energy, stress

  // Economy
  economy: EconomyState;
  marketCycle: MarketCycle;
  aiDisruption: AIDisruptionState;

  // Events & Quests
  pendingScenario: Scenario | null;
  events: LifeEvent[];
  quests: QuestState;

  // Monthly Actions
  monthlyActionsMax: number;
  monthlyActionsRemaining: number;

  // Courses
  eqCourse: EQCourseState;
  negotiationsCourse: NegotiationsCourseState;

  // Meta
  hasWon: boolean;
  isBankrupt: boolean;
  prestige: PrestigeData;
  netWorthHistory: { month: number; value: number }[];
}
```

### Persistence Layer (`storageService.ts`)

- **localStorage-based** with JSON serialization
- **4 save slots**: autosave + 3 manual slots
- **Debounced autosave**: 250ms after state changes
- **Schema normalization**: Handles migrations for older saves

---

## 4. Navigation & Routing

### No Router - Tab-based Navigation

```typescript
// Navigation via local state
const [activeTab, setActiveTab] = useState('overview');

// Tab switching via onClick
<button onClick={() => { playClick(); setActiveTab(tab.id); }} />

// Conditional rendering
{activeTab === 'overview' && <OverviewTabContent />}
{activeTab === 'invest' && <InvestTabContent />}
```

### Available Tabs (10 total)

| Tab ID | Description | Intro Video |
|--------|-------------|-------------|
| `overview` | Dashboard/portfolio | portfolio video |
| `invest` | Investment market | investment-types video |
| `assets` | Owned assets | - |
| `bank` | Loans/credit | bank-tab video |
| `career` | Career progression | career video |
| `education` | Skill training | education-tab video |
| `sidehustle` | Side gigs | side-hustle video |
| `lifestyle` | Lifestyle prefs | - |
| `eq` | EQ course (UpgradeEQTab) | - |
| `negotiations` | Negotiations course | negotiations video |

### Entry Flow

```
index.html → index.tsx → ModeSelector.tsx
                           ├── [password: "Bokke"]
                           ├── Adult mode → App.tsx
                           ├── Kids mode → KidsApp.tsx
                           └── Multiplayer → App.tsx (with props)
```

---

## 5. Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         "NEXT MONTH" CLICK                              │
│  (handleNextMonth in App.tsx)                                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      TURN PREVIEW MODAL (Optional)                      │
│  - Shows income/expense breakdown                                       │
│  - Warning levels: SAFE / LOW_BUFFER / SHORTFALL                       │
│  - Coach hints for problem areas                                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    processTurn() - gameLogic.ts                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 1. updateAssetPrices() - Apply market volatility               │    │
│  │ 2. calculateMonthlyCashFlow() - Income vs expenses             │    │
│  │ 3. updateEducation() - Enrollment countdown                    │    │
│  │ 4. updateChildren() - Age progression, college costs           │    │
│  │ 5. updateAIDisruption() - Career threat progression            │    │
│  │ 6. updateMarketCycle() - Economic phase transitions            │    │
│  │ 7. checkPromotion() - Career advancement                       │    │
│  │ 8. generateLifeEvent() - Random scenario (20%+ chance)         │    │
│  │ 9. updateQuests() - Goal progress evaluation                   │    │
│  │ 10. Reset monthly actions for next turn                        │    │
│  └────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         SCENARIO MODAL                                  │
│  (if pendingScenario !== null)                                         │
│  - Display event with image                                            │
│  - Multi-choice outcomes                                               │
│  - applyScenarioOutcome() on choice                                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         STATE UPDATE                                    │
│  setGameState({ ...gameState, ...turnResult })                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          RE-RENDER                                      │
│  - UI updates with new month/year                                      │
│  - Net worth chart updates                                             │
│  - Notifications/floating numbers                                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      AUTOSAVE (useEffect)                               │
│  - Debounced 250ms                                                     │
│  - saveAdultGame(state, 'autosave')                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Content & Data Location

### All Game Content: `constants.ts` (2340 lines)

| Content Type | Count | Key Export |
|--------------|-------|------------|
| Characters | 9 | `CHARACTERS: Character[]` |
| Career Paths | 8 | `CAREER_PATHS` |
| Lifestyle Options | 5 | `LIFESTYLE_OPTS` |
| Market Items | 45+ | `MARKET_ITEMS: MarketItem[]` |
| Education Options | 25+ | `EDUCATION_OPTIONS` |
| Side Hustles | 15+ | `SIDE_HUSTLES` |
| Life Events | 100+ | `LIFE_EVENTS` |
| Quest Definitions | 20+ | `QUEST_DEFINITIONS` |
| Difficulty Settings | 5 | `DIFFICULTY_SETTINGS` |
| Mortgage Options | 5+ | `MORTGAGE_OPTIONS` |
| AI Career Impact | 8 | `AI_CAREER_IMPACT` |

### Media Assets

```
public/
├── videos/                      # 7 MP4 files (~95MB total)
│   ├── investment-types-explained.mp4
│   ├── master-your-game-portfolio.mp4
│   ├── education-tab-updated-tycoon.mp4
│   ├── climb-your-career.mp4
│   ├── side-hustle-updated-tycoon.mp4
│   ├── bank-tab-guide-tycoon.mp4
│   └── tycoon-master-negotiations.mp4
│
├── images/
│   └── financial-planner-poster-16x9.jpg
│
└── event-images/                # 101 scenario illustrations
    ├── tax-*.png
    ├── medical-*.png
    ├── career-*.png
    └── ... (etc)
```

---

## 7. UI Primitives

### No External Component Library

All UI components are built inline in `App.tsx`:

| Pattern | Implementation |
|---------|---------------|
| **Buttons** | Tailwind classes: `px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl` |
| **Modals** | AnimatePresence + motion.div with backdrop onClick |
| **Notifications** | Timed auto-dismiss with type-based styling |
| **Tabs** | Flexbox button row with `activeTab` state comparison |
| **Tooltips** | Click/tap triggered, stored in `openTooltipId` state |
| **Charts** | Recharts AreaChart wrapped in ResponsiveContainer |
| **Icons** | lucide-react imports (468+ available) |

### Modal Pattern (Repeated 8+ times)

```tsx
<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onClick={() => closeModal()}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl max-w-lg w-full"
      >
        {/* Modal content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 8. Top 10 Pain Points

### Critical (Blocking Issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **1** | **Monolithic App.tsx (6500+ lines)** | `App.tsx` | Unmaintainable, slow IDE, hard to test |
| **2** | **44+ useState hooks in one component** | `App.tsx:276-392` | State spaghetti, re-render cascades |
| **3** | **No automated tests** | Entire project | Regression risk on any change |

### High Priority (UX Issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **4** | **Button hitboxes too small on mobile** | Various (px-3 py-2 patterns) | Hard to tap, frustrating UX |
| **5** | **Modal close via backdrop inconsistent** | Multiple modals in App.tsx | Some modals close, others don't |
| **6** | **Video autoplay state complexity** | `App.tsx:374-389` (8+ video state vars) | Race conditions, playback bugs |
| **7** | **Autoplay (game turns) continues during modals** | `App.tsx:1414-1428` | Turns advance while user is reading |

### Medium Priority (Technical Debt)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **8** | **Tailwind via CDN (no purging)** | `index.html:15` | Large bundle, no custom classes validated |
| **9** | **No TypeScript strict mode** | `tsconfig.json` | Allows unsafe patterns |
| **10** | **Magic strings for tabs/events** | Throughout codebase | Typo-prone, no compile-time safety |

### Detailed Analysis

#### Pain Point 1: Monolithic App.tsx

```typescript
// App.tsx line counts by section (estimated):
// - Imports & types:        ~260 lines
// - State declarations:     ~120 lines
// - useCallbacks:           ~800 lines
// - useEffects:             ~400 lines
// - Event handlers:         ~600 lines
// - Tab content JSX:        ~4300 lines
// TOTAL:                    ~6500 lines
```

**Why it hurts:**
- IDE struggles with syntax highlighting/autocomplete
- Can't tree-shake dead code
- Every change requires understanding entire file
- Impossible to unit test individual tabs

#### Pain Point 4: Button Hitboxes

```tsx
// Common pattern (too small for mobile):
className="px-3 py-2 rounded-lg"  // ~32px touch target

// iOS Human Interface Guidelines: 44px minimum
// Material Design: 48dp minimum
```

#### Pain Point 6: Video State Complexity

```typescript
// 8 separate state variables for one video player:
const [introVideoTabId, setIntroVideoTabId] = useState<string | null>(null);
const [introVideoMuted, setIntroVideoMuted] = useState(true);
const [introVideoIsPlaying, setIntroVideoIsPlaying] = useState(false);
const [introVideoHasStarted, setIntroVideoHasStarted] = useState(false);
const [introVideoPlaybackError, setIntroVideoPlaybackError] = useState<string | null>(null);
const [introVideoDismissedThisVisit, setIntroVideoDismissedThisVisit] = useState<Record<string, boolean>>({});
const [introVideoAutoplayOnOpen, setIntroVideoAutoplayOnOpen] = useState(false);
const [minimizedTabVideos, setMinimizedTabVideos] = useState<Record<string, boolean>>({});
```

**Should be:** Single `useReducer` or custom hook.

#### Pain Point 7: Autoplay During Modals

```typescript
// App.tsx:1414-1428
const isAutoplayBlocked =
  !!gameState.pendingScenario ||
  !!showMortgageModal ||
  // ... but missing: confirmDialog, introVideoTabId, etc.
```

The blocklist is incomplete, causing autoplay to continue during some modal states.

---

## 9. Testing Strategy (Proposed)

### Current State: No Tests

All test files found are in `node_modules/` (from dependencies).

### Recommended Setup

```json
// package.json additions
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^23.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

```typescript
// vite.config.ts addition
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### Priority Test Targets

1. **`gameLogic.ts`** - Pure functions, highest ROI
   - `processTurn()`, `calculateNetWorth()`, `calculateMonthlyCashFlow()`
2. **`storageService.ts`** - Serialization edge cases
3. **Component smoke tests** - Render without crashing

---

## 10. Code Splitting Status

### Current Vite Config (Good)

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom'],
        motion: ['framer-motion'],
        recharts: ['recharts'],
        lucide: ['lucide-react'],
        confetti: ['canvas-confetti'],
      },
    },
  },
},
```

### Missing Optimizations

- Tab content not lazy-loaded (all 10 tabs bundled together)
- Course components (EQ, Negotiations) could be dynamic imports
- Kids mode (`KidsApp.tsx`) bundled with adult mode

---

## 11. Accessibility Status

### Implemented

- `largeText` mode (18px base font via CSS class)
- `highContrast` mode (boosted text colors)
- Preferences persisted to localStorage
- Keyboard navigation (Escape for modals, F/P for autoplay)

### Missing

- ARIA labels on interactive elements
- Focus management in modals
- Skip links for keyboard users
- Color contrast ratios not validated
- Screen reader announcements for state changes

---

## 12. Key Files Reference

| File | Size | Purpose | Risk Level |
|------|------|---------|------------|
| `App.tsx` | 297KB | Main game, ALL UI | HIGH - any change is risky |
| `gameLogic.ts` | 112KB | Turn processing, calculations | MEDIUM - well-isolated |
| `constants.ts` | 139KB | All game content | LOW - data only |
| `types.ts` | 15KB | Type definitions | LOW - compile-time only |
| `storageService.ts` | 12KB | Save/load | MEDIUM - data integrity |
| `ModeSelector.tsx` | 43KB | Entry/auth screen | LOW - isolated |
| `KidsApp.tsx` | 43KB | Kids game mode | LOW - separate feature |
| `UpgradeEQTab.tsx` | 33KB | EQ course component | LOW - isolated |
| `MasterNegotiationsTab.tsx` | 33KB | Negotiations course | LOW - isolated |

---

*Document generated by architecture discovery process. For implementation plan, see `implementation-plan.md`.*
