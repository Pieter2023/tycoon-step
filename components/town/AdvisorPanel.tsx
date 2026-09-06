import React from 'react';
import type { GameState } from '../../types';
import { adviseFrom, type Advice } from '../../services/townAdvisor';

// Rosa on the bench: up to three observations drawn from the player's real numbers, each with
// a place to go. She never moves money; she points.
export default function AdvisorPanel({ state, onGo }: { state: GameState; onGo?: (place: NonNullable<Advice['place']>) => void }) {
  const advice = adviseFrom(state);
  return <>
    <p className="town-eyebrow">ROSA · THE BENCH BY THE FOUNTAIN</p><h3>“Sit a minute. Let's look at your month.”</h3>
    <p className="town-intro">Rosa ran the bakery on this square for thirty years. She reads your actual numbers, not a script, and says what a friend would.</p>
    {advice.map(a => <div key={a.id} className={`town-lesson town-advice town-advice-${a.tone}`}><strong>{a.tone === 'warn' ? '⚠ ' : a.tone === 'good' ? '✦ ' : '💡 '}{a.title}</strong><p>{a.text}</p>{a.place && onGo && <button className="town-text-button" onClick={() => onGo(a.place!)}>Show me →</button>}</div>)}
    <p className="town-small">Fictional prices and rates for learning. Rosa's rules of thumb: one month of bills in cash, expensive debt before investing, spread your bets, and time in the market beats timing it.</p>
  </>;
}
