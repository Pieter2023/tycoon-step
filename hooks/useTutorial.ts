import { useCallback, useEffect, useState } from 'react';
import { TUTORIAL_TIPS } from '../components/modals/TutorialModal';
import { QUICK_TUTORIAL_STORAGE_KEY } from '../components/modals/QuickTutorialModal';

export const AUTO_TUTORIAL_POPUPS_STORAGE_KEY = 'tycoon_auto_tutorial_popups_v1';
export const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';
export const HIDE_TIPS_STORAGE_KEY = 'tycoon_hide_tips_v1';

interface TutorialDeps {
  gameStarted: boolean;
  isMultiplayer?: boolean;
  isResumingFromSave: boolean;
}

// Phase-3 slice 3: the tutorial/onboarding cluster from App.tsx — the step
// tutorial (show/step/dismissed), the quick-tutorial video auto-open, and the
// auto-popups / hide-tips preferences with their localStorage persistence.
// No useI18n here on purpose: every string in this cluster is hardcoded
// English in the JSX that stays in App. The onboarding-seen key is a hard
// contract with the integration tests (they seed it to suppress the overlay).
// TUTORIAL_TIPS / QUICK_TUTORIAL_STORAGE_KEY are deliberately imported from
// the leaf modal files, not the components/modals barrel (cycle safety).
export const useTutorial = (deps: TutorialDeps) => {
  const { gameStarted, isMultiplayer, isResumingFromSave } = deps;

  const [showQuickTutorial, setShowQuickTutorial] = useState(false);

  const [autoTutorialPopups, setAutoTutorialPopups] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTO_TUTORIAL_POPUPS_STORAGE_KEY);
      return stored === null ? true : stored === '1';
    } catch (e) {
      console.warn('Failed to read tutorial popup preference:', e);
      return true;
    }
  });
  const [hideTipsEverywhere, setHideTipsEverywhere] = useState(() => {
    try {
      return localStorage.getItem(HIDE_TIPS_STORAGE_KEY) === '1';
    } catch (e) {
      console.warn('Failed to read tips preference:', e);
      return false;
    }
  });

  // Tutorial state - track which tips have been shown
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) !== '1';
    } catch (e) {
      console.warn('Failed to read onboarding preference:', e);
      return true;
    }
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

  const markOnboardingSeen = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
    } catch (e) {
      console.warn('Failed to save onboarding preference:', e);
    }
  }, []);

  const shouldShowOnboarding = useCallback(() => {
    if (!autoTutorialPopups) return false;
    try {
      return localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) !== '1';
    } catch (e) {
      console.warn('Failed to read onboarding preference:', e);
      return false;
    }
  }, [autoTutorialPopups]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_TUTORIAL_POPUPS_STORAGE_KEY, autoTutorialPopups ? '1' : '0');
    } catch (e) {
      console.warn('Failed to save tutorial popup preference:', e);
    }
  }, [autoTutorialPopups]);

  useEffect(() => {
    try {
      localStorage.setItem(HIDE_TIPS_STORAGE_KEY, hideTipsEverywhere ? '1' : '0');
    } catch (e) {
      console.warn('Failed to save tips preference:', e);
    }
  }, [hideTipsEverywhere]);

  useEffect(() => {
    if (!gameStarted || isMultiplayer) return;
    if (import.meta.env.MODE === 'test') return;
    if (isResumingFromSave || !autoTutorialPopups || hideTipsEverywhere) return;
    try {
      const seen = localStorage.getItem(QUICK_TUTORIAL_STORAGE_KEY) === '1';
      if (!seen) setShowQuickTutorial(true);
    } catch (e) {
      console.warn('Failed to read quick tutorial preference:', e);
      setShowQuickTutorial(true);
    }
  }, [autoTutorialPopups, gameStarted, hideTipsEverywhere, isMultiplayer, isResumingFromSave]);

  // Turning auto-popups off dismisses an in-progress tutorial for good.
  useEffect(() => {
    if (autoTutorialPopups) return;
    if (!showTutorial) return;
    setShowTutorial(false);
    setTutorialDismissed(true);
    markOnboardingSeen();
  }, [autoTutorialPopups, showTutorial, markOnboardingSeen]);

  const isTutorialActive = showTutorial && !tutorialDismissed && tutorialStep < TUTORIAL_TIPS.length;

  return {
    autoTutorialPopups,
    setAutoTutorialPopups,
    hideTipsEverywhere,
    setHideTipsEverywhere,
    showTutorial,
    setShowTutorial,
    tutorialStep,
    setTutorialStep,
    tutorialDismissed,
    setTutorialDismissed,
    showQuickTutorial,
    setShowQuickTutorial,
    isTutorialActive,
    markOnboardingSeen,
    shouldShowOnboarding
  };
};
