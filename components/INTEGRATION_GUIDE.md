# Integration Guide - New Components

This guide shows how to integrate the new components (Collapsible Sections, Toast, Confetti, Keyboard Shortcuts, and improved Character Select) into the existing App.tsx.

## Step 1: Import New Components

Add these imports to the top of `App.tsx`:

```typescript
// New Components
import CollapsibleSection from './components/ui/CollapsibleSection';
import { ToastContainer, useToast } from './components/ui/Toast';
import Confetti from './components/Confetti';
import KeyboardShortcutsOverlay from './components/KeyboardShortcutsOverlay';
import CharacterSelect from './components/CharacterSelect';
import DashboardScreenEnhanced from './components/v2/DashboardScreenEnhanced';

// Hooks
import { useKeyboardShortcuts, createGameShortcuts } from './hooks/useKeyboardShortcuts';
```

## Step 2: Add Toast Hook to App Component

Inside the App component, add:

```typescript
const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();
```

## Step 3: Add Keyboard Shortcuts State

Add to your state:

```typescript
const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false);
const [showConfetti, setShowConfetti] = useState(false);
```

## Step 4: Setup Keyboard Shortcuts

Add this hook call:

```typescript
useKeyboardShortcuts(
  createGameShortcuts({
    onNextMonth: () => handleNextTurn(),
    onToggleAutoplay: () => setAutoPlaySpeed(autoPlaySpeed ? null : AUTOPLAY_SPEED_OPTIONS[0]),
    onOpenActions: () => setActionsDrawerOpen(true),
    onNavigateToInvest: () => setActiveTab(TABS.INVEST),
    onNavigateToPortfolio: () => setActiveTab(TABS.ASSETS),
    onNavigateToBank: () => setActiveTab(TABS.BANK),
    onNavigateToCareer: () => setActiveTab(TABS.CAREER),
    onNavigateToEducation: () => setActiveTab(TABS.EDUCATION),
    onNavigateToSideHustles: () => setActiveTab(TABS.SIDEHUSTLE),
    onNavigateToLifestyle: () => setActiveTab(TABS.LIFESTYLE),
    onShowShortcuts: () => setShowShortcutsOverlay(true),
  }),
  gameStarted // Only enable when game is active
);
```

## Step 5: Update Character Selection Screen

Replace the character select section (around line 4264-4357) with:

```typescript
// Character Select Screen
if (showCharacterSelect) {
  if (showCustomAvatarBuilder) {
    return (
      <CustomAvatarBuilder
        onCancel={() => setShowCustomAvatarBuilder(false)}
        onComplete={handleCreateCustomCharacter}
      />
    );
  }
  
  return (
    <CharacterSelect
      characters={CHARACTERS}
      selectedDifficulty={selectedDifficulty}
      onSelectDifficulty={setSelectedDifficulty}
      onSelectCharacter={handleSelectCharacter}
      onCreateCustom={() => setShowCustomAvatarBuilder(true)}
      formatMoney={formatMoney}
    />
  );
}
```

## Step 6: Update Main Game Render

In the main return statement (around line 4454), add the new components:

```typescript
return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-24 md:pb-4">
    {/* Confetti Effect */}
    <Confetti 
      active={showConfetti} 
      onComplete={() => setShowConfetti(false)} 
    />
    
    {/* Toast Notifications */}
    <ToastContainer toasts={toasts} onDismiss={removeToast} />
    
    {/* Keyboard Shortcuts Overlay */}
    <KeyboardShortcutsOverlay
      isOpen={showShortcutsOverlay}
      onClose={() => setShowShortcutsOverlay(false)}
      shortcuts={createGameShortcuts({
        onNextMonth: () => {},
        onToggleAutoplay: () => {},
        onOpenActions: () => {},
        onNavigateToInvest: () => {},
        onNavigateToPortfolio: () => {},
        onNavigateToBank: () => {},
        onNavigateToCareer: () => {},
        onNavigateToEducation: () => {},
        onNavigateToSideHustles: () => {},
        onNavigateToLifestyle: () => {},
      })}
    />
    
    {/* Existing Floating Numbers */}
    <AnimatePresence>
      {floatingNumbers.map(fn => (
        <FloatingNumber key={fn.id} value={fn.value} onComplete={() => setFloatingNumbers(p => p.filter(f => f.id !== fn.id))} />
      ))}
    </AnimatePresence>
    
    {/* Rest of existing code... */}
```

## Step 7: Update Next Month Handler

Modify your advanceMonth or handleNextTurn to trigger confetti:

```typescript
const advanceMonth = useCallback((opts?: { showSummaryToast?: boolean }) => {
  if (isProcessing || gameState.pendingScenario || gameState.pendingSideHustleUpgrade) return;
  setIsProcessing(true);
  playTick();

  setTimeout(() => {
    const { newState, monthlyReport: report } = processTurn(gameState);
    
    // Trigger confetti on significant milestones
    if (newState.hasWon && !gameState.hasWon) {
      setShowConfetti(true);
      playVictory();
    }
    
    // Show toast notification
    const netIncome = report.income - report.expenses;
    if (Math.abs(netIncome) > 100) {
      showInfo(
        'Month Complete',
        `Income: ${formatMoneyFull(report.income)} • Expenses: ${formatMoneyFull(report.expenses)} • Net: ${netIncome >= 0 ? '+' : ''}${formatMoneyFull(netIncome)}`,
        { duration: 5000 }
      );
    }
    
    // ... rest of existing logic
  }, 150);
}, [/* dependencies */]);
```

## Step 8: Add Toast Trigger to Existing showNotif

Update your showNotif function to also add toasts:

```typescript
const showNotif = useCallback((
  title: string,
  message: string,
  type: string = 'info',
  opts?: { actionLabel?: string; onAction?: () => void; durationMs?: number }
) => {
  // Existing notification logic...
  
  // Also show toast
  if (type === 'success') {
    showSuccess(title, message, { duration: opts?.durationMs });
  } else if (type === 'error') {
    showError(title, message, { duration: opts?.durationMs });
  } else if (type === 'warning') {
    showWarning(title, message, { duration: opts?.durationMs });
  } else {
    showInfo(title, message, { duration: opts?.durationMs });
  }
}, [showSuccess, showError, showWarning, showInfo]);
```

## Step 9: Update Dashboard to Use Enhanced Version

Where you render the dashboard, use the new enhanced version:

```typescript
// In your render section, where DashboardScreen is used:
<DashboardScreenEnhanced
  cashValue={gameState.cash}
  netWorthValue={netWorth}
  passiveValue={cashFlow.passive}
  expenseValue={cashFlow.expenses}
  formatMoney={formatMoney}
  freedomPercent={freedomPercent}
  passiveTrend={passiveTrendMini}
  expenseTrend={expenseTrendMini}
  ratioValue={ratioValue}
  ratioLabel={`${ratioValue}%`}
  passiveDelta={null}
  expenseDelta={expenseDelta}
  cashSparkline={netWorthTrendData}
  netWorthSparkline={netWorthTrendData}
  passiveSparkline={passiveTrendMini}
  monthlyActions={monthlyActions}
  onUseMonthlyAction={handleMonthlyAction}
  onOpenActions={() => setActionsDrawerOpen(true)}
  onNavigate={handleV2Navigate}
  events={gameState.events}
  gameState={gameState}
  onClaimQuest={handleClaimQuest}
  onOpenGoals={() => setShowQuestLog(true)}
  isProcessing={isProcessing}
  onShowToast={showInfo}
/>
```

## Step 10: Add Keyboard Shortcut Button

In your header, add a button to show shortcuts:

```typescript
<button
  onClick={() => setShowShortcutsOverlay(true)}
  className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-slate-600"
  title="Keyboard shortcuts (?)"
>
  <Keyboard className="w-5 h-5 text-slate-400" />
</button>
```

## CSS Updates Required

Add these CSS classes to your `index.css`:

```css
/* Glass card compact variant */
.glass-card-compact {
  background: linear-gradient(145deg, rgba(17, 24, 39, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
}

/* Progress shimmer animation */
.progress-shimmer {
  position: relative;
  overflow: hidden;
}

.progress-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Number animation */
.number-animate {
  animation: numberPulse 0.3s ease;
}

@keyframes numberPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## Summary of New Files

| File | Purpose |
|------|---------|
| `components/ui/CollapsibleSection.tsx` | Reusable collapsible panel |
| `components/ui/Toast.tsx` | Toast notification system with hook |
| `components/Confetti.tsx` | Canvas-based confetti effect |
| `components/KeyboardShortcutsOverlay.tsx` | Shortcuts help modal |
| `components/CharacterSelect.tsx` | Improved character selection |
| `components/v2/DashboardScreenEnhanced.tsx` | Dashboard with collapsible sections |
| `hooks/useKeyboardShortcuts.ts` | Keyboard shortcuts hook |

## Testing Checklist

After integration, verify:

- [ ] Character selection screen looks improved
- [ ] Collapsible sections expand/collapse smoothly
- [ ] Toast notifications appear on actions
- [ ] Keyboard shortcuts work (try pressing `?`)
- [ ] Confetti triggers on Next Month or achievements
- [ ] View mode toggle (Compact/Expanded) works
- [ ] All existing functionality still works
- [ ] No console errors

## Rollback Plan

If issues arise:

1. Keep old imports alongside new ones
2. Use feature flags to toggle between old/new components
3. Gradually migrate one section at a time
4. Test thoroughly before removing old code
