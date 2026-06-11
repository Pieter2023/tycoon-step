// Daily-challenge leaderboard backed by Supabase (project "tycoon").
//
// Writes go straight to PostgREST with the publishable (anon) key — that key
// is designed to be public; row-level security only allows INSERT and SELECT
// on daily_scores (no update/delete), and a unique (challenge_id, client_id)
// constraint caps each device at one score per day. Good enough for a casual
// async leaderboard; real accounts arrive with the Supabase auth milestone.

import { GameState } from '../types';

const SUPABASE_URL = 'https://bvsqnhtlwklexyijvexw.supabase.co';
// Publishable key — safe to ship in the client bundle (RLS enforced).
const SUPABASE_ANON_KEY = 'sb_publishable_CGy4zjl117ghewz_U1Pxcw_d3VYFWj3';

const SCORES_ENDPOINT = `${SUPABASE_URL}/rest/v1/daily_scores`;
const NAME_KEY = 'tycoon_player_name';
const CLIENT_ID_KEY = 'tycoon_client_id';

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  outcome: 'WIN' | 'BANKRUPT' | 'COMPLETE';
  client_id: string;
}

export type SubmitResult = 'submitted' | 'already-submitted' | 'error';

const headers = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
});

export const getClientId = (): string => {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `c-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous-device';
  }
};

export const getSavedPlayerName = (): string => {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
};

export const savePlayerName = (name: string): void => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // non-fatal
  }
};

export const challengeOutcome = (gameState: GameState): LeaderboardEntry['outcome'] => {
  if (gameState.isBankrupt) return 'BANKRUPT';
  if (gameState.hasWon) return 'WIN';
  return 'COMPLETE';
};

export const submitDailyScore = async (
  gameState: GameState,
  netWorth: number,
  playerName: string
): Promise<SubmitResult> => {
  const challenge = gameState.challenge;
  if (!challenge || !SUPABASE_ANON_KEY) return 'error';
  const name = playerName.trim().slice(0, 20);
  if (!name) return 'error';
  savePlayerName(name);
  try {
    const res = await fetch(SCORES_ENDPOINT, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        challenge_id: challenge.id,
        player_name: name,
        score: Math.round(netWorth),
        months: Math.min(Math.max(0, gameState.month - 1), challenge.targetMonths),
        outcome: challengeOutcome(gameState),
        client_id: getClientId()
      })
    });
    if (res.ok) return 'submitted';
    if (res.status === 409) return 'already-submitted'; // unique (challenge_id, client_id)
    return 'error';
  } catch {
    return 'error';
  }
};

export const fetchDailyLeaderboard = async (
  challengeId: string,
  limit = 10
): Promise<LeaderboardEntry[] | null> => {
  if (!SUPABASE_ANON_KEY) return null;
  try {
    const params = new URLSearchParams({
      challenge_id: `eq.${challengeId}`,
      select: 'player_name,score,outcome,client_id',
      order: 'score.desc',
      limit: String(limit)
    });
    const res = await fetch(`${SCORES_ENDPOINT}?${params}`, { headers: headers() });
    if (!res.ok) return null;
    return (await res.json()) as LeaderboardEntry[];
  } catch {
    return null;
  }
};

/** 1-based rank of a score for the day (count of strictly better scores + 1). */
export const fetchRankForScore = async (
  challengeId: string,
  score: number
): Promise<number | null> => {
  if (!SUPABASE_ANON_KEY) return null;
  try {
    const params = new URLSearchParams({
      challenge_id: `eq.${challengeId}`,
      score: `gt.${Math.round(score)}`,
      select: 'id'
    });
    const res = await fetch(`${SCORES_ENDPOINT}?${params}`, {
      method: 'HEAD',
      headers: { ...headers(), Prefer: 'count=exact' }
    });
    if (!res.ok) return null;
    const range = res.headers.get('content-range'); // e.g. "0-9/42" or "*/0"
    const total = range?.split('/')[1];
    if (total === undefined) return null;
    return Number(total) + 1;
  } catch {
    return null;
  }
};
