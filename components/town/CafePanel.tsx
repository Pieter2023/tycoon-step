import React, { useEffect, useState } from 'react';
import type { GameState } from '../../types';
import { CafeAction, CafePlan, CafeReceipt, CAFE_DEPOSIT, CAFE_FITOUT, CAFE_UPGRADES, cafeValue, canLeaseCafe, quoteCafe, reputationOf, reputationDemand, reputationLabel } from '../../services/townCafe';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US')}`;
export function CafeLedger({ receipt }: { receipt: CafeReceipt }) {
  return <div className="town-recap"><h4>Month {receipt.month} · {receipt.rainy ? 'Rainy & quieter' : 'Market crowds'}</h4><dl>
    <div><dt>Cups sold / stocked</dt><dd>{receipt.sold} / {receipt.stock}</dd></div>
    <div><dt>Sales</dt><dd>{money(receipt.revenue)}</dd></div>
    <div><dt>All fresh supplies</dt><dd>−{money(receipt.supplies)}</dd></div>
    <div><dt>Staff wages</dt><dd>−{money(receipt.wages)}</dd></div>
    <div><dt>Rent + utilities</dt><dd>−{money(receipt.rent + receipt.utilities)}</dd></div>
    <div><dt>{receipt.profit < 0 ? 'Operating loss' : 'Operating profit'}</dt><dd>{money(receipt.profit)}</dd></div>
  </dl><p>{receipt.stock - receipt.sold} cups’ worth of supplies wasted. Net operating profit is already part of monthly income; these costs are not deducted twice. Annual game taxes are separate.</p></div>;
}
export default function CafePanel({ state, disabled, onAction, onNextMonth }: { state: GameState; disabled: boolean; onAction?: (action: CafeAction) => void; onNextMonth: () => void }) {
  const cafe = state.cafe;
  const [plan, setPlan] = useState<CafePlan>(cafe?.plan ?? { price: 6, stock: 400, helper: false, open: true });
  const [confirmClose, setConfirmClose] = useState(false), [notice, setNotice] = useState('');
  useEffect(() => { if (cafe) setPlan(cafe.plan); setConfirmClose(false); }, [cafe]);
  const locked = disabled || !onAction;
  if (!cafe) return <section className="town-cafe-panel"><p className="town-eyebrow">THE NEXT CHAPTER</p><h3>From cart to café.</h3><p className="town-intro">Your own neighbourhood shop. Start with a counter and one barista, then add seating and better equipment when the numbers make sense.</p>
    <div className="town-lesson"><strong>Move in for {money(CAFE_DEPOSIT + CAFE_FITOUT)}</strong><p>{money(CAFE_DEPOSIT)} refundable deposit + {money(CAFE_FITOUT)} fit-out. The fit-out has a $600 resale value. Rent is $600/month and utilities $120/month, even when closed.</p><p>While open: $600/month for one barista, plus $2 for every cup stocked. First bills and sales arrive when you advance the month. Your cart keeps trading separately.</p><p>Cash after moving in: <strong>{money(state.cash - CAFE_DEPOSIT - CAFE_FITOUT)}</strong>. Keep money for personal bills and the café’s opening stock and wages.</p></div>
    {!canLeaseCafe(state) && <p className="town-cafe-warning">First own a licensed cart and complete one owner’s shift. You can explore this room while working toward it.</p>}
    <button className="town-primary" disabled={locked || !canLeaseCafe(state) || state.cash < 3000} onClick={() => onAction?.({ type: 'lease' })}>Lease & fit out café · $3,000</button>
  </section>;
  const quote = quoteCafe({ ...cafe, plan }, state.month + 1), saved = JSON.stringify(plan) === JSON.stringify(cafe.plan);
  const reserve = calculateMonthlyCashFlowEstimate(state).expenses + quote.costs;
  const change = (patch: Partial<CafePlan>) => { setPlan(p => ({ ...p, ...patch })); setNotice(''); };
  const reputation = reputationOf(cafe), demandPct = Math.round((reputationDemand(reputation) - 1) * 100), shiftDone = cafe.service?.month === state.month;
  return <section className="town-cafe-panel"><p className="town-eyebrow">YOUR CAFÉ · MONTHLY MANAGEMENT</p><h3>A place of your own.</h3><p>Your saved plan repeats each month. Staff run the counter; you choose what to spend and what to charge.</p>
    <div className="town-lesson town-reputation" aria-label="Café reputation"><strong>Reputation {reputation}/100 · {reputationLabel(reputation)}</strong><div className="town-reputation-bar" role="img" aria-label={`${reputation} out of 100`}><span style={{ width: `${reputation}%` }} /></div><p>{demandPct === 0 ? 'Average: no effect on demand yet.' : `${demandPct > 0 ? '+' : ''}${demandPct}% demand next month.`} {shiftDone ? 'This month’s owner shift is already counted.' : 'A three-star owner shift lifts it by 12; a poor one costs 12. Months without you behind the counter drift it back toward 50.'}</p></div>
    <fieldset><legend>Trading</legend><div className="town-tabs"><button aria-pressed={plan.open} onClick={() => change({ open: true })}>Open</button><button aria-pressed={!plan.open} onClick={() => change({ open: false })}>Temporarily closed</button></div></fieldset>
    <fieldset disabled={!plan.open}><legend>Cup price</legend><div className="town-tabs">{([4, 6] as const).map(price => <button key={price} aria-pressed={plan.price === price} onClick={() => change({ price })}>${price} per cup</button>)}</div></fieldset>
    <fieldset disabled={!plan.open}><legend>Monthly fresh stock</legend><div className="town-tabs">{([400, 700] as const).map(stock => <button key={stock} aria-pressed={plan.stock === stock} onClick={() => change({ stock })}>{stock} cups · ${stock * 2}</button>)}</div></fieldset>
    <fieldset disabled={!plan.open}><legend>Staff</legend><div className="town-tabs"><button aria-pressed={!plan.helper} onClick={() => change({ helper: false })}>One barista · $600</button><button aria-pressed={plan.helper} onClick={() => change({ helper: true })}>Two staff · $1,000</button></div></fieldset>
    <div className="town-lesson"><strong>Next month: {quote.rainy ? 'rain & lighter foot traffic' : 'busy market days'}</strong><p>{quote.demand} potential buyers · capacity {quote.capacity} cups. Forecast: <strong>{quote.sold} sales, {money(quote.profit)} {quote.profit < 0 ? 'loss' : 'profit'}</strong>.</p><p>{money(quote.costs)} total operating costs. Break even at {Math.ceil(quote.costs / plan.price)} cups sold. {quote.stock - quote.sold} cups’ worth of stock would be wasted.</p><p>This teaching forecast uses fixed demand so you can see each decision’s effect. Prices, staffing and upgrades do not guarantee profit.</p></div>
    {state.cash < reserve && <p className="town-cafe-warning">Thin cash reserve: {money(reserve)} would cover one month of personal bills plus café costs before sales arrive. You have {money(state.cash)}.</p>}
    <button className="town-primary" disabled={locked || saved} onClick={() => { onAction?.({ type: 'plan', plan }); setNotice('Plan saved. It takes effect next month.'); }}>{saved ? 'Next month’s plan saved' : 'Save next month’s plan'}</button>
    {notice && <p role="status" className="town-receipt">{notice}</p>}
    <h4>Make the space yours</h4>{!saved && <p className="town-small">Save the plan before installing upgrades.</p>}<div className="town-cafe-upgrades">{(['seats', 'machine'] as const).map(upgrade => <article key={upgrade}><strong>{upgrade === 'seats' ? 'Cosy seating' : 'Espresso machine'}</strong><p>{upgrade === 'seats' ? '+80 potential buyers/month. Tables and chairs appear in your shop.' : '+150 cups of monthly capacity. A larger machine appears behind the counter.'}</p><button disabled={locked || !saved || cafe[upgrade] || state.cash < CAFE_UPGRADES[upgrade]} onClick={() => onAction?.({ type: 'upgrade', upgrade })}>{cafe[upgrade] ? 'Installed ✓' : `Install · ${money(CAFE_UPGRADES[upgrade])}`}</button></article>)}</div>
    {cafe.lastReceipt ? <CafeLedger receipt={cafe.lastReceipt} /> : <p className="town-small">Your first trading receipt arrives next month.</p>}
    <button className="town-primary" disabled={disabled || !saved} onClick={onNextMonth}>Review next month →</button>{!saved && <p>Save your plan before advancing.</p>}
    <p className="town-small">Deposit and equipment resale worth {money(cafeValue(cafe))} are included in net worth. Closing recovers that amount; fit-out losses are real.</p>
    {confirmClose ? <div className="town-lesson"><strong>End the lease for {money(cafeValue(cafe))} back?</strong><p>The café closes and its future bills stop. You lose this fit-out and its upgrades. Your cart stays yours.</p><button disabled={locked} onClick={() => onAction?.({ type: 'close' })}>End lease & return keys</button><button onClick={() => setConfirmClose(false)}>Keep my café</button></div> : <button className="town-text-button" disabled={locked} onClick={() => setConfirmClose(true)}>Consider ending the lease</button>}
  </section>;
}
