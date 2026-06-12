import { useCallback, useEffect, useState } from 'react';
import { GameState } from '../types';
import { SaveSlotId } from '../services/storageService';
import { useI18n } from '../i18n';

const AUTOPLAY_PREF_PREFIX = 'tycoon_autoplay_pref_v1_';

export const AUTOPLAY_SPEED_OPTIONS = [1000, 500, 250];
export const AUTOPLAY_SPEED_LABELS: Record<number, string> = {
  1000: '1x',
  500: '2x',
  250: '4x'
};

const readAutoplayPreference = (slotId: SaveSlotId): number | null => {
  try {
    const raw = localStorage.getItem(`${AUTOPLAY_PREF_PREFIX}${slotId}`);
    if (!raw || raw === 'off') return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return AUTOPLAY_SPEED_OPTIONS.includes(parsed) ? parsed : AUTOPLAY_SPEED_OPTIONS[0];
  } catch (e) {
    console.warn('Failed to read autoplay preference:', e);
    return null;
  }
};

interface AutoplayDeps {
  initialSaveSlot: SaveSlotId;
  currentSaveSlot: SaveSlotId;
  gameState: GameState;
}

// Phase-3 slice 2: the autoplay cluster from App.tsx — speed state, per-slot
// preference persistence, the year-in-review pause, derived labels/tooltip,
// and the toggle. The timer itself is useAutoplayScheduler below (separate
// call site: it needs advanceMonth and the blocked flag, which App declares
// long after this hook must run). isAutoplayBlocked stays in App — it ORs
// ~16 cross-cutting modal/game flags owned by other clusters.
export const useAutoplay = (deps: AutoplayDeps) => {
  const { initialSaveSlot, currentSaveSlot, gameState } = deps;
  const { t } = useI18n();

  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number | null>(() => readAutoplayPreference(initialSaveSlot));

  // Pause autoplay while the year-in-review modal is up so it can be read.
  useEffect(() => {
    if (gameState.annualReport && !gameState.challenge) setAutoPlaySpeed(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.annualReport]);

  // Effect order is load-bearing on slot switches: persist fires first
  // (carries the current speed into the new slot's key), then the reload
  // below reads it back.
  useEffect(() => {
    try {
      localStorage.setItem(`${AUTOPLAY_PREF_PREFIX}${currentSaveSlot}`, autoPlaySpeed ? String(autoPlaySpeed) : 'off');
    } catch (e) {
      console.warn('Failed to save autoplay preference:', e);
    }
  }, [autoPlaySpeed, currentSaveSlot]);

  useEffect(() => {
    setAutoPlaySpeed(readAutoplayPreference(currentSaveSlot));
  }, [currentSaveSlot]);

  const toggleAutoplay = useCallback(() => {
    setAutoPlaySpeed((prev) => (prev ? null : AUTOPLAY_SPEED_OPTIONS[0]));
  }, []);

  const autoplayEnabled = autoPlaySpeed !== null;
  const autoplaySpeedLabel = autoPlaySpeed ? (AUTOPLAY_SPEED_LABELS[autoPlaySpeed] || '1x') : '1x';
  const autoplayTooltip = autoplayEnabled
    ? t('autoplay.tooltipOn', { speed: autoplaySpeedLabel })
    : t('autoplay.tooltipOff');

  return {
    autoPlaySpeed,
    setAutoPlaySpeed,
    toggleAutoplay,
    autoplayEnabled,
    autoplaySpeedLabel,
    autoplayTooltip
  };
};

interface AutoplaySchedulerArgs {
  speed: number | null;
  blocked: boolean;
  month: number;
  onAdvance: () => void;
}

// The autoplay timer. Pauses itself (without disabling) while blocking UI is
// open; `month` is a deliberate dep so the timer re-arms after each tick.
export const useAutoplayScheduler = ({ speed, blocked, month, onAdvance }: AutoplaySchedulerArgs) => {
  useEffect(() => {
    if (speed === null || blocked) return;
    const timer = setTimeout(onAdvance, speed);
    return () => clearTimeout(timer);
  }, [speed, blocked, month, onAdvance]);
};
