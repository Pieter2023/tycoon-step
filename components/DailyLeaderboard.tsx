import React, { useCallback, useEffect, useState } from 'react';
import { GameState } from '../types';
import {
  LeaderboardEntry,
  fetchDailyLeaderboard,
  fetchRankForScore,
  getClientId,
  getSavedPlayerName,
  submitDailyScore
} from '../services/leaderboard';
import { getAccount } from '../services/auth';

// Daily-challenge leaderboard panel, shown inside the challenge end overlay.
// Submit once per device per day (enforced server-side), then today's top 10.

const fmtScore = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const OUTCOME_BADGE: Record<LeaderboardEntry['outcome'], string> = {
  WIN: '👑',
  COMPLETE: '🏁',
  BANKRUPT: '💸'
};

// Gold, silver and bronze discs for the podium; everyone else gets a plain number.
const RANK_TINT: Record<number, string> = {
  0: 'bg-[#ffd60a]/[0.2] text-[#ffd60a]',
  1: 'bg-[rgb(209_209_214/0.18)] text-slate-200',
  2: 'bg-[#ff9f0a]/[0.18] text-[#ffb340]'
};

interface DailyLeaderboardProps {
  gameState: GameState;
  netWorth: number;
}

const DailyLeaderboard: React.FC<DailyLeaderboardProps> = ({ gameState, netWorth }) => {
  const challengeId = gameState.challenge?.id;
  const [name, setName] = useState(() => getSavedPlayerName());
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const loadBoard = useCallback(async () => {
    if (!challengeId) return;
    const [board, myRank] = await Promise.all([
      fetchDailyLeaderboard(challengeId),
      fetchRankForScore(challengeId, netWorth)
    ]);
    setEntries(board);
    setRank(myRank);
  }, [challengeId, netWorth]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // No saved name yet but signed in with an email — prefill from the address.
  useEffect(() => {
    if (getSavedPlayerName()) return;
    let cancelled = false;
    getAccount().then((account) => {
      const local = account?.email?.split('@')[0];
      if (cancelled || !local) return;
      setName((current) => current || local.slice(0, 20));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 'submitting' || phase === 'done') return;
    setPhase('submitting');
    const result = await submitDailyScore(gameState, netWorth, name);
    if (result === 'error') {
      setPhase('error');
      return;
    }
    setPhase('done');
    loadBoard();
  };

  if (!challengeId) return null;

  const clientId = getClientId();

  return (
    <div className="w-full max-w-2xl rounded-[20px] bg-white/[0.045] p-4 ring-1 ring-inset ring-white/[0.06] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow text-[15px] text-white">🏆 Today's leaderboard</p>
        {rank !== null && phase === 'done' && (
          <p className="num rounded-full bg-amber-400/[0.15] px-2.5 py-1 text-[13px] font-semibold text-amber-300">You're #{rank} today</p>
        )}
      </div>

      {phase !== 'done' && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="min-w-[140px] flex-1 rounded-full bg-[rgb(118_118_128/0.2)] px-4 py-2.5 text-[16px] sm:text-[15px] text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={phase === 'submitting' || !name.trim()}
            className="pressable rounded-full bg-violet-500 px-5 py-2.5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_22px_-10px_rgb(157_123_255/0.7)] hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {phase === 'submitting' ? 'Submitting…' : 'Submit score'}
          </button>
          {phase === 'error' && (
            <p className="w-full px-1 text-[13px] text-red-300">Couldn't submit — check your connection and try again.</p>
          )}
        </form>
      )}

      {entries === null ? (
        <p className="px-1 text-[14px] text-slate-500">Leaderboard unavailable right now.</p>
      ) : entries.length === 0 ? (
        <p className="px-1 text-[14px] text-slate-400">No scores yet — yours could be first!</p>
      ) : (
        <ol className="stagger-in list-group">
          {entries.map((entry, i) => {
            const isMe = entry.client_id === clientId;
            return (
              <li
                key={`${entry.client_id}-${i}`}
                className={`list-row min-h-[46px] gap-3 py-2 text-[15px] ${isMe ? 'bg-violet-500/[0.16]' : ''}`}
              >
                <span
                  className={`num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${RANK_TINT[i] ?? 'text-slate-500'}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-white">
                  {entry.player_name} {isMe && <span className="text-[13px] font-medium text-violet-300">(you)</span>}
                </span>
                <span title={entry.outcome}>{OUTCOME_BADGE[entry.outcome] || '🏁'}</span>
                <span className="num font-semibold text-emerald-300">{fmtScore(entry.score)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default DailyLeaderboard;
