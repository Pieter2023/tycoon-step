import React from 'react';
import type { GameState } from '../../types';
import { monthlyChallenges, challengeProgress, currentSnapshot, cleanSweeps, completedCount } from '../../services/townChallenges';

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
// The square's notice board: three challenges for this month with live progress, last month's
// verdict and the running badge count. Judged when the month closes; badges only, no cash.
export default function NoticeBoardPanel({ state, onNextMonth, disabled }: { state: GameState; onNextMonth: () => void; disabled: boolean }) {
  const snapshot = currentSnapshot(state), challenges = monthlyChallenges(state), progress = challenges.map(c => challengeProgress(c, snapshot, state));
  const done = progress.filter(p => p.done).length, log = state.townProgress?.challengeLog ?? [], last = log[log.length - 1];
  return <>
    <p className="town-eyebrow">NOTICE BOARD · MONTH {state.month}</p><h3>{done === challenges.length ? 'Clean sweep so far.' : `${done} of ${challenges.length} done this month.`}</h3>
    <p className="town-intro">Three small habits, judged when the month closes. They count what you do from now, not what you already had. Badges only; the money stays real.</p>
    <ol className="town-challenges">{challenges.map((c, i) => { const p = progress[i]; const pct = Math.min(100, Math.round(100 * p.value / Math.max(1, p.target))); return <li key={c.id} className={p.done ? 'done' : ''}>
      <span aria-hidden="true">{p.done ? '✓' : i + 1}</span>
      <div><strong>{c.title}</strong><p>{c.detail}</p><div className="town-reputation-bar" role="img" aria-label={`${pct}% of target`}><span style={{ width: `${pct}%` }} /></div><small>{c.unit === 'dollars' ? `${money(p.value)} of ${money(p.target)}` : `${p.value} of ${p.target}`}{p.done ? ' · done' : ''}</small></div>
    </li>; })}</ol>
    {last && <div className="town-lesson"><strong>Last month: {last.completed.length} of {last.total}</strong><p>{last.completed.length === last.total ? 'Every challenge landed. Keep the streak.' : last.completed.length ? 'Some habits stuck. The rest are back on the board in a new mix.' : 'Nothing landed last month. Pick one challenge and finish it early this time.'}</p></div>}
    <div className="town-badge"><span>✦</span><strong>{completedCount(log)} challenges completed · {cleanSweeps(log)} clean sweep{cleanSweeps(log) === 1 ? '' : 's'}</strong><p>Twelve months of results are kept. A clean sweep is all three in one month.</p></div>
    <button className="town-primary" disabled={disabled} onClick={onNextMonth}>Close the month & judge →</button>
  </>;
}
