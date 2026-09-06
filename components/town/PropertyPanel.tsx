import React, { useState } from 'react';
import { tl } from '../../i18n/town';
import type { GameState, MarketItem } from '../../types';
import { MARKET_ITEMS } from '../../constants';
import { nominalPrice, incomeYield } from '../../services/investmentModel';
import { calculateMonthlyCashFlowEstimate, calculateNetWorth } from '../../services/gameLogic';
import { PROPERTY_LISTINGS, mortgageQuote, landlordMonth, rentVsBuy, rentEstimate, canAffordDown } from '../../services/townProperty';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
type Props = { state: GameState; disabled: boolean; onBuy: (item: MarketItem, quantity: number) => void; onMortgage?: (item: MarketItem) => void; onOpenMoney: () => void };

// The agent's desk: what each listing really leaves after upkeep and vacancies, what a mortgage
// costs at today's rate, and whether owning your own home beats renting this year.
export default function PropertyPanel({ state, disabled, onBuy, onMortgage, onOpenMoney }: Props) {
  const cashFlow = calculateMonthlyCashFlowEstimate(state), netWorth = calculateNetWorth(state), income = cashFlow.income;
  const rent = rentEstimate(cashFlow.expenses);
  const [homeId, setHomeId] = useState<'starter_home' | 'duplex'>('starter_home');
  const [optionId, setOptionId] = useState('fha');
  const home = MARKET_ITEMS.find(i => i.id === homeId)!, homePrice = nominalPrice(home, state.month, state.economy.inflationRate);
  const options = (home.mortgageOptions ?? []).map(id => mortgageQuote(homePrice, id, state.economy.interestRate, netWorth, income)!).filter(Boolean);
  const chosen = options.find(o => o.optionId === optionId) ?? options[0];
  const comparison = chosen ? rentVsBuy(homePrice, rent, chosen) : null;
  const owned = state.assets.filter(a => a.type === 'REAL_ESTATE' && a.quantity > 0);
  return <>
    <p className="town-eyebrow">{tl('PROPERTY & CO. · YOUR AGENT','PROPIEDADES & CÍA. · TU AGENTE')}</p><h3>{tl('Bricks pay rent. Bricks also need repairs.','Los ladrillos pagan renta. Los ladrillos también necesitan reparaciones.')}</h3>
    <div className="town-lesson"><strong>{tl('Today\'s base rate','Tasa base de hoy')} {(state.economy.interestRate * 100).toFixed(1)}%</strong><p>{tl('Every mortgage here adds its own spread on top. A higher rate means a bigger monthly payment for the same house, so the rent it earns has to work harder.','Cada hipoteca aquí suma su propio margen. Una tasa más alta significa una cuota mensual mayor por la misma casa, así que la renta que genera tiene que rendir más.')}</p>
      {owned.length > 0 && <p>{tl('You own','Tienes')} {owned.length} {tl(owned.length === 1 ? 'property' : 'properties', owned.length === 1 ? 'propiedad' : 'propiedades')} {tl('worth','por valor de')} {money(owned.reduce((s, a) => s + a.value * a.quantity, 0))}. {tl('Rent arrives with the monthly simulation; upkeep and loan payments leave with it.','La renta llega con la simulación mensual; el mantenimiento y las cuotas del préstamo salen con ella.')}</p>}</div>
    <div className="town-offers">
      {PROPERTY_LISTINGS.map(id => {
        const item = MARKET_ITEMS.find(i => i.id === id)!, price = nominalPrice(item, state.month, state.economy.inflationRate), month = landlordMonth(item, price);
        const quotes = (item.mortgageOptions ?? []).map(o => mortgageQuote(price, o, state.economy.interestRate, netWorth, income)!);
        const best = quotes.find(q => q.eligible);
        return <article key={id} className="town-offer">
          <div className="town-offer-heading"><h4>{item.name}</h4>{state.assets.some(a => a.marketItemId === id && a.quantity > 0) && <span>{tl('owned','tuya')}</span>}</div>
          <p><strong>{money(price)}</strong> · {item.description}</p>
          <p>{tl('Gross rent about','Renta bruta de unos')} <strong>{money(month.grossRent)}/{tl('mo','mes')}</strong> ({(incomeYield(item) * 100).toFixed(1)}%/{tl('yr','año')}). {tl('Less','Menos')} {money(month.upkeep)} {tl('upkeep and','de mantenimiento y')} {money(month.vacancy)} {tl('vacancy allowance leaves','de reserva por vacancia deja')} <strong>{money(month.net)}/{tl('mo','mes')}</strong> {tl('before any loan or tax.','antes de préstamo o impuestos.')}</p>
          {item.canMortgage ? <>
            {best ? <p>{tl('With the','Con la')} {best.name}: {money(best.down)} {tl('down','de enganche')}, {money(best.payment)}/{tl('mo','mes')} {tl('at','al')} {(best.rate * 100).toFixed(2)}% {tl('for','durante')} {best.termYears} {tl('years. Rent minus payment','años. Renta menos cuota')}: <strong className={month.net - best.payment < 0 ? 'town-caution' : ''}>{money(month.net - best.payment)}/{tl('mo','mes')}</strong>{month.net - best.payment < 0 ? tl(' — you would top this up from salary every month.',' — tendrías que cubrir la diferencia con tu sueldo cada mes.') : '.'}</p> : <p>{tl('No mortgage option fits yet','Ninguna opción de hipoteca encaja todavía')} ({quotes[0]?.reason ?? tl('requirements not met','requisitos no cumplidos')}).</p>}
            <button className="town-primary" disabled={disabled || !onMortgage || !best || !canAffordDown(state, best, cashFlow.expenses)} onClick={() => onMortgage?.(item)}>{tl('Preview a mortgage →','Ver una hipoteca →')}</button>
            {best && !canAffordDown(state, best, cashFlow.expenses) && <p className="town-small town-caution">{tl('The down payment would leave less than a month of expenses in cash.','El enganche dejaría menos de un mes de gastos en efectivo.')}</p>}
          </> : <>
            <p className="town-after">{tl('Cash after','Efectivo después')}: <strong>{money(state.cash - price)}</strong>{state.cash - price >= 0 && state.cash - price < cashFlow.expenses && <span>{tl('Below one month of expenses.','Por debajo de un mes de gastos.')}</span>}</p>
            <button disabled={disabled || state.cash < price} onClick={() => onBuy(item, 1)}>{state.cash < price ? `${tl('Need','Faltan')} ${money(price - state.cash)} ${tl('more','más')}` : `${tl('Buy a share','Comprar una participación')} · ${money(price)}`}</button>
          </>}
        </article>;
      })}
    </div>
    <div className="town-lesson"><strong>{tl('Rent or buy your own home?','¿Rentar o comprar tu propia casa?')}</strong>
      <div className="town-tabs">{(['starter_home', 'duplex'] as const).map(id => <button key={id} aria-pressed={homeId === id} onClick={() => setHomeId(id)}>{MARKET_ITEMS.find(i => i.id === id)!.name}</button>)}</div>
      <div className="town-tabs">{options.map(o => <button key={o.optionId} aria-pressed={chosen?.optionId === o.optionId} disabled={!o.eligible} title={o.reason} onClick={() => setOptionId(o.optionId)}>{o.downPercent}% {tl('down','de enganche')}</button>)}</div>
      {chosen && comparison ? <>
        <p>{tl('Your rent is about','Tu renta es de unos')} <strong>{money(rent)}/{tl('mo','mes')}</strong> ({tl('a third of your expenses','un tercio de tus gastos')}). {tl('Owning the','Ser dueño de')} {home.name} {tl('with','con')} {money(chosen.down)} {tl('down costs','de enganche cuesta')} <strong>{money(comparison.ownerMonthly)}/{tl('mo','mes')}</strong> ({tl('payment','cuota')} {money(chosen.payment)} + {tl('upkeep','mantenimiento')}), {comparison.extraPerMonth >= 0 ? `${money(comparison.extraPerMonth)} ${tl('more','más')}` : `${money(-comparison.extraPerMonth)} ${tl('less','menos')}`} {tl('than renting.','que rentar.')}</p>
        <p>{tl('In year one about','En el primer año unos')} {money(comparison.principalYear1)} {tl('of the payments becomes equity and the home might gain','de las cuotas se vuelven capital y la casa podría ganar')} {money(comparison.appreciationYear1)} {tl('at 3%/yr, so your real cost of owning is roughly','al 3% anual, así que tu costo real de ser dueño es de unos')} {money(comparison.netOwnCostYear1)} {tl('against','frente a')} {money(comparison.rentYear)} {tl('of rent','de renta')}: <strong>{comparison.aheadBy >= 0 ? `${tl('owning comes out','comprar sale')} ${money(comparison.aheadBy)} ${tl('ahead','adelante')}` : `${tl('renting comes out','rentar sale')} ${money(-comparison.aheadBy)} ${tl('ahead','adelante')}`}</strong>. {tl('Prices can also fall, and moving costs are real.','Los precios también pueden bajar, y mudarse cuesta.')}</p>
      </> : <p>{tl('No mortgage fits this home yet; keep building net worth and income.','Ninguna hipoteca encaja con esta casa todavía; sigue construyendo patrimonio e ingresos.')}</p>}
    </div>
    <button className="town-text-button" onClick={onOpenMoney}>{tl('Compare all properties and mortgages →','Comparar todas las propiedades e hipotecas →')}</button>
  </>;
}
