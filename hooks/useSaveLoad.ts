import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState } from '../types';
import {
  saveAdultGame,
  loadAdultGame,
  getSaveSummaries,
  getSaveSummary,
  deleteSaveSlot,
  renameSaveSlot,
  exportSaveSlot,
  importSavePayload,
  SaveSlotId,
  SaveSummary
} from '../services/storageService';
import { isCloudSyncEnabled, uploadCloudSave } from '../services/cloudSave';
import { calculateNetWorth } from '../services/gameLogic';
import { playClick, setMuted } from '../services/audioService';
import { useI18n } from '../i18n';

const SAVE_SLOTS: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];

interface SaveLoadDeps {
  isMultiplayer?: boolean;
  gameState: GameState;
  currentSaveSlot: SaveSlotId;
  setCurrentSaveSlot: Dispatch<SetStateAction<SaveSlotId>>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  setGameStarted: Dispatch<SetStateAction<boolean>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setMonthlyReport: Dispatch<SetStateAction<any>>;
  setShowCharacterSelect: Dispatch<SetStateAction<boolean>>;
  setSoundEnabled: Dispatch<SetStateAction<boolean>>;
  showNotif: (
    title: string,
    message: string,
    type?: string,
    opts?: { actionLabel?: string; onAction?: () => void; durationMs?: number }
  ) => void;
}

// Phase-3 state extraction: the save/load cluster from App.tsx — Save Manager
// modal state, slot summaries/labels, autosave bookkeeping (incl. throttled
// cloud upload), export/import, and every slot handler. The modal UI is
// components/modals/SaveManagerModal; cross-cutting state (currentSaveSlot,
// gameState, run lifecycle setters) stays in App and arrives via deps.
export const useSaveLoad = (deps: SaveLoadDeps) => {
  const {
    isMultiplayer,
    gameState,
    currentSaveSlot,
    setCurrentSaveSlot,
    setGameState,
    setGameStarted,
    setIsProcessing,
    setMonthlyReport,
    setShowCharacterSelect,
    setSoundEnabled,
    showNotif
  } = deps;
  const { t, locale } = useI18n();

  const [showSaveManager, setShowSaveManager] = useState(false);
  const [saveSummaries, setSaveSummaries] = useState<SaveSummary[]>([]);
  const [saveLabelDrafts, setSaveLabelDrafts] = useState<Record<SaveSlotId, string>>({
    autosave: '',
    slot1: '',
    slot2: '',
    slot3: ''
  });
  const [lastAutosaveAt, setLastAutosaveAt] = useState<number | null>(() => {
    if (isMultiplayer) return null;
    return getSaveSummary('adult', 'autosave')?.updatedAt ?? null;
  });
  const [autosaveNow, setAutosaveNow] = useState(() => Date.now());
  const [exportSlotId, setExportSlotId] = useState<SaveSlotId>('autosave');
  const [importSlotId, setImportSlotId] = useState<SaveSlotId>('autosave');
  const [importPayload, setImportPayload] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Throttle for cloud-save uploads (see recordAutosave)
  const lastCloudUploadRef = useRef(0);

  useEffect(() => {
    if (isMultiplayer) return;
    if (!lastAutosaveAt) return;
    const id = window.setInterval(() => setAutosaveNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, [isMultiplayer, lastAutosaveAt]);

  const recordAutosave = useCallback((state: GameState) => {
    if (isMultiplayer) return;
    // Daily challenge runs are ephemeral sprints — never clobber the player's
    // adult-mode autosave with them.
    if (state.challenge) return;
    saveAdultGame(state, 'autosave');
    const now = Date.now();
    setLastAutosaveAt(now);
    setAutosaveNow(now);

    // Cloud backup: fire-and-forget, throttled to once a minute.
    if (isCloudSyncEnabled() && now - lastCloudUploadRef.current > 60_000) {
      lastCloudUploadRef.current = now;
      uploadCloudSave(state, {
        name: state.character?.name,
        month: state.month,
        netWorth: calculateNetWorth(state)
      }).catch(() => undefined);
    }
  }, [isMultiplayer]);

  const relativeTimeFormatter = useMemo(() => {
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    } catch (e) {
      console.debug('RelativeTimeFormat failed:', e);
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    }
  }, [locale]);

  const formatRelativeTime = useCallback((diffMs: number) => {
    const seconds = Math.round(diffMs / 1000);
    if (seconds < 60) return relativeTimeFormatter.format(-seconds, 'second');
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return relativeTimeFormatter.format(-minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (hours < 24) return relativeTimeFormatter.format(-hours, 'hour');
    const days = Math.round(hours / 24);
    return relativeTimeFormatter.format(-days, 'day');
  }, [relativeTimeFormatter]);

  const autosaveStatus = useMemo(() => {
    if (isMultiplayer) return '';
    if (!lastAutosaveAt) return t('save.autosaveNever');
    const diffMs = Math.max(0, autosaveNow - lastAutosaveAt);
    if (diffMs < 45000) return t('save.autosaveJustNow');
    return t('save.autosaveLast', { time: formatRelativeTime(diffMs) });
  }, [autosaveNow, formatRelativeTime, isMultiplayer, lastAutosaveAt, t]);

  const refreshSaveSummaries = useCallback(() => {
    setSaveSummaries(getSaveSummaries('adult'));
  }, []);

  const openSaveManager = () => {
    playClick();
    const summaries = getSaveSummaries('adult');
    setSaveSummaries(summaries);
    setExportSlotId(currentSaveSlot);
    setImportSlotId(currentSaveSlot);
    setImportError(null);
    setSaveLabelDrafts(prev => {
      const drafts: Record<SaveSlotId, string> = { ...prev };
      SAVE_SLOTS.forEach(slotId => {
        if (slotId === 'autosave') return;
        const summary = summaries.find(s => s.slotId === slotId);
        drafts[slotId] = summary?.label ?? '';
      });
      return drafts;
    });
    setShowSaveManager(true);
  };

  const handleSaveToSlot = (slotId: SaveSlotId, label?: string) => {
    try {
      const trimmedLabelRaw = slotId === 'autosave' ? undefined : label?.trim();
      const trimmedLabel = trimmedLabelRaw && trimmedLabelRaw.length > 0 ? trimmedLabelRaw : undefined;
      saveAdultGame(gameState, slotId, trimmedLabel);
      setCurrentSaveSlot(slotId);
      if (slotId === 'autosave') {
        const now = Date.now();
        setLastAutosaveAt(now);
        setAutosaveNow(now);
      } else if (typeof trimmedLabel === 'string') {
        setSaveLabelDrafts(prev => ({ ...prev, [slotId]: trimmedLabel }));
      }
      refreshSaveSummaries();
      showNotif(t('save.savedTitle'), t('save.savedBody', { slot: slotId === 'autosave' ? t('save.slot.autosave') : slotId }), 'success');
    } catch (e) {
      console.error('Failed to save game:', e);
      showNotif(t('save.failedTitle'), t('save.failedBody'), 'error');
    }
  };

  const handleLoadFromSlot = (slotId: SaveSlotId) => {
    const loaded = loadAdultGame(slotId);
    if (!loaded) {
      showNotif(t('save.notFoundTitle'), t('save.notFoundBody', { slot: slotId }), 'warning');
      return;
    }

    setIsProcessing(false);
    setMonthlyReport(null);
    setGameState(loaded);
    setCurrentSaveSlot(slotId);
    setGameStarted(true);
    setShowCharacterSelect(false);

    const se = loaded.soundEnabled ?? true;
    setSoundEnabled(se);
    setMuted(!se);

    const autosaveSummary = getSaveSummary('adult', 'autosave');
    if (autosaveSummary?.updatedAt) {
      setLastAutosaveAt(autosaveSummary.updatedAt);
      setAutosaveNow(Date.now());
    } else {
      setLastAutosaveAt(null);
    }

    setShowSaveManager(false);
    showNotif(t('save.loadedTitle'), t('save.loadedBody', { slot: slotId === 'autosave' ? t('save.slot.autosave') : slotId }), 'success');
  };

  const handleDeleteSlot = (slotId: SaveSlotId) => {
    deleteSaveSlot('adult', slotId);
    refreshSaveSummaries();
    showNotif(t('save.deletedTitle'), t('save.deletedBody', { slot: slotId === 'autosave' ? t('save.slot.autosave') : slotId }), 'info');
  };

  const handleRenameSlot = (slotId: SaveSlotId, label: string) => {
    const nextLabel = label.trim();
    renameSaveSlot('adult', slotId, nextLabel);
    setSaveLabelDrafts(prev => ({ ...prev, [slotId]: nextLabel }));
    refreshSaveSummaries();
    showNotif(t('save.renamedTitle'), t('save.renamedBody', { slot: slotId }), 'success');
  };

  const handleExportSlot = async (slotId: SaveSlotId, mode: 'copy' | 'download') => {
    const payload = exportSaveSlot('adult', slotId);
    if (!payload) {
      showNotif(t('save.exportMissingTitle'), t('save.exportMissingBody'), 'warning');
      return;
    }

    const json = JSON.stringify(payload, null, 2);

    if (mode === 'copy') {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error('Clipboard unavailable');
        }
        await navigator.clipboard.writeText(json);
        showNotif(t('save.exportCopiedTitle'), t('save.exportCopiedBody'), 'success');
      } catch (e) {
        console.warn('Clipboard write failed:', e);
        showNotif(t('save.exportCopyFailedTitle'), t('save.exportCopyFailedBody'), 'error');
      }
      return;
    }

    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tycoon-${slotId}-save.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotif(t('save.exportDownloadedTitle'), t('save.exportDownloadedBody'), 'success');
    } catch (e) {
      console.warn('Download failed:', e);
      showNotif(t('save.exportDownloadFailedTitle'), t('save.exportDownloadFailedBody'), 'error');
    }
  };

  const handleImportSave = () => {
    setImportError(null);
    let parsed: unknown;

    try {
      const trimmed = importPayload.trim();
      if (!trimmed) {
        setImportError(t('save.importInvalid'));
        return;
      }
      parsed = JSON.parse(trimmed);
    } catch (e) {
      setImportError(t('save.importInvalid'));
      return;
    }

    const summary = importSavePayload(parsed, 'adult', importSlotId, saveLabelDrafts[importSlotId]);
    if (!summary) {
      setImportError(t('save.importFailed'));
      return;
    }

    refreshSaveSummaries();
    setImportPayload('');
    showNotif(t('save.importSuccessTitle'), t('save.importSuccessBody', { slot: importSlotId }), 'success');
    handleLoadFromSlot(importSlotId);
  };

  return {
    saveSlots: SAVE_SLOTS,
    showSaveManager,
    setShowSaveManager,
    saveSummaries,
    saveLabelDrafts,
    setSaveLabelDrafts,
    exportSlotId,
    setExportSlotId,
    importSlotId,
    setImportSlotId,
    importPayload,
    setImportPayload,
    importError,
    autosaveStatus,
    recordAutosave,
    refreshSaveSummaries,
    openSaveManager,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleDeleteSlot,
    handleRenameSlot,
    handleExportSlot,
    handleImportSave
  };
};
