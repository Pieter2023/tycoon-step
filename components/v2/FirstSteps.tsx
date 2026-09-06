import React from 'react';
import { GameState } from '../../types';
import { REPAIR_COST, REPAIR_LOAN_PAYMENT } from '../../services/firstSteps';

type Props = { state: GameState; onChoose: (choice: 'cash' | 'loan') => void; onReview: () => void; onInvest: () => void; onNextMonth: () => void; disabled: boolean };
export default function FirstSteps({ state, onChoose, onReview, onInvest, onNextMonth, disabled }: Props) {
  const journey = state.firstSteps;
  if (!journey || journey.reviewed) return null;
  const awaitingMonth = journey.repairChoice && state.month <= (journey.repairMonth ?? state.month);
  return <section className="tycoon-panel p-4 sm:p-6 border-emerald-400/30" aria-label="First steps mission">
    <p className="text-sm text-emerald-300">First steps · {journey.repairChoice ? awaitingMonth ? '2 of 3' : '3 of 3' : '1 of 3'}</p>
    <h2 className="mt-2 text-2xl font-bold text-white">{!journey.repairChoice ? 'A surprise bill. Your first decision.' : awaitingMonth ? 'See your decision through a month.' : 'You handled your first setback.'}</h2>
    {!journey.repairChoice ? <>
      <p className="mt-3 text-sm leading-6 text-slate-200">Your car needs a $400 repair. Pay from your reserve or borrow to keep cash available. Both choices repair the car; the trade-off is cash now versus repayments later.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button disabled={disabled || state.cash < REPAIR_COST} onClick={() => onChoose('cash')} className="rounded-xl bg-emerald-400 p-4 text-left text-slate-950 disabled:opacity-40">
          <strong className="block">Pay $400 from cash</strong><span className="mt-1 block text-sm">${Math.max(0, state.cash - REPAIR_COST).toLocaleString()} cash left · no interest</span>
        </button>
        <button disabled={disabled} onClick={() => onChoose('loan')} className="rounded-xl border border-slate-600 p-4 text-left text-white disabled:opacity-40">
          <strong className="block">Borrow $400 for the repair</strong><span className="mt-1 block text-sm">15% APR · ${REPAIR_LOAN_PAYMENT.toFixed(2)}/mo for 12 months · ${(REPAIR_LOAN_PAYMENT * 12 - REPAIR_COST).toFixed(2)} interest</span>
        </button>
      </div>
    </> : <>
      <p className="mt-3 text-sm leading-6 text-slate-200">{journey.repairChoice === 'cash'
        ? 'Using your reserve avoided interest. Rebuild it before committing too much to investments.'
        : 'Borrowing preserved your cash, but repayments reduce future spending room. You can repay the loan early in Money → Bank.'}</p>
      <p className="mt-2 text-sm text-slate-400">{awaitingMonth ? 'Choose a monthly action below, then advance to see your income and costs.' : 'Next goal: build $2,000 of additional reserves without funding it with new debt. When investing, keep at least one month of expenses in cash.'}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {awaitingMonth ? <button disabled={disabled} onClick={onNextMonth} className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-40">Preview next month</button>
          : <><button disabled={disabled} onClick={onReview} className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-40">Continue building my buffer</button><button disabled={disabled} onClick={() => { onReview(); onInvest(); }} className="rounded-lg border border-slate-600 px-4 py-3 text-white disabled:opacity-40">Compare first investments</button></>}
      </div>
    </>}
    <p className="mt-3 text-xs text-slate-400">This choice changes your actual game balance. Fictional prices and rates are used for learning.</p>
  </section>;
}
