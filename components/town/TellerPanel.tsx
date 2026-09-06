import React, { useState } from 'react';
import { tl } from '../../i18n/town';
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
  const reserveBlock=<div className="town-lesson"><strong>{tl('Your cash safety net','Tu red de seguridad en efectivo')}: {money(cashFlow.expenses)}</strong><p>{tl('Keep one month\'s expenses in spending cash for this mission. Savings remains accessible, but bills use spending cash.','Mantén un mes de gastos en efectivo disponible para esta misión. Los ahorros siguen accesibles, pero las facturas se pagan con el efectivo.')}</p>{!confirmed?<button className="town-primary" disabled={disabled||state.cash<cashFlow.expenses} onClick={onReserve}>{tl('Confirm my cash reserve','Confirmar mi reserva de efectivo')}</button>:<><p>{tl('✓ Reserve plan confirmed. Check it again after each purchase.','✓ Plan de reserva confirmado. Revísalo de nuevo después de cada compra.')}</p><button className="town-primary" onClick={onBusiness}>{tl('Next: visit your business →','Siguiente: visita tu negocio →')}</button></>}</div>;
  return <>
    <p className="town-eyebrow">{tl('COMMUNITY BANK · TELLER','BANCO COMUNITARIO · CAJERO')}</p><h3>{tl('Hello, neighbour.','Hola, vecino.')}</h3>
    <p className="town-intro">{tl('Let\'s give your money a job—and leave enough for life.','Démosle un trabajo a tu dinero, y dejemos suficiente para vivir.')}</p>
    {!confirmed&&reserveBlock}
    <div className="town-tabs" aria-label={tl('Teller services','Servicios del cajero')}><button aria-pressed={tab==='savings'} onClick={()=>setTab('savings')}>{tl('Cash & savings','Efectivo y ahorros')}</button><button aria-pressed={tab==='loans'} onClick={()=>setTab('loans')}>{tl('Compare loans','Comparar préstamos')}</button></div>
    {tab==='savings'?<>
      <div className="town-account-balances"><div><span>{tl('Spending cash','Efectivo disponible')}</span><strong>{money(state.cash)}</strong></div><div><span>{tl('Accessible savings','Ahorros accesibles')}</span><strong>{money(savings)}</strong></div></div>
      <p className="town-small">{tl('Savings uses your existing High-Yield Savings holdings. Transfers change where money sits, not your wealth. Interest arrives with the monthly simulation.','Los ahorros usan tu cuenta de ahorro de alto rendimiento. Las transferencias cambian dónde está el dinero, no tu patrimonio. Los intereses llegan con la simulación mensual.')}</p>
      <div className="town-tabs"><button aria-pressed={direction==='deposit'} onClick={()=>setDirection('deposit')}>{tl('Deposit','Depositar')}</button><button aria-pressed={direction==='withdraw'} onClick={()=>setDirection('withdraw')}>{tl('Withdraw','Retirar')}</button></div>
      <label className="town-field">{tl('Amount in dollars','Monto en dólares')}<input type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} /></label>
      {valid?<p className="town-small">{tl('Spending cash after','Efectivo después')}: <strong>{money(after)}</strong>{after<cashFlow.expenses&&<span className="town-caution">{tl('Below one month\'s expenses','Por debajo de un mes de gastos')} ({money(cashFlow.expenses)}). {tl('Withdraw savings before paying bills if needed.','Retira ahorros antes de pagar facturas si hace falta.')}</span>}</p>:<p className="town-small">{tl('Enter a whole-dollar amount within your','Ingresa un monto entero dentro de tu saldo de')} {direction==='deposit'?tl('cash','efectivo'):tl('savings','ahorros')}{tl(' balance.','.')}</p>}
      <button className="town-primary" disabled={disabled||!valid||!onTransfer} onClick={()=>onTransfer?.({direction,amount:value})}>{direction==='deposit'?tl('Deposit to savings','Depositar en ahorros'):tl('Withdraw to cash','Retirar a efectivo')}</button>
      {latest&&['Savings deposit','Savings withdrawal'].includes(latest.title)&&<p className="town-receipt" role="status">{latest.description}</p>}
      {confirmed&&reserveBlock}
    </>:<>
      <div className="town-lesson"><strong>{tl('Borrowing adds cash and debt together.','Pedir prestado suma efectivo y deuda a la vez.')}</strong><p>{tl('A bigger balance is not profit. Compare the payment against your monthly surplus of','Un saldo mayor no es ganancia. Compara la cuota con tu excedente mensual de')} {money(cashFlow.income-cashFlow.expenses)}. {tl('Approval is assessed when you apply.','La aprobación se evalúa al solicitarlo.')}</p></div>
      {loans.map(loan=>{const r=loan.rate/12;const payment=r?Math.round(loan.amount*r/(1-Math.pow(1+r,-loan.term))):loan.amount/loan.term;return <article className="town-offer" key={loan.id}><h4>{loan.name}</h4><p>{money(loan.amount)} · {(loan.rate*100).toFixed(1)}% {tl('APR','TAE')} · {loan.term} {tl('months','meses')}</p><p><strong>{money(payment)}/{tl('month','mes')}</strong> · {tl('approximately','aproximadamente')} {money(payment*loan.term-loan.amount)} {tl('total interest.','de interés total.')}</p><p>{tl('Monthly surplus after payment','Excedente mensual después de la cuota')}: <strong>{money(cashFlow.income-cashFlow.expenses-payment)}</strong></p></article>;})}
      <button className="town-primary" disabled={disabled} onClick={onLoans}>{tl('Review a loan application →','Revisar una solicitud de préstamo →')}</button>
    </>}
  </>;
}
