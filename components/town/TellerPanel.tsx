import React, { useState } from 'react';
import { GameState } from '../../types';
import { BankTransfer, savingsBalance } from '../../services/townActivities';
import { calculateMonthlyCashFlowEstimate } from '../../services/gameLogic';
export type TownLoan = { id: string; name: string; amount: number; rate: number; term: number };
const money = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export default function TellerPanel({state,disabled,onTransfer,loans,onLoans,onReserve,onBusiness}:{state:GameState;disabled:boolean;onTransfer?:(transfer:BankTransfer)=>void;loans:TownLoan[];onLoans:()=>void;onReserve:()=>void;onBusiness:()=>void}) {
  const [tab,setTab]=useState<'savings'|'loans'>('savings');
  const [direction,setDirection]=useState<'deposit'|'withdraw'>('deposit');
  const [amount,setAmount]=useState('500');
  const cashFlow=calculateMonthlyCashFlowEstimate(state), savings=savingsBalance(state), value=Number(amount);
  const valid=Number.isSafeInteger(value)&&value>0&&value<=(direction==='deposit'?state.cash:savings);
  const after=state.cash+(direction==='deposit'?-value:value);
  const latest=state.events[0];
  const confirmed=!!state.townProgress?.reserveConfirmed;
  // The mission step sits first until it is done; afterwards it becomes the "next" pointer below the transfer tools.
  const reserveBlock=<div className="town-lesson"><strong>Your cash safety net: {money(cashFlow.expenses)}</strong><p>Keep one month's expenses in spending cash for this mission. Savings remains accessible, but bills use spending cash.</p>{!confirmed?<button className="town-primary" disabled={disabled||state.cash<cashFlow.expenses} onClick={onReserve}>Confirm my cash reserve</button>:<><p>✓ Reserve plan confirmed. Check it again after each purchase.</p><button className="town-primary" onClick={onBusiness}>Next: visit your business →</button></>}</div>;
  return <>
    <p className="town-eyebrow">COMMUNITY BANK · TELLER</p><h3>Hello, neighbour.</h3>
    <p className="town-intro">Let's give your money a job—and leave enough for life.</p>
    {!confirmed&&reserveBlock}
    <div className="town-tabs" aria-label="Teller services"><button aria-pressed={tab==='savings'} onClick={()=>setTab('savings')}>Cash & savings</button><button aria-pressed={tab==='loans'} onClick={()=>setTab('loans')}>Compare loans</button></div>
    {tab==='savings'?<>
      <div className="town-account-balances"><div><span>Spending cash</span><strong>{money(state.cash)}</strong></div><div><span>Accessible savings</span><strong>{money(savings)}</strong></div></div>
      <p className="town-small">Savings uses your existing High-Yield Savings holdings. Transfers change where money sits, not your wealth. Interest arrives with the monthly simulation.</p>
      <div className="town-tabs"><button aria-pressed={direction==='deposit'} onClick={()=>setDirection('deposit')}>Deposit</button><button aria-pressed={direction==='withdraw'} onClick={()=>setDirection('withdraw')}>Withdraw</button></div>
      <label className="town-field">Amount in dollars<input type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} /></label>
      {valid?<p className="town-small">Spending cash after: <strong>{money(after)}</strong>{after<cashFlow.expenses&&<span className="town-caution">Below one month's expenses ({money(cashFlow.expenses)}). Withdraw savings before paying bills if needed.</span>}</p>:<p className="town-small">Enter a whole-dollar amount within your {direction==='deposit'?'cash':'savings'} balance.</p>}
      <button className="town-primary" disabled={disabled||!valid||!onTransfer} onClick={()=>onTransfer?.({direction,amount:value})}>{direction==='deposit'?'Deposit to savings':'Withdraw to cash'}</button>
      {latest&&['Savings deposit','Savings withdrawal'].includes(latest.title)&&<p className="town-receipt" role="status">{latest.description}</p>}
      {confirmed&&reserveBlock}
    </>:<>
      <div className="town-lesson"><strong>Borrowing adds cash and debt together.</strong><p>A bigger balance is not profit. Compare the payment against your monthly surplus of {money(cashFlow.income-cashFlow.expenses)}. Approval is assessed when you apply.</p></div>
      {loans.map(loan=>{const r=loan.rate/12;const payment=r?Math.round(loan.amount*r/(1-Math.pow(1+r,-loan.term))):loan.amount/loan.term;return <article className="town-offer" key={loan.id}><h4>{loan.name}</h4><p>{money(loan.amount)} · {(loan.rate*100).toFixed(1)}% APR · {loan.term} months</p><p><strong>{money(payment)}/month</strong> · approximately {money(payment*loan.term-loan.amount)} total interest.</p><p>Monthly surplus after payment: <strong>{money(cashFlow.income-cashFlow.expenses-payment)}</strong></p></article>;})}
      <button className="town-primary" disabled={disabled} onClick={onLoans}>Review a loan application →</button>
    </>}
  </>;
}
