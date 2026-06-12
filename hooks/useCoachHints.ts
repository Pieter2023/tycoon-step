import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TABS, TabId } from '../types';

export const SELF_LEARN_HINT_STORAGE_KEY = 'tycoon_self_learn_hint_v1';

export type CoachTarget =
  | 'monthly-actions'
  | 'lifestyle-grid'
  | 'assets-sell'
  | 'sidehustles-list'
  | 'bank-loans'
  | 'self-learn-tab';

export type CoachHintData = {
  id: string;
  tabId: TabId;
  title: string;
  message: string;
  target?: CoachTarget;
  allowReopenPreview?: boolean;
};

interface CoachHintsDeps {
  // null = a v2 surface with no legacy TabId equivalent (e.g. Money's
  // Reports tab); hint gates simply never match there.
  activeTab: TabId | null;
  gameStarted: boolean;
  isMultiplayer?: boolean;
  reduceMotion: boolean;
  showTurnPreview: boolean;
}

// Phase-3 slice 4: the coach-hint cluster from App.tsx (Step 12) — the hint
// ribbon state + auto-clear timer, the per-section focus refs with the
// scroll-into-view effect, the one-time Self Learn hint, and the "Re-open
// Preview" pill (it lives here because coach hints are what offer it; the
// pill JSX stays in App). No useI18n on purpose: the cluster's only string
// is the hardcoded self-learn hint. The ribbon/pill JSX and all tab prop
// wiring stay in App and read this hook's returns.
export const useCoachHints = (deps: CoachHintsDeps) => {
  const { activeTab, gameStarted, isMultiplayer, reduceMotion, showTurnPreview } = deps;

  const [coachHint, setCoachHint] = useState<CoachHintData | null>(null);
  const coachTimeoutRef = useRef<number | null>(null);

  // After a "Quick Fix" jump, offer a convenient "Re-open Preview" pill for a short time.
  const [showReopenPreviewPill, setShowReopenPreviewPill] = useState(false);
  const reopenPreviewTimeoutRef = useRef<number | null>(null);

  // Coach focus refs (used to scroll + highlight the exact spot)
  const coachMonthlyActionsRef = useRef<HTMLDivElement | null>(null);
  const coachLifestyleGridRef = useRef<HTMLDivElement | null>(null);
  const coachAssetsSellRef = useRef<HTMLDivElement | null>(null);
  const coachSideHustlesRef = useRef<HTMLDivElement | null>(null);
  const coachBankLoansRef = useRef<HTMLDivElement | null>(null);

  const offerReopenPreview = useCallback(() => {
    setShowReopenPreviewPill(true);
    if (reopenPreviewTimeoutRef.current) {
      window.clearTimeout(reopenPreviewTimeoutRef.current);
    }
    reopenPreviewTimeoutRef.current = window.setTimeout(() => {
      setShowReopenPreviewPill(false);
      reopenPreviewTimeoutRef.current = null;
    }, 25000);
  }, []);

  const triggerCoachHint = useCallback((hint: Omit<CoachHintData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setCoachHint({ id, ...hint });
    if (coachTimeoutRef.current) {
      window.clearTimeout(coachTimeoutRef.current);
    }
    coachTimeoutRef.current = window.setTimeout(() => {
      setCoachHint(null);
      coachTimeoutRef.current = null;
    }, 5000);

    if (hint.allowReopenPreview) {
      offerReopenPreview();
    }
  }, [offerReopenPreview]);

  const coachHighlight = useCallback((target: CoachTarget) => {
    const active = !!coachHint && coachHint.tabId === activeTab && coachHint.target === target;
    return active
      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_0_4px_rgba(16,185,129,0.12)] animate-pulse'
      : '';
  }, [activeTab, coachHint]);

  // Scroll the exact focused UI section into view when a coach hint lands.
  useEffect(() => {
    if (!coachHint?.target) return;
    if (coachHint.tabId !== activeTab) return;

    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';
    const opts: ScrollIntoViewOptions = { behavior, block: 'center' };

    const getRef = (): React.RefObject<HTMLDivElement> | null => {
      switch (coachHint.target) {
        case 'monthly-actions':
          return coachMonthlyActionsRef;
        case 'lifestyle-grid':
          return coachLifestyleGridRef;
        case 'assets-sell':
          return coachAssetsSellRef;
        case 'sidehustles-list':
          return coachSideHustlesRef;
        case 'bank-loans':
          return coachBankLoansRef;
        case 'self-learn-tab':
          return null;
        default:
          return null;
      }
    };

    const r = getRef();
    if (r?.current) {
      try {
        r.current.scrollIntoView(opts);
      } catch (e) {
        console.debug('scrollIntoView failed:', e);
      }
    }
  }, [activeTab, coachHint?.id, coachHint?.tabId, coachHint?.target, reduceMotion]);

  useEffect(() => {
    if (!gameStarted || isMultiplayer) return;
    try {
      if (localStorage.getItem(SELF_LEARN_HINT_STORAGE_KEY) === '1') return;
      const hintTimer = window.setTimeout(() => {
        triggerCoachHint({
          tabId: activeTab ?? TABS.OVERVIEW,
          title: 'New Self Learn tab',
          message: 'Sales Certification, Upgrade EQ, and Master Negotiations now live under Self Learn.',
          target: 'self-learn-tab'
        });
        localStorage.setItem(SELF_LEARN_HINT_STORAGE_KEY, '1');
      }, 1200);
      return () => window.clearTimeout(hintTimer);
    } catch (e) {
      console.warn('Failed to show Self Learn hint:', e);
    }
  }, [activeTab, gameStarted, isMultiplayer, triggerCoachHint]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (coachTimeoutRef.current) window.clearTimeout(coachTimeoutRef.current);
      if (reopenPreviewTimeoutRef.current) window.clearTimeout(reopenPreviewTimeoutRef.current);
    };
  }, []);

  // If a preview is opened, hide the "Re-open Preview" pill.
  useEffect(() => {
    if (showTurnPreview) {
      setShowReopenPreviewPill(false);
    }
  }, [showTurnPreview]);

  return {
    coachHint,
    setCoachHint,
    triggerCoachHint,
    coachHighlight,
    showReopenPreviewPill,
    setShowReopenPreviewPill,
    coachMonthlyActionsRef,
    coachLifestyleGridRef,
    coachAssetsSellRef,
    coachSideHustlesRef,
    coachBankLoansRef
  };
};
