import React from 'react';
import type { GameState } from '../../types';
import { adviseFrom, type Advice } from '../../services/townAdvisor';
import { tl } from '../../i18n/town';

// Rosa on the bench: up to three observations drawn from the player's real numbers, each with
// a place to go. She never moves money; she points.
export default function AdvisorPanel({ state, onGo }: { state: GameState; onGo?: (place: NonNullable<Advice['place']>) => void }) {
  const advice = adviseFrom(state);
  return <>
    <p className="town-eyebrow">{tl('ROSA · THE BENCH BY THE FOUNTAIN','ROSA · EL BANCO JUNTO A LA FUENTE')}</p><h3>{tl('“Sit a minute. Let\'s look at your month.”','“Siéntate un minuto. Veamos tu mes.”')}</h3>
    <p className="town-intro">{tl('Rosa ran the bakery on this square for thirty years. She reads your actual numbers, not a script, and says what a friend would.','Rosa llevó la panadería de esta plaza durante treinta años. Lee tus números reales, no un guion, y dice lo que diría una amiga.')}</p>
    {advice.map(a => <div key={a.id} className={`town-lesson town-advice town-advice-${a.tone}`}><strong>{a.tone === 'warn' ? '⚠ ' : a.tone === 'good' ? '✦ ' : '💡 '}{a.title}</strong><p>{a.text}</p>{a.place && onGo && <button className="town-text-button" onClick={() => onGo(a.place!)}>{tl('Show me →','Muéstrame →')}</button>}</div>)}
    <p className="town-small">{tl('Fictional prices and rates for learning. Rosa\'s rules of thumb: one month of bills in cash, expensive debt before investing, spread your bets, and time in the market beats timing it.','Precios y tasas ficticios para aprender. Las reglas de Rosa: un mes de facturas en efectivo, la deuda cara antes de invertir, reparte tus apuestas, y el tiempo en el mercado le gana a adivinar el momento.')}</p>
  </>;
}
