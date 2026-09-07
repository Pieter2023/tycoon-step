import { useI18n } from '../../i18n';
import React from 'react';
import { GameState } from '../../types';
import { REPAIR_COST, REPAIR_LOAN_PAYMENT } from '../../services/firstSteps';

type Props = { state: GameState; onChoose: (choice: 'cash' | 'loan') => void; onReview: () => void; onInvest: () => void; onNextMonth: () => void; disabled: boolean };
export default function FirstSteps({ state, onChoose, onReview, onInvest, onNextMonth, disabled }: Props) {
  const { t } = useI18n();
  const journey = state.firstSteps;
  if (!journey || journey.reviewed) return null;
  const awaitingMonth = journey.repairChoice && state.month <= (journey.repairMonth ?? state.month);
  return <section className="tycoon-panel p-4 sm:p-6 border-emerald-400/30" aria-label={t('shell.firstSteps.first_steps_mission')}>
    <p className="text-sm text-emerald-300">{t('shell.firstSteps.first_steps')} · {t('shell.firstSteps.step_of', { step: journey.repairChoice ? (awaitingMonth ? 2 : 3) : 1, total: 3 })}</p>
    <h2 className="mt-2 text-2xl font-bold text-white">{!journey.repairChoice ? t('shell.firstSteps.a_surprise_bill_your_first') : awaitingMonth ? t('shell.firstSteps.see_your_decision_through_a') : t('shell.firstSteps.you_handled_your_first_setback')}</h2>
    {!journey.repairChoice ? <>
      <p className="mt-3 text-sm leading-6 text-slate-200">{t('shell.firstSteps.car_repair_body')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button disabled={disabled || state.cash < REPAIR_COST} onClick={() => onChoose('cash')} className="rounded-xl bg-emerald-400 p-4 text-left text-slate-950 disabled:opacity-40">
          <strong className="block">{t('shell.firstSteps.pay_400_from_cash')}</strong><span className="mt-1 block text-sm">${t('shell.firstSteps.cash_left_no_interest', { cash: Math.max(0, state.cash - REPAIR_COST).toLocaleString() })}</span>
        </button>
        <button disabled={disabled} onClick={() => onChoose('loan')} className="rounded-xl border border-slate-600 p-4 text-left text-white disabled:opacity-40">
          <strong className="block">{t('shell.firstSteps.borrow_400_for_the_repair')}</strong><span className="mt-1 block text-sm">{t('shell.firstSteps.loan_terms', { payment: REPAIR_LOAN_PAYMENT.toFixed(2), interest: (REPAIR_LOAN_PAYMENT * 12 - REPAIR_COST).toFixed(2) })}</span>
        </button>
      </div>
    </> : <>
      <p className="mt-3 text-sm leading-6 text-slate-200">{journey.repairChoice === 'cash'
        ? t('shell.firstSteps.using_your_reserve_avoided_interest')
        : t('shell.firstSteps.borrowing_preserved_your_cash_but')}</p>
      <p className="mt-2 text-sm text-slate-400">{awaitingMonth ? t('shell.firstSteps.choose_a_monthly_action_below') : t('shell.firstSteps.next_goal_build_2_000')}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {awaitingMonth ? <button disabled={disabled} onClick={onNextMonth} className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-40">{t('shell.firstSteps.preview_next_month')}</button>
          : <><button disabled={disabled} onClick={onReview} className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-40">{t('shell.firstSteps.continue_building_my_buffer')}</button><button disabled={disabled} onClick={() => { onReview(); onInvest(); }} className="rounded-lg border border-slate-600 px-4 py-3 text-white disabled:opacity-40">{t('shell.firstSteps.compare_first_investments')}</button></>}
      </div>
    </>}
    <p className="mt-3 text-xs text-slate-400">{t('shell.firstSteps.this_choice_changes_your_actual')}</p>
  </section>;
}
