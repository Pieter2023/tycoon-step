import React, { useState } from 'react';
import type { GameState, MarketItem } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { incomeYield, nominalPrice, projectContributions } from '../../services/investmentModel';
import { EXCHANGE_ITEMS, marketMood, indexChangePct, holdingOf, unrealised, downsideSentence } from '../../services/townMarket';
import { investorJourney, HOLD_MONTHS } from '../../services/townJourney';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
import { tl } from '../../i18n/town';

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
    <p className="town-eyebrow">{tl('THE EXCHANGE · BROKER','LA BOLSA · CORREDOR')}</p><h3>{mood.headline}</h3>
    <div className="town-lesson town-market"><strong>{tl('Market mood','Ánimo del mercado')}: {mood.label}{change === null ? '' : ` · ${tl('index','índice')} ${change >= 0 ? '+' : ''}${change}% ${tl('over 12 months','en 12 meses')}`}</strong>
      <svg viewBox="0 0 300 64" className="town-sparkline" role="img" aria-label={tl('Teaching market index over the last three years','Índice de mercado didáctico de los últimos tres años')}><path d={path} fill="none" stroke={points[points.length - 1].value >= points[0].value ? '#7fd9a4' : '#ef8b80'} strokeWidth="3" strokeLinejoin="round" /></svg>
      <p>{mood.advice} {tl('This index is the game\'s simplified cycle, not a live market.','Este índice es el ciclo simplificado del juego, no un mercado real.')}</p></div>
    {!journey.completed && <div className="town-lesson"><strong>{tl('Investor journey','Recorrido del inversor')} · {journey.step + 1}/4 · {journey.title}</strong><p>{journey.detail}</p>
      <ol className="town-journey-steps">{journey.milestones.map((m, i) => <li key={m.title} aria-current={i === journey.step ? 'step' : undefined}><span>{m.done ? '✓' : i + 1}</span><strong>{m.title}</strong></li>)}</ol></div>}
    <div className="town-offers">
      {EXCHANGE_ITEMS.map(id => {
        const item = MARKET_ITEMS.find(i => i.id === id)!; const price = nominalPrice(item, state.month, state.economy.inflationRate);
        const held = holdingOf(state, id); const yieldPct = incomeYield(item) * 100, growthPct = Math.max(0, item.expectedYield - incomeYield(item)) * 100;
        return <article key={id} className="town-offer">
          <div className="town-offer-heading"><h4>{item.name}</h4>{held && <span>{held.quantity} {tl('held','en cartera')}</span>}</div>
          <p><strong>{money(price)}</strong> {tl('per unit','por unidad')} · {tl('Risk','Riesgo')}: {item.risk.replace(/_/g, ' ').toLowerCase()}</p>
          <p>{yieldPct > 0 ? <>{tl('Pays about','Paga cerca de')} <strong>{yieldPct.toFixed(1)}%/{tl('yr','año')}</strong> {tl('in cash','en efectivo')}{growthPct > 0 ? ` ${tl('plus a','más un supuesto de crecimiento de')} ${growthPct.toFixed(1)}%/${tl('yr growth assumption','año')}` : ''}.</> : <>{tl('Pays','Paga')} <strong>{tl('no cash','nada en efectivo')}</strong>; {tl('the whole','todo el supuesto de')} {item.expectedYield * 100}%/{tl('yr assumption is price growth you only get by selling.','año es crecimiento de precio que solo obtienes al vender.')}</>} {downsideSentence(item.volatility)}</p>
          {held && <p className="town-holding">{tl('You hold','Tienes')} {held.quantity} {tl('worth','por valor de')} {money(held.value * held.quantity)} · {tl('paid','pagaste')} {money(held.costBasis * held.quantity)} · {unrealised(held) >= 0 ? tl('up','arriba') : tl('down','abajo')} {money(Math.abs(unrealised(held)))} {tl('unrealised','sin realizar')}</p>}
          <div className="town-tabs">{([1, 5, 10] as const).map(n => { const total = price * n, after = state.cash - total; return <button key={n} disabled={disabled || after < 0} onClick={() => onBuy(item, n)} title={after >= 0 && after < expenses ? tl('This would leave less than one month of expenses in cash.','Esto dejaría menos de un mes de gastos en efectivo.') : undefined}>{tl('Buy','Comprar')} {n} · {money(total)}{after >= 0 && after < expenses ? ' ⚠' : ''}</button>; })}</div>
          {held && onSell && <button className="town-text-button" disabled={disabled} onClick={() => onSell(held.id)}>{tl('Sell all','Vender todo')} {held.quantity} {tl('for','por')} {money(held.value * held.quantity)} → {tl('(a hindsight note follows in a year)','(en un año llega una nota retrospectiva)')}</button>}
        </article>;
      })}
    </div>
    <div className="town-lesson"><strong>{tl('Time in the market','Tiempo en el mercado')}</strong>
      <div className="town-tabs" aria-label={tl('Monthly contribution','Aporte mensual')}>{([100, 250, 500] as const).map(n => <button key={n} aria-pressed={monthly === n} onClick={() => setMonthly(n)}>{money(n)}/mo</button>)}</div>
      <div className="town-tabs" aria-label={tl('Years','Años')}>{([5, 10, 20] as const).map(n => <button key={n} aria-pressed={years === n} onClick={() => setYears(n)}>{n} {tl('years','años')}</button>)}</div>
      <p>{money(monthly)} {tl('a month for','al mes durante')} {years} {tl('years pays in','años suma')} <strong>{money(projection.invested)}</strong>. {tl('At the index\'s','Con el supuesto didáctico del índice de')} {Math.round(sp500.expectedYield * 100)}%/{tl('yr teaching assumption that could be worth about','año podría valer cerca de')} <strong>{money(projection.value)}</strong>; {tl('at a cautious','con un cauto')} {Math.round(sp500.expectedYield * 60)}%/{tl('yr, about','año, cerca de')} {money(cautious.value)}. {tl('Averages hide bad years, so the buffer at the bank matters more than any forecast.','Los promedios esconden años malos, así que el colchón en el banco importa más que cualquier pronóstico.')}</p>
      {!journey.completed && journey.step === 2 && <p>{tl('Your first units need','Tus primeras unidades necesitan')} {HOLD_MONTHS} {tl('months of holding before this arc finishes. Nothing here is spendable until you sell.','meses en cartera antes de que termine este recorrido. Nada de esto se puede gastar hasta vender.')}</p>}</div>
    <button className="town-text-button" onClick={onOpenMoney}>{tl('Explore all investments →','Explorar todas las inversiones →')}</button>
  </>;
}
