import { describe, it, expect, beforeEach } from 'vitest';
import {
  DAILY_CHALLENGE_MONTHS,
  createDailyChallengeState,
  getDailyChallengeId,
  getDailyCharacter,
  getDailySeed,
  getDailyStreak,
  getPreviousChallengeId,
  hashStringToSeed,
  mulberry32,
  recordDailyChallengePlayed
} from './dailyChallenge';
import { calculateNetWorth, processTurn } from './gameLogic';
import { GameState } from '../types';
import { CHARACTERS } from '../constants';

describe('daily challenge seed derivation', () => {
  it('uses the UTC date as the challenge id', () => {
    // 23:30 in UTC-8 is already the next day in UTC
    const d = new Date(Date.UTC(2026, 5, 11, 7, 30)); // 2026-06-11 07:30 UTC
    expect(getDailyChallengeId(d)).toBe('2026-06-11');
  });

  it('derives a stable seed from the id', () => {
    expect(getDailySeed('2026-06-11')).toBe(getDailySeed('2026-06-11'));
    expect(getDailySeed('2026-06-11')).not.toBe(getDailySeed('2026-06-12'));
  });

  it('hashStringToSeed is deterministic and 32-bit', () => {
    const h = hashStringToSeed('tycoon');
    expect(h).toBe(hashStringToSeed('tycoon'));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('mulberry32 streams are reproducible', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
    seqA.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  it('picks a valid character for the day', () => {
    const char = getDailyCharacter(getDailySeed('2026-06-11'));
    expect(CHARACTERS.map(c => c.id)).toContain(char.id);
    // Same day, same character
    expect(getDailyCharacter(getDailySeed('2026-06-11')).id).toBe(char.id);
  });
});

describe('daily challenge state', () => {
  it('builds a playable initial state with challenge metadata', () => {
    const d = new Date(Date.UTC(2026, 5, 11));
    const state = createDailyChallengeState(d);
    expect(state.challenge).toBeDefined();
    expect(state.challenge!.id).toBe('2026-06-11');
    expect(state.challenge!.targetMonths).toBe(DAILY_CHALLENGE_MONTHS);
    expect(state.character).toBeDefined();
    expect(state.career).toBeDefined();
    expect(state.cash).toBeGreaterThanOrEqual(0);
    expect(state.month).toBe(1);
  });

  it('is identical for two players starting the same day', () => {
    const d = new Date(Date.UTC(2026, 5, 11, 3));
    const a = createDailyChallengeState(d);
    const b = createDailyChallengeState(new Date(Date.UTC(2026, 5, 11, 22)));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('differs between days', () => {
    const a = createDailyChallengeState(new Date(Date.UTC(2026, 5, 11)));
    const b = createDailyChallengeState(new Date(Date.UTC(2026, 5, 12)));
    expect(a.challenge!.seed).not.toBe(b.challenge!.seed);
  });
});

describe('deterministic simulation', () => {
  const runMonths = (state: GameState, months: number): GameState => {
    let s = state;
    for (let i = 0; i < months; i++) {
      const { newState } = processTurn(s);
      // Auto-resolve pending scenarios deterministically (always first option)
      // so the run can continue; we only compare world-level outcomes here.
      s = { ...newState, pendingScenario: null };
    }
    return s;
  };

  it('two identical challenge runs produce identical worlds', () => {
    const d = new Date(Date.UTC(2026, 5, 11));
    const a = runMonths(createDailyChallengeState(d), 24);
    const b = runMonths(createDailyChallengeState(d), 24);

    expect(a.cash).toBe(b.cash);
    expect(a.marketCycle?.phase).toBe(b.marketCycle?.phase);
    expect(a.economy?.interestRate).toBe(b.economy?.interestRate);
    expect(JSON.stringify(a.netWorthHistory)).toBe(JSON.stringify(b.netWorthHistory));
    expect(JSON.stringify(a.challengeEvents)).toBe(JSON.stringify(b.challengeEvents));
  });

  it('non-challenge runs are unaffected by the seeded RNG (still random)', () => {
    // Run a challenge turn first so the module RNG was seeded once,
    // then verify a normal game clears the seed and still works.
    const challenge = createDailyChallengeState(new Date(Date.UTC(2026, 5, 11)));
    processTurn(challenge);

    const base = createDailyChallengeState(new Date(Date.UTC(2026, 5, 11)));
    const normal: GameState = { ...base, challenge: undefined, challengeEvents: undefined };
    const { newState } = processTurn(normal);
    expect(newState.month).toBe(2);
    expect(newState.challengeEvents ?? undefined).toBeUndefined();
  });

  it('challenge keeps full net worth history (not capped at 60)', () => {
    const d = new Date(Date.UTC(2026, 5, 11));
    const final = runMonths(createDailyChallengeState(d), 70);
    expect(final.netWorthHistory.length).toBe(70);
  });

  it('survives a full 120-month run and stays deterministic to the end', () => {
    // Headless playtest of the entire sprint: the run must not throw,
    // must reach the end month, and two hands-off players must finish
    // with the exact same world and score.
    const d = new Date(Date.UTC(2026, 5, 11));
    const a = runMonths(createDailyChallengeState(d), DAILY_CHALLENGE_MONTHS);
    const b = runMonths(createDailyChallengeState(d), DAILY_CHALLENGE_MONTHS);

    expect(a.month).toBe(DAILY_CHALLENGE_MONTHS + 1); // past target → end overlay fires
    expect(a.netWorthHistory.length).toBe(DAILY_CHALLENGE_MONTHS);
    expect(Number.isFinite(calculateNetWorth(a))).toBe(true);
    expect(calculateNetWorth(a)).toBe(calculateNetWorth(b));
    expect(a.cash).toBe(b.cash);
    expect(JSON.stringify(a.netWorthHistory)).toBe(JSON.stringify(b.netWorthHistory));
    expect(JSON.stringify(a.challengeEvents)).toBe(JSON.stringify(b.challengeEvents));
  });
});

describe('daily streak', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getPreviousChallengeId handles month and year boundaries', () => {
    expect(getPreviousChallengeId('2026-06-11')).toBe('2026-06-10');
    expect(getPreviousChallengeId('2026-06-01')).toBe('2026-05-31');
    expect(getPreviousChallengeId('2026-01-01')).toBe('2025-12-31');
    expect(getPreviousChallengeId('2024-03-01')).toBe('2024-02-29'); // leap year
  });

  it('starts a streak at 1 on first play', () => {
    expect(getDailyStreak()).toBeNull();
    const s = recordDailyChallengePlayed('2026-06-11');
    expect(s).toEqual({ lastPlayedId: '2026-06-11', streak: 1, best: 1 });
    expect(getDailyStreak()).toEqual(s);
  });

  it('same-day replays do not inflate the streak', () => {
    recordDailyChallengePlayed('2026-06-11');
    const s = recordDailyChallengePlayed('2026-06-11');
    expect(s.streak).toBe(1);
  });

  it('consecutive days extend the streak and track the best', () => {
    recordDailyChallengePlayed('2026-06-10');
    recordDailyChallengePlayed('2026-06-11');
    const s = recordDailyChallengePlayed('2026-06-12');
    expect(s).toEqual({ lastPlayedId: '2026-06-12', streak: 3, best: 3 });
  });

  it('a missed day resets the streak but keeps the best', () => {
    recordDailyChallengePlayed('2026-06-10');
    recordDailyChallengePlayed('2026-06-11');
    const s = recordDailyChallengePlayed('2026-06-14'); // skipped 12th + 13th
    expect(s).toEqual({ lastPlayedId: '2026-06-14', streak: 1, best: 2 });
  });

  it('streak extends across a month boundary', () => {
    recordDailyChallengePlayed('2026-05-31');
    const s = recordDailyChallengePlayed('2026-06-01');
    expect(s.streak).toBe(2);
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('tycoon_daily_streak_v1', 'not-json{');
    expect(getDailyStreak()).toBeNull();
    expect(recordDailyChallengePlayed('2026-06-11').streak).toBe(1);
  });
});
