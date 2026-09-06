import React, {useState} from 'react';
import {GameState} from '../../types';
import {CartPlan, quoteCartShift} from '../../services/townActivities';
const money=(n:number)=>`${n<0?'−':''}$${Math.abs(n)}`;
export default function CartShiftPanel({state,disabled,onRun}:{state:GameState;disabled:boolean;onRun?:(plan:CartPlan)=>void}){
  const [price,setPrice]=useState<3|5>(5),[stock,setStock]=useState<12|24>(12);
  const quote=quoteCartShift(state,{price,stock}),receipt=state.townProgress?.lastShift;
  const complete=receipt?.month===state.month;
  return <section className="town-shift">
    <p className="town-eyebrow">AT YOUR CART · OWNER'S SHIFT</p><h3>{complete?'You traded. What did you keep?':'Open for an afternoon.'}</h3>
    <p className="town-intro">One extra pop-up shift each month. You choose the price and fresh stock; a customer visit plays out in the square.</p>
    {complete&&receipt?<div className="town-recap"><h4>Month {receipt.month} · {receipt.weather}</h4><dl><div><dt>Cups sold</dt><dd>{receipt.sold} / {receipt.stock}</dd></div><div><dt>Sales</dt><dd>{money(receipt.revenue)}</dd></div><div><dt>Supplies ($2 per cup stocked)</dt><dd>−${receipt.stock*2}</dd></div><div><dt>Shift staffing & stall fee</dt><dd>−$18</dd></div><div><dt>{receipt.profit<0?'Loss deducted from cash':'Profit added to cash'}</dt><dd>{money(receipt.profit)}</dd></div></dl><p>{receipt.stock-receipt.sold} unsold cups' worth of fresh supplies were wasted. Sales are not profit: you paid for every cup stocked.</p><p>This extra shift is already included in your cash. Regular monthly cart profit is separate. Review next month to unlock another shift.</p></div>:<>
      <div className="town-lesson"><strong>{quote.weather}</strong><p>{state.month%3===0?'Foot traffic is lower. Weather cover helps demand, but fresh stock can still go unsold.':'Market visitors are passing by. Higher prices mean fewer buyers in this teaching example.'}</p></div>
      <fieldset><legend>1. Set your cup price</legend><div className="town-tabs">{([3,5] as const).map(n=><button key={n} aria-pressed={price===n} onClick={()=>setPrice(n)}>${n} per cup</button>)}</div></fieldset>
      <fieldset><legend>2. Choose fresh stock</legend><div className="town-tabs">{([12,24] as const).map(n=><button key={n} aria-pressed={stock===n} onClick={()=>setStock(n)}>{n} cups · ${n*2}</button>)}</div></fieldset>
      <div className="town-lesson"><strong>Commit ${quote.costs} before opening</strong><p>${stock*2} supplies + $18 shift costs. Break even at {Math.ceil(quote.costs/price)} cups sold{Math.ceil(quote.costs/price)>stock?'—more than you have stocked. This plan cannot make a profit.':'.'} Unsold supplies cannot be refunded.</p><p>Teaching forecast: {quote.sold} sales, {money(quote.profit)} {quote.profit<0?'loss':'profit'}. This preview uses fixed demand to make the trade-off visible.</p></div>
      <button className="town-primary" disabled={disabled||state.cash<quote.costs||!onRun} onClick={()=>onRun?.({price,stock})}>Open pop-up shift · commit ${quote.costs}</button>
      <p className="town-small">Extra owner-run activity, separate from regular monthly operations. Opening settles the shift once, including any loss.</p>
    </>}
  </section>;
}
