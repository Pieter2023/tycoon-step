import React, { useState } from 'react';
import type { GameState, MarketItem } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { incomeYield, nominalPrice, projectContributions } from '../../services/investmentModel';
import { EXCHANGE_ITEMS, marketMood, indexChangePct, holdingOf, unrealised, downsideSentence } from '../../services/townMarket';
import { investorJourney, HOLD_MONTHS } from '../../services/townJourney';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
type Props = { state: GameState; disabled: boolean; onBuy: (item: MarketItem, quantity: number) => void; onSell?: (assetId: string) => void; onOpenMoney: () => void };

// The broker's window: market mood with the teaching index, three contrasting assets to own,
// and a contributions calculator that makes "time in the market" concrete.
export default function ExchangePanel({ state, disabled, onBuy, onSell, onOpenMoney }: Props) {
  const mood = marketMood(state.marketCycle.phase, state.economy.recession), change = indexChangePct(state.marketIndex);
  const index = state.marketIndex ?? [];
  const journey = investorJourney(state);
  const expenses = calculateMonthlyCashFlowEstimate(state).expenses;
  const [monthly, setMonthly] = useState<100 | 250 | 500>(250), [years, setYears] = useState<5 | 10 | 20>(10);
  const sp500 = MARKET_ITEMS.find(i => i.id === 'sp500')!;
  const projection = projectContributions(monthly, years, sp500.expectedYield), cautious = projectContributions(monthly, years, sp500.expectedYield * .6);
  const points = index.length > 1 ? index : [{ month: state.month, value: 100 }, { month: state.month, value: 100 }];
  const min = Math.min(...points.map(p => p.value)) * .98, max = Math.max(...points.map(p => p.value)) * 1.02;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${(i / (points.length - 1) * 300).toFixed(1)},${(60 - (p.value - min) / (max - min || 1) * 56).toFixed(1)}`).join(' ');
  return <>
    <p className="town-eyebrow">THE EXCHANGE · BROKER</p><h3>{mood.headline}</h3>
    <div className="town-lesson town-market"><strong>Market mood: {mood.label}{change === null ? '' : ` · index ${change >= 0 ? '+' : ''}${change}% over 12 months`}</strong>
      <svg viewBox="0 0 300 64" className="town-sparkline" role="img" aria-label="Teaching market index over the last three years"><path d={path} fill="none" stroke={points[points.length - 1].value >= points[0].value ? '#7fd9a4' : '#ef8b80'} strokeWidth="3" strokeLinejoin="round" /></svg>
      <p>{mood.advice} This index is the game's simplified cycle, not a live market.</p></div>
    {!journey.completed && <div className="town-lesson"><strong>Investor journey · {journey.step + 1}/4 · {journey.title}</strong><p>{journey.detail}</p>
      <ol className="town-journey-steps">{journey.milestones.map((m, i) => <li key={m.title} aria-current={i === journey.step ? 'step' : undefined}><span>{m.done ? '✓' : i + 1}</span><strong>{m.title}</strong></li>)}</ol></div>}
    <div className="town-offers">
      {EXCHANGE_ITEMS.map(id => {
        const item = MARKET_ITEMS.find(i => i.id === id)!; const price = nominalPrice(item, state.month, state.economy.inflationRate);
        const held = holdingOf(state, id); const yieldPct = incomeYield(item) * 100, growthPct = Math.max(0, item.expectedYield - incomeYield(item)) * 100;
        return <article key={id} className="town-offer">
          <div className="town-offer-heading"><h4>{item.name}</h4>{held && <span>{held.quantity} held</span>}</div>
          <p><strong>{money(price)}</strong> per unit · Risk: {item.risk.replace(/_/g, ' ').toLowerCase()}</p>
          <p>{yieldPct > 0 ? <>Pays about <strong>{yieldPct.toFixed(1)}%/yr</strong> in cash{growthPct > 0 ? ` plus a ${growthPct.toFixed(1)}%/yr growth assumption` : ''}.</> : <>Pays <strong>no cash</strong>; the whole {item.expectedYield * 100}%/yr assumption is price growth you only get by selling.</>} {downsideSentence(item.volatility)}</p>
          {held && <p className="town-holding">You hold {held.quantity} worth {money(held.value * held.quantity)} · paid {money(held.costBasis * held.quantity)} · {unrealised(held) >= 0 ? 'up' : 'down'} {money(Math.abs(unrealised(held)))} unrealised</p>}
          <div className="town-tabs">{([1, 5, 10] as const).map(n => { const total = price * n, after = state.cash - total; return <button key={n} disabled={disabled || after < 0} onClick={() => onBuy(item, n)} title={after >= 0 && after < expenses ? 'This would leave less than one month of expenses in cash.' : undefined}>Buy {n} · {money(total)}{after >= 0 && after < expenses ? ' ⚠' : ''}</button>; })}</div>
          {held && onSell && <button className="town-text-button" disabled={disabled} onClick={() => onSell(held.id)}>Sell all {held.quantity} for {money(held.value * held.quantity)} → (a hindsight note follows in a year)</button>}
        </article>;
      })}
    </div>
    <div className="town-lesson"><strong>Time in the market</strong>
      <div className="town-tabs" aria-label="Monthly contribution">{([100, 250, 500] as const).map(n => <button key={n} aria-pressed={monthly === n} onClick={() => setMonthly(n)}>{money(n)}/mo</button>)}</div>
      <div className="town-tabs" aria-label="Years">{([5, 10, 20] as const).map(n => <button key={n} aria-pressed={years === n} onClick={() => setYears(n)}>{n} years</button>)}</div>
      <p>{money(monthly)} a month for {years} years pays in <strong>{money(projection.invested)}</strong>. At the index's {Math.round(sp500.expectedYield * 100)}%/yr teaching assumption that could be worth about <strong>{money(projection.value)}</strong>; at a cautious {Math.round(sp500.expectedYield * 60)}%/yr, about {money(cautious.value)}. Averages hide bad years, so the buffer at the bank matters more than any forecast.</p>
      {!journey.completed && journey.step === 2 && <p>Your first units need {HOLD_MONTHS} months of holding before this arc finishes. Nothing here is spendable until you sell.</p>}</div>
    <button className="town-text-button" onClick={onOpenMoney}>Explore all investments →</button>
  </>;
}
