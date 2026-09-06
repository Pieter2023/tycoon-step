import React, { useState } from 'react';
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
    <p className="town-eyebrow">PROPERTY & CO. · YOUR AGENT</p><h3>Bricks pay rent. Bricks also need repairs.</h3>
    <div className="town-lesson"><strong>Today's base rate {(state.economy.interestRate * 100).toFixed(1)}%</strong><p>Every mortgage here adds its own spread on top. A higher rate means a bigger monthly payment for the same house, so the rent it earns has to work harder.</p>
      {owned.length > 0 && <p>You own {owned.length} propert{owned.length === 1 ? 'y' : 'ies'} worth {money(owned.reduce((s, a) => s + a.value * a.quantity, 0))}. Rent arrives with the monthly simulation; upkeep and loan payments leave with it.</p>}</div>
    <div className="town-offers">
      {PROPERTY_LISTINGS.map(id => {
        const item = MARKET_ITEMS.find(i => i.id === id)!, price = nominalPrice(item, state.month, state.economy.inflationRate), month = landlordMonth(item, price);
        const quotes = (item.mortgageOptions ?? []).map(o => mortgageQuote(price, o, state.economy.interestRate, netWorth, income)!);
        const best = quotes.find(q => q.eligible);
        return <article key={id} className="town-offer">
          <div className="town-offer-heading"><h4>{item.name}</h4>{state.assets.some(a => a.marketItemId === id && a.quantity > 0) && <span>owned</span>}</div>
          <p><strong>{money(price)}</strong> · {item.description}</p>
          <p>Gross rent about <strong>{money(month.grossRent)}/mo</strong> ({(incomeYield(item) * 100).toFixed(1)}%/yr). Less {money(month.upkeep)} upkeep and {money(month.vacancy)} vacancy allowance leaves <strong>{money(month.net)}/mo</strong> before any loan or tax.</p>
          {item.canMortgage ? <>
            {best ? <p>With the {best.name}: {money(best.down)} down, {money(best.payment)}/mo at {(best.rate * 100).toFixed(2)}% for {best.termYears} years. Rent minus payment: <strong className={month.net - best.payment < 0 ? 'town-caution' : ''}>{money(month.net - best.payment)}/mo</strong>{month.net - best.payment < 0 ? ' — you would top this up from salary every month.' : '.'}</p> : <p>No mortgage option fits yet ({quotes[0]?.reason ?? 'requirements not met'}).</p>}
            <button className="town-primary" disabled={disabled || !onMortgage || !best || !canAffordDown(state, best, cashFlow.expenses)} onClick={() => onMortgage?.(item)}>Preview a mortgage →</button>
            {best && !canAffordDown(state, best, cashFlow.expenses) && <p className="town-small town-caution">The down payment would leave less than a month of expenses in cash.</p>}
          </> : <>
            <p className="town-after">Cash after: <strong>{money(state.cash - price)}</strong>{state.cash - price >= 0 && state.cash - price < cashFlow.expenses && <span>Below one month of expenses.</span>}</p>
            <button disabled={disabled || state.cash < price} onClick={() => onBuy(item, 1)}>{state.cash < price ? `Need ${money(price - state.cash)} more` : `Buy a share · ${money(price)}`}</button>
          </>}
        </article>;
      })}
    </div>
    <div className="town-lesson"><strong>Rent or buy your own home?</strong>
      <div className="town-tabs">{(['starter_home', 'duplex'] as const).map(id => <button key={id} aria-pressed={homeId === id} onClick={() => setHomeId(id)}>{MARKET_ITEMS.find(i => i.id === id)!.name}</button>)}</div>
      <div className="town-tabs">{options.map(o => <button key={o.optionId} aria-pressed={chosen?.optionId === o.optionId} disabled={!o.eligible} title={o.reason} onClick={() => setOptionId(o.optionId)}>{o.downPercent}% down</button>)}</div>
      {chosen && comparison ? <>
        <p>Your rent is about <strong>{money(rent)}/mo</strong> (a third of your expenses). Owning the {home.name} with {money(chosen.down)} down costs <strong>{money(comparison.ownerMonthly)}/mo</strong> (payment {money(chosen.payment)} + upkeep), {comparison.extraPerMonth >= 0 ? `${money(comparison.extraPerMonth)} more` : `${money(-comparison.extraPerMonth)} less`} than renting.</p>
        <p>In year one about {money(comparison.principalYear1)} of the payments becomes equity and the home might gain {money(comparison.appreciationYear1)} at 3%/yr, so your real cost of owning is roughly {money(comparison.netOwnCostYear1)} against {money(comparison.rentYear)} of rent: <strong>{comparison.aheadBy >= 0 ? `owning comes out ${money(comparison.aheadBy)} ahead` : `renting comes out ${money(-comparison.aheadBy)} ahead`}</strong>. Prices can also fall, and moving costs are real.</p>
      </> : <p>No mortgage fits this home yet; keep building net worth and income.</p>}
    </div>
    <button className="town-text-button" onClick={onOpenMoney}>Compare all properties and mortgages →</button>
  </>;
}
