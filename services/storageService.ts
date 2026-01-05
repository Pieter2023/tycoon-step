import { GameState, PrestigeData } from '../types';
import { KidsGameState } from '../kidsTypes';
import { calculateMonthlyCashFlowEstimate, calculateNetWorth, calculateMonthlyActionsMax } from './gameLogic';
import { CHARACTERS, getInitialQuestState, SIDE_HUSTLES } from '../constants';

const normalizeAdultState = (state: GameState): GameState => {
  // Add defaults for newer fields so older saves keep working.
  const inferredMax = calculateMonthlyActionsMax(state);
  const monthlyActionsMax = typeof (state as any).monthlyActionsMax === 'number' ? (state as any).monthlyActionsMax : inferredMax;
  const monthlyActionsRemaining = typeof (state as any).monthlyActionsRemaining === 'number'
    ? (state as any).monthlyActionsRemaining
    : monthlyActionsMax;

  // Goals / quests (Step 5+)
  const rawQuests = (state as any).quests;
  const quests = {
    active: (Array.isArray(rawQuests?.active) ? rawQuests.active.filter((id: any) => typeof id === 'string') : [...getInitialQuestState(state.character?.id).active]).slice(0, 3),
    readyToClaim: Array.isArray(rawQuests?.readyToClaim) ? rawQuests.readyToClaim.filter((id: any) => typeof id === 'string') : [],
    completed: Array.isArray(rawQuests?.completed) ? rawQuests.completed.filter((id: any) => typeof id === 'string') : [],
    track: typeof rawQuests?.track === 'string' ? rawQuests.track : undefined
  };

  // Upgrade EQ defaults
  const rawEqCourse = (state as any).eqCourse;
  const eqCourse = {
    failedAttempts: typeof rawEqCourse?.failedAttempts === 'number' ? rawEqCourse.failedAttempts : 0,
    bestScore: typeof rawEqCourse?.bestScore === 'number' ? rawEqCourse.bestScore : 0,
    certified: typeof rawEqCourse?.certified === 'boolean' ? rawEqCourse.certified : false,
    rewardClaimed: typeof rawEqCourse?.rewardClaimed === 'boolean' ? rawEqCourse.rewardClaimed : false,
  };

  const rawEqPerks = (state as any).eqPerks;
  const eqPerks = {
    careerXpMultiplier: typeof rawEqPerks?.careerXpMultiplier === 'number' ? rawEqPerks.careerXpMultiplier : 1,
    careerXpCarry: typeof rawEqPerks?.careerXpCarry === 'number' ? rawEqPerks.careerXpCarry : 0,
  };

  // Master Negotiations defaults
  const rawNegotiationsCourse = (state as any).negotiationsCourse;
  const negotiationsCourse = {
    failedAttempts: typeof rawNegotiationsCourse?.failedAttempts === 'number' ? rawNegotiationsCourse.failedAttempts : 0,
    bestScore: typeof rawNegotiationsCourse?.bestScore === 'number' ? rawNegotiationsCourse.bestScore : 0,
    certified: typeof rawNegotiationsCourse?.certified === 'boolean' ? rawNegotiationsCourse.certified : false,
    rewardClaimed: typeof rawNegotiationsCourse?.rewardClaimed === 'boolean' ? rawNegotiationsCourse.rewardClaimed : false,
  };

  const rawNegotiationsPerks = (state as any).negotiationsPerks;
  const negotiationsPerks = {
    dealDiscountPct: typeof rawNegotiationsPerks?.dealDiscountPct === 'number' ? rawNegotiationsPerks.dealDiscountPct : 0,
    saleBonusPct: typeof rawNegotiationsPerks?.saleBonusPct === 'number' ? rawNegotiationsPerks.saleBonusPct : 0,
  };

  const rawSalesCourse = (state as any).salesAcceleratorCourse;
  const salesAcceleratorCourse = {
    failedAttempts: typeof rawSalesCourse?.failedAttempts === 'number' ? rawSalesCourse.failedAttempts : 0,
    bestScore: typeof rawSalesCourse?.bestScore === 'number' ? rawSalesCourse.bestScore : 0,
    certified: typeof rawSalesCourse?.certified === 'boolean' ? rawSalesCourse.certified : false,
    rewardClaimed: typeof rawSalesCourse?.rewardClaimed === 'boolean' ? rawSalesCourse.rewardClaimed : false,
  };

  const rawCompoundCourse = (state as any).compoundInterestCourse;
  const compoundInterestCourse = {
    failedAttempts: typeof rawCompoundCourse?.failedAttempts === 'number' ? rawCompoundCourse.failedAttempts : 0,
    bestScore: typeof rawCompoundCourse?.bestScore === 'number' ? rawCompoundCourse.bestScore : 0,
    certified: typeof rawCompoundCourse?.certified === 'boolean' ? rawCompoundCourse.certified : false,
    rewardClaimed: typeof rawCompoundCourse?.rewardClaimed === 'boolean' ? rawCompoundCourse.rewardClaimed : false,
  };

  const hustleLookup = new Map(SIDE_HUSTLES.map(hustle => [hustle.id, hustle]));
  const activeSideHustles = (state.activeSideHustles || []).map(hustle => {
    const base = hustleLookup.get(hustle.id);
    return {
      ...(base || hustle),
      ...hustle,
      monthsActive: typeof (hustle as any).monthsActive === 'number' ? (hustle as any).monthsActive : 0,
      upgrades: Array.isArray((hustle as any).upgrades) ? (hustle as any).upgrades.filter((u: any) => typeof u === 'string') : []
    };
  });

  const creditRating = typeof (state as any).creditRating === 'number' ? (state as any).creditRating : 650;
  const creditHistoryRaw = (state as any).creditHistory;
  const creditHistory = Array.isArray(creditHistoryRaw) && creditHistoryRaw.length > 0
    ? creditHistoryRaw.filter((entry: any) => entry && typeof entry.score === 'number')
    : [{ month: typeof (state as any).month === 'number' ? (state as any).month : 1, score: creditRating, reasons: ['Starting credit profile'] }];

  const rawEventTracker = (state as any).eventTracker || {};
  const eventTracker = {
    taxesPaidThisYear: !!rawEventTracker.taxesPaidThisYear,
    lastTaxMonth: typeof rawEventTracker.lastTaxMonth === 'number' ? rawEventTracker.lastTaxMonth : 0,
    occurrences: typeof rawEventTracker.occurrences === 'object' && rawEventTracker.occurrences ? rawEventTracker.occurrences : {},
    lastOccurrence: typeof rawEventTracker.lastOccurrence === 'object' && rawEventTracker.lastOccurrence ? rawEventTracker.lastOccurrence : {},
    lastEventMonth: typeof rawEventTracker.lastEventMonth === 'number' ? rawEventTracker.lastEventMonth : 0,
    recentEventIds: Array.isArray(rawEventTracker.recentEventIds) ? rawEventTracker.recentEventIds.filter((id: any) => typeof id === 'string') : []
  };

  const eventQueue = Array.isArray((state as any).eventQueue)
    ? (state as any).eventQueue.filter((entry: any) => entry && typeof entry.id === 'string')
    : [];

  const resolvedCharacter = state.character
    ? (CHARACTERS.find(c => c.id === state.character?.id) || state.character)
    : null;

  const character = resolvedCharacter
    ? { ...resolvedCharacter, ...state.character, perk: resolvedCharacter.perk }
    : null;

  return {
    ...state,
    character,
    monthlyActionsMax,
    monthlyActionsRemaining,
    tempSalaryBonus: typeof (state as any).tempSalaryBonus === 'number' ? (state as any).tempSalaryBonus : 0,
    tempSideHustleMultiplier: typeof (state as any).tempSideHustleMultiplier === 'number' ? (state as any).tempSideHustleMultiplier : 1,
    quests,
    eqCourse,
    eqPerks,
    negotiationsCourse,
    negotiationsPerks,
    salesAcceleratorCourse,
    compoundInterestCourse,
    activeSideHustles,
    pendingSideHustleUpgrade: (state as any).pendingSideHustleUpgrade ?? null,
    creditRating,
    creditHistory,
    creditLastChangeReasons: Array.isArray((state as any).creditLastChangeReasons)
      ? (state as any).creditLastChangeReasons
      : (creditHistory[creditHistory.length - 1]?.reasons || []),
    eventTracker,
    eventQueue
  };
};

// ============================================
// SAVE / LOAD (Single Player)
//
// v2 save schema supports:
// - Adult + Kids modes
// - 1 autosave + 3 manual slots
// - Lightweight summaries for menu + slot UI
// ============================================

export type SaveMode = 'adult' | 'kids';
export type SaveSlotId = 'autosave' | 'slot1' | 'slot2' | 'slot3';

export interface SaveSummary {
  mode: SaveMode;
  slotId: SaveSlotId;
  updatedAt: number;
  label?: string;

  // Adult metrics
  month?: number;
  year?: number;
  cash?: number;
  netWorth?: number;
  passiveIncome?: number;
  expenses?: number;
  difficulty?: string;

  // Kids metrics
  week?: number;
  cashOnHand?: number;
  totalEarned?: number;
  totalSaved?: number;
  savingsGoalName?: string;
  savingsGoalTarget?: number;
  savingsGoalCompleted?: boolean;
}

interface SaveEntry {
  schema: number;
  gameVersion?: string;
  summary: SaveSummary;
  state: unknown;
}

type SaveDB = Record<string, SaveEntry>;

export interface SaveExportPayload {
  formatVersion: number;
  exportedAt: number;
  mode: SaveMode;
  slotId: SaveSlotId;
  entry: SaveEntry;
}

const SAVE_DB_KEY = 'tycoon_saves_v2';
const LEGACY_ADULT_KEY = 'tycoon_save';
const SAVE_SCHEMA_VERSION = 3;
const SAVE_EXPORT_VERSION = 1;

const PRESTIGE_KEY = 'tycoon_prestige';

const slotOrder: SaveSlotId[] = ['autosave', 'slot1', 'slot2', 'slot3'];

const makeKey = (mode: SaveMode, slotId: SaveSlotId) => `${mode}:${slotId}`;

const safeParse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const migrateSaveEntry = (entry: SaveEntry): SaveEntry => {
  const schema = typeof entry.schema === 'number' ? entry.schema : 1;
  if (schema >= SAVE_SCHEMA_VERSION) return entry;

  let nextEntry = { ...entry };
  if (schema < 3) {
    const summary = entry.summary;
    const slotId = summary.slotId;
    const label = summary.label ?? (slotId === 'autosave' ? 'Autosave' : `Save ${slotId.replace('slot', '')}`);
    if (summary.mode === 'adult') {
      const normalized = normalizeAdultState(entry.state as GameState);
      nextEntry = {
        ...nextEntry,
        state: normalized,
        summary: buildAdultSummary(normalized, slotId, label, summary.updatedAt),
      };
    }
    nextEntry.schema = SAVE_SCHEMA_VERSION;
  }

  return nextEntry;
};

const readDBRaw = (): SaveDB => {
  try {
    const raw = localStorage.getItem(SAVE_DB_KEY);
    const parsed = safeParse<SaveDB>(raw);
    return parsed || {};
  } catch {
    return {};
  }
};

const readDB = (): SaveDB => {
  const db = readDBRaw();
  let changed = false;
  const migrated: SaveDB = {};

  Object.entries(db).forEach(([key, entry]) => {
    const nextEntry = migrateSaveEntry(entry);
    migrated[key] = nextEntry;
    if (nextEntry !== entry || nextEntry.schema !== entry.schema) {
      changed = true;
    }
  });

  if (changed) {
    writeDB(migrated);
  }

  return migrated;
};

const writeDB = (db: SaveDB) => {
  try {
    localStorage.setItem(SAVE_DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to write save database', e);
  }
};

const migrateLegacyAdultSaveIfNeeded = () => {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_ADULT_KEY);
    if (!legacyRaw) return;

    const legacyStateRaw = safeParse<GameState>(legacyRaw);
    const legacyState = legacyStateRaw ? normalizeAdultState(legacyStateRaw) : null;
    if (!legacyState) {
      // If it cannot parse, just remove to prevent repeated attempts
      localStorage.removeItem(LEGACY_ADULT_KEY);
      return;
    }

    const db = readDB();
    const key = makeKey('adult', 'autosave');

    // Only migrate if autosave doesn't already exist
    if (!db[key]) {
      db[key] = {
        schema: SAVE_SCHEMA_VERSION,
        gameVersion: '3.4.3',
        summary: buildAdultSummary(legacyState, 'autosave', 'Autosave', Date.now()),
        state: legacyState,
      };
      writeDB(db);
    }

    localStorage.removeItem(LEGACY_ADULT_KEY);
  } catch (e) {
    console.error('Failed to migrate legacy save', e);
  }
};

const buildAdultSummary = (
  state: GameState,
  slotId: SaveSlotId,
  label: string | undefined,
  updatedAt: number
): SaveSummary => {
  const cashFlow = calculateMonthlyCashFlowEstimate(state);
  const netWorth = calculateNetWorth(state);

  return {
    mode: 'adult',
    slotId,
    updatedAt,
    label,
    month: state.month,
    year: state.year,
    cash: state.cash,
    netWorth,
    passiveIncome: cashFlow.passive,
    expenses: cashFlow.expenses,
    difficulty: state.difficulty,
  };
};

const buildKidsSummary = (
  state: KidsGameState,
  slotId: SaveSlotId,
  label: string | undefined,
  updatedAt: number
): SaveSummary => {
  return {
    mode: 'kids',
    slotId,
    updatedAt,
    label,
    week: state.week,
    cashOnHand: state.cash,
    totalEarned: state.totalEarned,
    totalSaved: state.totalSaved,
    savingsGoalName: state.savingsGoal?.name,
    savingsGoalTarget: state.savingsGoal?.targetAmount,
    savingsGoalCompleted: state.savingsGoal?.completed,
  };
};

// ============================================
// Public API
// ============================================

export const saveAdultGame = (state: GameState, slotId: SaveSlotId = 'autosave', label?: string): void => {
  migrateLegacyAdultSaveIfNeeded();

  try {
    const db = readDB();
    const key = makeKey('adult', slotId);
    const updatedAt = Date.now();

    const existingLabel = db[key]?.summary?.label;
    const finalLabel = slotId === 'autosave' ? 'Autosave' : (label ?? existingLabel ?? `Save ${slotId.replace('slot', '')}`);

    db[key] = {
      schema: SAVE_SCHEMA_VERSION,
      gameVersion: '3.4.3',
      summary: buildAdultSummary(state, slotId, finalLabel, updatedAt),
      state,
    };

    writeDB(db);
  } catch (e) {
    console.error('Failed to save adult game', e);
  }
};

export const loadAdultGame = (slotId: SaveSlotId = 'autosave'): GameState | null => {
  migrateLegacyAdultSaveIfNeeded();

  try {
    const db = readDB();
    const key = makeKey('adult', slotId);
    const entry = db[key];
    if (!entry) return null;
    return normalizeAdultState(entry.state as GameState);
  } catch (e) {
    console.error('Failed to load adult game', e);
    return null;
  }
};

export const saveKidsGame = (state: KidsGameState, slotId: SaveSlotId = 'autosave', label?: string): void => {
  try {
    const db = readDB();
    const key = makeKey('kids', slotId);
    const updatedAt = Date.now();

    const existingLabel = db[key]?.summary?.label;
    const finalLabel = slotId === 'autosave' ? 'Autosave' : (label ?? existingLabel ?? `Save ${slotId.replace('slot', '')}`);

    db[key] = {
      schema: SAVE_SCHEMA_VERSION,
      gameVersion: '3.4.3',
      summary: buildKidsSummary(state, slotId, finalLabel, updatedAt),
      state,
    };

    writeDB(db);
  } catch (e) {
    console.error('Failed to save kids game', e);
  }
};

export const loadKidsGame = (slotId: SaveSlotId = 'autosave'): KidsGameState | null => {
  try {
    const db = readDB();
    const key = makeKey('kids', slotId);
    const entry = db[key];
    if (!entry) return null;
    return entry.state as KidsGameState;
  } catch (e) {
    console.error('Failed to load kids game', e);
    return null;
  }
};

export const deleteSaveSlot = (mode: SaveMode, slotId: SaveSlotId): void => {
  try {
    const db = readDB();
    const key = makeKey(mode, slotId);
    if (db[key]) {
      delete db[key];
      writeDB(db);
    }
  } catch (e) {
    console.error('Failed to delete save slot', e);
  }
};

export const renameSaveSlot = (mode: SaveMode, slotId: SaveSlotId, newLabel: string): void => {
  try {
    const db = readDB();
    const key = makeKey(mode, slotId);
    const entry = db[key];
    if (!entry) return;

    entry.summary = { ...entry.summary, label: newLabel };
    db[key] = entry;
    writeDB(db);
  } catch (e) {
    console.error('Failed to rename save slot', e);
  }
};

export const getSaveSummaries = (mode?: SaveMode): SaveSummary[] => {
  migrateLegacyAdultSaveIfNeeded();

  const db = readDB();
  const entries = Object.values(db)
    .map(e => e.summary)
    .filter(s => (mode ? s.mode === mode : true));

  // Provide a stable ordering for UI: mode then slot order, but keep updatedAt for easy "Continue".
  return entries.sort((a, b) => {
    if (a.mode !== b.mode) return a.mode.localeCompare(b.mode);
    return slotOrder.indexOf(a.slotId) - slotOrder.indexOf(b.slotId);
  });
};

export const getSaveSummary = (mode: SaveMode, slotId: SaveSlotId): SaveSummary | null => {
  migrateLegacyAdultSaveIfNeeded();

  try {
    const db = readDB();
    const entry = db[makeKey(mode, slotId)];
    return entry?.summary || null;
  } catch {
    return null;
  }
};

export const getMostRecentSave = (mode?: SaveMode): SaveSummary | null => {
  const all = getSaveSummaries(mode);
  if (all.length === 0) return null;
  return all.reduce((latest, s) => (s.updatedAt > latest.updatedAt ? s : latest), all[0]);
};

export const hasAnySaves = (mode?: SaveMode): boolean => {
  return getSaveSummaries(mode).length > 0;
};

export const exportSaveSlot = (mode: SaveMode, slotId: SaveSlotId): SaveExportPayload | null => {
  const db = readDB();
  const entry = db[makeKey(mode, slotId)];
  if (!entry) return null;

  const migrated = migrateSaveEntry(entry);
  return {
    formatVersion: SAVE_EXPORT_VERSION,
    exportedAt: Date.now(),
    mode,
    slotId,
    entry: migrated,
  };
};

export const importSavePayload = (
  payload: unknown,
  mode: SaveMode,
  slotId: SaveSlotId,
  label?: string
): SaveSummary | null => {
  if (!payload || typeof payload !== 'object') return null;
  const parsed = payload as any;
  const updatedAt = Date.now();

  let state: GameState | KidsGameState | null = null;
  let gameVersion: string | undefined;

  if (parsed.entry && parsed.entry.state) {
    gameVersion = parsed.entry.gameVersion;
    state = parsed.entry.state as GameState | KidsGameState;
  } else if (parsed.state) {
    gameVersion = parsed.gameVersion;
    state = parsed.state as GameState | KidsGameState;
  } else {
    state = parsed as GameState | KidsGameState;
  }

  if (!state) return null;

  const db = readDB();
  const key = makeKey(mode, slotId);
  const finalLabel = slotId === 'autosave' ? 'Autosave' : (label ?? db[key]?.summary?.label ?? `Save ${slotId.replace('slot', '')}`);

  if (mode === 'adult') {
    const normalized = normalizeAdultState(state as GameState);
    db[key] = {
      schema: SAVE_SCHEMA_VERSION,
      gameVersion: gameVersion ?? '3.4.3',
      summary: buildAdultSummary(normalized, slotId, finalLabel, updatedAt),
      state: normalized,
    };
  } else {
    db[key] = {
      schema: SAVE_SCHEMA_VERSION,
      gameVersion: gameVersion ?? '3.4.3',
      summary: buildKidsSummary(state as KidsGameState, slotId, finalLabel, updatedAt),
      state,
    };
  }

  writeDB(db);
  return db[key].summary;
};

// ============================================
// Backward-compatible wrappers (legacy API)
// ============================================
export const saveGame = (state: GameState): void => saveAdultGame(state, 'autosave');
export const loadGame = (): GameState | null => loadAdultGame('autosave');
export const deleteSave = (): void => deleteSaveSlot('adult', 'autosave');

// ============================================
// Prestige
// ============================================
export const savePrestige = (prestige: PrestigeData): void => {
  try {
    localStorage.setItem(PRESTIGE_KEY, JSON.stringify(prestige));
  } catch (e) {
    console.error('Failed to save prestige', e);
  }
};

export const loadPrestige = (): PrestigeData | null => {
  try {
    const data = localStorage.getItem(PRESTIGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load prestige', e);
    return null;
  }
};
