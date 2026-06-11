import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyLeaderboard from './DailyLeaderboard';
import { GameState } from '../types';
import { getAccount } from '../services/auth';

vi.mock('../services/auth', () => ({
  getAccount: vi.fn().mockResolvedValue(null),
  getSessionAuth: vi.fn().mockResolvedValue(null)
}));

const challengeState = {
  challenge: { id: '2026-06-11', seed: 1, targetMonths: 120 },
  month: 121,
  hasWon: true,
  isBankrupt: false
} as unknown as GameState;

const jsonResponse = (rows: unknown[]) => ({
  ok: true,
  status: 200,
  json: async () => rows,
  headers: new Headers({ 'content-range': '*/2' })
});

beforeEach(() => {
  localStorage.clear();
  vi.mocked(getAccount).mockResolvedValue(null);
});
afterEach(() => vi.unstubAllGlobals());

describe('DailyLeaderboard', () => {
  it('shows today\'s top scores and highlights this device', async () => {
    localStorage.setItem('tycoon_client_id', 'me-device-12345');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([
      { player_name: 'Alice', score: 500000, outcome: 'WIN', client_id: 'other-device-1' },
      { player_name: 'Pieter', score: 250000, outcome: 'COMPLETE', client_id: 'me-device-12345' }
    ])));

    render(<DailyLeaderboard gameState={challengeState} netWorth={250000} />);

    await waitFor(() => expect(screen.getByText('Alice')).toBeTruthy());
    expect(screen.getByText('Pieter')).toBeTruthy();
    expect(screen.getByText('(you)')).toBeTruthy();
    expect(screen.getByText('$500,000')).toBeTruthy();
  });

  it('submits a score and flips to the submitted state', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return Promise.resolve({ ok: true, status: 201, json: async () => [], headers: new Headers() });
      if (init?.method === 'HEAD') return Promise.resolve({ ok: true, status: 200, headers: new Headers({ 'content-range': '*/0' }) });
      return Promise.resolve(jsonResponse([]));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<DailyLeaderboard gameState={challengeState} netWorth={250000} />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Your name'), 'Pieter');
    await user.click(screen.getByRole('button', { name: /Submit score/i }));

    await waitFor(() => expect(screen.queryByRole('button', { name: /Submit score/i })).toBeNull());
    expect(screen.getByText(/You're #1 today/)).toBeTruthy();
    const post = fetchMock.mock.calls.find(c => c[1]?.method === 'POST');
    expect(post).toBeTruthy();
  });

  it('prefills the name from the account email when no name is saved', async () => {
    vi.mocked(getAccount).mockResolvedValue({ userId: 'u1', email: 'pieter@example.com', isAnonymous: false });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    render(<DailyLeaderboard gameState={challengeState} netWorth={1} />);
    await waitFor(() =>
      expect((screen.getByPlaceholderText('Your name') as HTMLInputElement).value).toBe('pieter')
    );
  });

  it('keeps the saved name over the account email', async () => {
    localStorage.setItem('tycoon_player_name', 'SavedName');
    vi.mocked(getAccount).mockResolvedValue({ userId: 'u1', email: 'pieter@example.com', isAnonymous: false });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    render(<DailyLeaderboard gameState={challengeState} netWorth={1} />);
    await waitFor(() => expect(screen.getByText(/No scores yet/)).toBeTruthy());
    expect((screen.getByPlaceholderText('Your name') as HTMLInputElement).value).toBe('SavedName');
  });

  it('shows the empty state when nobody has played yet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    render(<DailyLeaderboard gameState={challengeState} netWorth={1} />);
    await waitFor(() => expect(screen.getByText(/No scores yet/)).toBeTruthy());
  });

  it('degrades gracefully when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<DailyLeaderboard gameState={challengeState} netWorth={1} />);
    await waitFor(() => expect(screen.getByText(/Leaderboard unavailable/)).toBeTruthy());
  });
});
