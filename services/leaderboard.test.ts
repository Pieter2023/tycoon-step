import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  challengeOutcome,
  fetchDailyLeaderboard,
  fetchRankForScore,
  getClientId,
  getSavedPlayerName,
  submitDailyScore
} from './leaderboard';
import { GameState } from '../types';

const challengeState = (overrides: Partial<GameState> = {}): GameState => ({
  challenge: { id: '2026-06-11', seed: 1, targetMonths: 120 },
  month: 121,
  hasWon: false,
  isBankrupt: false,
  ...overrides
} as unknown as GameState);

const mockFetch = (response: Partial<Response>) => {
  const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [], headers: new Headers(), ...response });
  vi.stubGlobal('fetch', fn);
  return fn;
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('challengeOutcome', () => {
  it('maps game state to outcome', () => {
    expect(challengeOutcome(challengeState())).toBe('COMPLETE');
    expect(challengeOutcome(challengeState({ hasWon: true }))).toBe('WIN');
    expect(challengeOutcome(challengeState({ isBankrupt: true, hasWon: true }))).toBe('BANKRUPT');
  });
});

describe('getClientId', () => {
  it('generates once and persists', () => {
    const id = getClientId();
    expect(id.length).toBeGreaterThanOrEqual(8);
    expect(getClientId()).toBe(id);
  });
});

describe('submitDailyScore', () => {
  it('posts the score and saves the name', async () => {
    const fn = mockFetch({ ok: true, status: 201 });
    const result = await submitDailyScore(challengeState(), 123456.7, '  Pieter  ');
    expect(result).toBe('submitted');
    expect(getSavedPlayerName()).toBe('Pieter');
    const body = JSON.parse(fn.mock.calls[0][1].body);
    expect(body).toMatchObject({
      challenge_id: '2026-06-11',
      player_name: 'Pieter',
      score: 123457,
      months: 120,
      outcome: 'COMPLETE'
    });
    expect(body.client_id).toBe(getClientId());
  });

  it('treats a duplicate (409) as already submitted', async () => {
    mockFetch({ ok: false, status: 409 });
    expect(await submitDailyScore(challengeState(), 100, 'Pieter')).toBe('already-submitted');
  });

  it('errors on missing challenge, empty name, or network failure', async () => {
    mockFetch({ ok: true, status: 201 });
    expect(await submitDailyScore(challengeState({ challenge: undefined }), 100, 'P')).toBe('error');
    expect(await submitDailyScore(challengeState(), 100, '   ')).toBe('error');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await submitDailyScore(challengeState(), 100, 'Pieter')).toBe('error');
  });

  it('caps months at the challenge target', async () => {
    const fn = mockFetch({ ok: true, status: 201 });
    await submitDailyScore(challengeState({ month: 200 }), 100, 'Pieter');
    expect(JSON.parse(fn.mock.calls[0][1].body).months).toBe(120);
  });
});

describe('fetchDailyLeaderboard', () => {
  it('returns parsed entries ordered by the API', async () => {
    const rows = [{ player_name: 'A', score: 2, outcome: 'WIN', client_id: 'x'.repeat(8) }];
    const fn = mockFetch({ ok: true, json: async () => rows });
    expect(await fetchDailyLeaderboard('2026-06-11')).toEqual(rows);
    const url = String(fn.mock.calls[0][0]);
    expect(url).toContain('challenge_id=eq.2026-06-11');
    expect(url).toContain('order=score.desc');
  });

  it('returns null on failure', async () => {
    mockFetch({ ok: false, status: 500 });
    expect(await fetchDailyLeaderboard('2026-06-11')).toBeNull();
  });
});

describe('fetchRankForScore', () => {
  it('derives rank from the exact count of better scores', async () => {
    mockFetch({ ok: true, headers: new Headers({ 'content-range': '*/4' }) });
    expect(await fetchRankForScore('2026-06-11', 1000)).toBe(5);
  });

  it('returns null when the header is missing or the call fails', async () => {
    mockFetch({ ok: true, headers: new Headers() });
    expect(await fetchRankForScore('2026-06-11', 1000)).toBeNull();
    mockFetch({ ok: false, status: 500, headers: new Headers() });
    expect(await fetchRankForScore('2026-06-11', 1000)).toBeNull();
  });
});
