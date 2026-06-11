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

// Daily-challenge leaderboard panel, shown inside the challenge end overlay.
// Submit once per device per day (enforced server-side), then today's top 10.

const fmtScore = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const OUTCOME_BADGE: Record<LeaderboardEntry['outcome'], string> = {
  WIN: '👑',
  COMPLETE: '🏁',
  BANKRUPT: '💸'
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
    <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">🏆 Today's leaderboard</p>
        {rank !== null && phase === 'done' && (
          <p className="text-xs font-bold text-amber-300">You're #{rank} today</p>
        )}
      </div>

      {phase !== 'done' && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 mb-3">
          <input
            type="text"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 min-w-[140px] px-3 py-2 bg-slate-900/70 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-400"
          />
          <button
            type="submit"
            disabled={phase === 'submitting' || !name.trim()}
            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-bold transition-colors"
          >
            {phase === 'submitting' ? 'Submitting…' : 'Submit score'}
          </button>
          {phase === 'error' && (
            <p className="w-full text-xs text-red-400">Couldn't submit — check your connection and try again.</p>
          )}
        </form>
      )}

      {entries === null ? (
        <p className="text-sm text-slate-500">Leaderboard unavailable right now.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400">No scores yet — yours could be first!</p>
      ) : (
        <ol className="space-y-1">
          {entries.map((entry, i) => {
            const isMe = entry.client_id === clientId;
            return (
              <li
                key={`${entry.client_id}-${i}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm ${
                  isMe ? 'bg-violet-500/20 border border-violet-400/40' : 'bg-slate-900/40'
                }`}
              >
                <span className="w-6 text-right font-bold text-slate-400">{i + 1}</span>
                <span className="flex-1 truncate text-white">
                  {entry.player_name} {isMe && <span className="text-violet-300 text-xs">(you)</span>}
                </span>
                <span title={entry.outcome}>{OUTCOME_BADGE[entry.outcome] || '🏁'}</span>
                <span className="font-bold text-emerald-300">{fmtScore(entry.score)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default DailyLeaderboard;
