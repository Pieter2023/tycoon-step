// Daily Challenge: same world for everyone, every day.
//
// The challenge id is the UTC date (e.g. "2026-06-11"). A 32-bit seed is
// derived from it; the seed picks the day's character and drives the
// simulation RNG (see seedSimForMonth in gameLogic.ts) so market cycles and
// event draws unfold identically for every player making the same choices.
// Run length is fixed (120 months); score is final net worth.

import { GameState, Character } from '../types';
import {
  INITIAL_GAME_STATE,
  CHARACTERS,
  DIFFICULTY_SETTINGS,
  CAREER_PATHS,
  getInitialQuestState
} from '../constants';

export const DAILY_CHALLENGE_MONTHS = 120;
export const DAILY_CHALLENGE_DIFFICULTY = 'NORMAL' as const;

/** UTC date id so the whole world rolls over at the same moment. */
export const getDailyChallengeId = (date: Date = new Date()): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** FNV-1a 32-bit hash — stable across platforms. */
export const hashStringToSeed = (str: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Small, fast, deterministic PRNG. */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const getDailySeed = (challengeId: string = getDailyChallengeId()): number =>
  hashStringToSeed(`tycoon-daily-${challengeId}`);

// --- Daily streak (localStorage, device-local until accounts exist) ---

const STREAK_KEY = 'tycoon_daily_streak_v1';

export interface DailyStreak {
  /** Challenge id of the most recent day played. */
  lastPlayedId: string;
  /** Consecutive days played, ending at lastPlayedId. */
  streak: number;
  /** Longest streak ever recorded on this device. */
  best: number;
}

/** Challenge id of the UTC day before the given one. */
export const getPreviousChallengeId = (challengeId: string): string => {
  const [y, m, d] = challengeId.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d));
  prev.setUTCDate(prev.getUTCDate() - 1);
  return getDailyChallengeId(prev);
};

export const getDailyStreak = (): DailyStreak | null => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyStreak;
    if (typeof parsed?.lastPlayedId !== 'string' || typeof parsed?.streak !== 'number') return null;
    return { ...parsed, best: typeof parsed.best === 'number' ? parsed.best : parsed.streak };
  } catch {
    return null;
  }
};

/**
 * Records that today's challenge was started. Same-day repeats are no-ops;
 * playing the day after lastPlayedId extends the streak, anything else resets
 * it to 1. Returns the updated streak.
 */
export const recordDailyChallengePlayed = (
  challengeId: string = getDailyChallengeId()
): DailyStreak => {
  const current = getDailyStreak();
  let next: DailyStreak;
  if (current && current.lastPlayedId === challengeId) {
    next = current;
  } else if (current && current.lastPlayedId === getPreviousChallengeId(challengeId)) {
    const streak = current.streak + 1;
    next = { lastPlayedId: challengeId, streak, best: Math.max(current.best, streak) };
  } else {
    next = { lastPlayedId: challengeId, streak: 1, best: Math.max(current?.best ?? 0, 1) };
  }
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {
    // privacy-restricted browsers: streak just won't persist
  }
  return next;
};

/** The day's fixed character (custom avatars are not part of the challenge). */
export const getDailyCharacter = (seed: number): Character => {
  const rng = mulberry32(seed ^ 0xc04fee);
  return CHARACTERS[Math.floor(rng() * CHARACTERS.length)];
};

// Local copy of App.tsx's amortization helper (not exported there).
const calculateLoanPayment = (principal: number, annualRate: number, termMonths: number): number => {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return Math.round(principal / termMonths);
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment);
};

/**
 * Builds the initial GameState for today's challenge. Mirrors
 * handleSelectCharacter in App.tsx but fully deterministic (no Date.now ids).
 */
export const createDailyChallengeState = (date: Date = new Date()): GameState => {
  const id = getDailyChallengeId(date);
  const seed = getDailySeed(id);
  const char = getDailyCharacter(seed);
  const diff = DIFFICULTY_SETTINGS[DAILY_CHALLENGE_DIFFICULTY];

  let startingCash = diff.startingCash + (char.startingBonus.type === 'cash' ? char.startingBonus.amount : 0);
  const initialLiabilities: GameState['liabilities'] = [];

  if (char.startingBonus.amount < 0) {
    const debtAmount = Math.abs(char.startingBonus.amount);
    initialLiabilities.push({
      id: `student-loan-${id}`,
      name: 'Student Loans',
      balance: debtAmount,
      originalBalance: debtAmount,
      interestRate: 0.065,
      monthlyPayment: calculateLoanPayment(debtAmount, 0.065, 120),
      type: 'STUDENT_LOAN'
    });
    startingCash = diff.startingCash;
  }

  if ('startingDebt' in diff && (diff as { startingDebt?: number }).startingDebt) {
    const debtAmount = (diff as { startingDebt: number }).startingDebt;
    initialLiabilities.push({
      id: `personal-loan-${id}`,
      name: 'Personal Loan',
      balance: debtAmount,
      originalBalance: debtAmount,
      interestRate: 0.10,
      monthlyPayment: calculateLoanPayment(debtAmount, 0.10, 48),
      type: 'PERSONAL_LOAN'
    });
  }

  const career = CAREER_PATHS[char.careerPath];

  return {
    ...INITIAL_GAME_STATE,
    character: char,
    difficulty: DAILY_CHALLENGE_DIFFICULTY,
    cash: Math.max(0, startingCash),
    career: {
      path: char.careerPath,
      title: career.levels[0].title,
      salary: Math.round(career.levels[0].baseSalary * diff.salaryMultiplier),
      level: 1,
      experience: 0,
      skills: {},
      aiVulnerability: career.aiVulnerability,
      futureProofScore: career.futureProofScore
    },
    playerJob: {
      title: career.levels[0].title,
      salary: Math.round(career.levels[0].baseSalary * diff.salaryMultiplier),
      level: 1,
      experience: 0
    },
    liabilities: initialLiabilities,
    activeSideHustles: [],
    quests: getInitialQuestState(char.id),
    challenge: {
      id,
      seed,
      targetMonths: DAILY_CHALLENGE_MONTHS
    },
    challengeEvents: []
  };
};
