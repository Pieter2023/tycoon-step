import { useI18n } from '../../i18n';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronRight, Flag, Info, Landmark, LineChart, Wallet } from 'lucide-react';
import { GameState } from '../../types';
import { REPAIR_COST, REPAIR_LOAN_PAYMENT } from '../../services/firstSteps';
import { MOTION_DISABLED, riseIn, stagger } from '../ui/motion';

type Props = { state: GameState; onChoose: (choice: 'cash' | 'loan') => void; onReview: () => void; onInvest: () => void; onNextMonth: () => void; disabled: boolean };

const TOTAL_STEPS = 3;

/** Three short segments that fill as the mission advances. */
const StepPips: React.FC<{ step: number }> = ({ step }) => (
  <span aria-hidden className="flex items-center gap-1">
    {Array.from({ length: TOTAL_STEPS }, (_, index) => (
      <span
        key={index}
        className={`h-1 w-5 rounded-full transition-colors duration-500 ${index < step ? 'bg-[#30d158]' : 'bg-[rgb(118_118_128/0.3)]'}`}
      />
    ))}
  </span>
);

/**
 * The first-steps mission on a brand-new game: a surprise bill and the player's first real decision,
 * then a month to see it through. Each step assembles with a short stagger when it arrives.
 */
export default function FirstSteps({ state, onChoose, onReview, onInvest, onNextMonth, disabled }: Props) {
  const { t } = useI18n();
  const journey = state.firstSteps;
  if (!journey || journey.reviewed) return null;
  const awaitingMonth = journey.repairChoice && state.month <= (journey.repairMonth ?? state.month);
  const step = journey.repairChoice ? (awaitingMonth ? 2 : 3) : 1;
  const paidCash = journey.repairChoice === 'cash';

  return <section className="surface relative overflow-hidden border-[#30d158]/[0.22] p-5 sm:p-7" aria-label={t('shell.firstSteps.first_steps_mission')}>
    {/* A soft green light from the top-left: this is the one thing to do right now. */}
    <div aria-hidden className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#30d158]/[0.14] blur-3xl" />
    <div aria-hidden className="pointer-events-none absolute -right-28 -bottom-40 h-80 w-80 rounded-full bg-[#64d2ff]/[0.05] blur-3xl" />

    <motion.div
      key={step}
      className="relative"
      variants={stagger(0.05)}
      initial={MOTION_DISABLED ? false : 'hidden'}
      animate="show"
    >
      <motion.div variants={riseIn} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="eyebrow text-[#30d158]"><Flag size={14} aria-hidden />{t('shell.firstSteps.first_steps')} · {t('shell.firstSteps.step_of', { step, total: TOTAL_STEPS })}</p>
        <StepPips step={step} />
      </motion.div>

      <motion.h2 variants={riseIn} className="mt-2.5 text-[24px] font-bold leading-[30px] tracking-[-0.021em] text-white [font-family:var(--font-display)] [text-wrap:balance] sm:text-[30px] sm:leading-9">
        {!journey.repairChoice ? t('shell.firstSteps.a_surprise_bill_your_first') : awaitingMonth ? t('shell.firstSteps.see_your_decision_through_a') : t('shell.firstSteps.you_handled_your_first_setback')}
      </motion.h2>

      {!journey.repairChoice ? <>
        <motion.p variants={riseIn} className="mt-3 max-w-3xl text-[15px] leading-6 text-slate-300">{t('shell.firstSteps.car_repair_body')}</motion.p>
        <motion.div variants={stagger(0.06)} className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* The recommended choice: a filled green option card. */}
          <motion.button
            variants={riseIn}
            type="button"
            disabled={disabled || state.cash < REPAIR_COST}
            onClick={() => onChoose('cash')}
            className="surface-interactive group relative flex min-h-[92px] items-center gap-4 overflow-hidden rounded-[20px] bg-[#30d158] p-4 text-left text-[#03170a] shadow-[inset_0_1px_0_rgb(255_255_255/0.32),0_16px_36px_-16px_rgb(48_209_88/0.75)] hover:-translate-y-0.5 hover:bg-[#3ddc65] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:p-5"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.14] to-transparent" />
            <span aria-hidden className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/[0.14]"><Wallet size={20} /></span>
            <span className="relative min-w-0 flex-1">
              <strong className="block text-[17px] font-semibold leading-[22px] tracking-[-0.013em]">{t('shell.firstSteps.pay_400_from_cash')}</strong>
              <span className="num mt-0.5 block text-sm text-black/65">${t('shell.firstSteps.cash_left_no_interest', { cash: Math.max(0, state.cash - REPAIR_COST).toLocaleString() })}</span>
            </span>
            <ChevronRight size={20} aria-hidden className="relative shrink-0 opacity-50 transition-transform duration-300 ease-spring group-hover:translate-x-0.5" />
          </motion.button>

          {/* The alternative: a gray-fill material card of equal size, quieter ink. */}
          <motion.button
            variants={riseIn}
            type="button"
            disabled={disabled}
            onClick={() => onChoose('loan')}
            className="surface-interactive group relative flex min-h-[92px] items-center gap-4 rounded-[20px] border border-white/[0.08] bg-[rgb(118_118_128/0.16)] p-4 text-left text-white hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-[rgb(118_118_128/0.24)] disabled:cursor-not-allowed disabled:opacity-40 sm:p-5"
          >
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#64d2ff]/[0.16] text-[#64d2ff]"><Landmark size={20} /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[17px] font-semibold leading-[22px] tracking-[-0.013em]">{t('shell.firstSteps.borrow_400_for_the_repair')}</strong>
              <span className="num mt-0.5 block text-sm text-slate-400">{t('shell.firstSteps.loan_terms', { payment: REPAIR_LOAN_PAYMENT.toFixed(2), interest: (REPAIR_LOAN_PAYMENT * 12 - REPAIR_COST).toFixed(2) })}</span>
            </span>
            <ChevronRight size={20} aria-hidden className="shrink-0 text-slate-500 transition-transform duration-300 ease-spring group-hover:translate-x-0.5" />
          </motion.button>
        </motion.div>
      </> : <>
        {/* What the choice did, as a quiet callout marked with its colour. */}
        <motion.div variants={riseIn} className="mt-4 flex max-w-3xl items-start gap-3 rounded-2xl bg-white/[0.045] p-4">
          <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${paidCash ? 'bg-[#30d158]/[0.16] text-[#30d158]' : 'bg-[#64d2ff]/[0.16] text-[#64d2ff]'}`}>
            {paidCash ? <CheckCircle2 size={17} /> : <Landmark size={16} />}
          </span>
          <p className="text-[15px] leading-6 text-slate-200">{paidCash
            ? t('shell.firstSteps.using_your_reserve_avoided_interest')
            : t('shell.firstSteps.borrowing_preserved_your_cash_but')}</p>
        </motion.div>
        <motion.p variants={riseIn} className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{awaitingMonth ? t('shell.firstSteps.choose_a_monthly_action_below') : t('shell.firstSteps.next_goal_build_2_000')}</motion.p>
        <motion.div variants={riseIn} className="mt-5 flex flex-wrap gap-3">
          {awaitingMonth ? <button type="button" disabled={disabled} onClick={onNextMonth} className="btn-primary ds-button--lg group w-full sm:w-auto">{t('shell.firstSteps.preview_next_month')}<ArrowRight size={17} aria-hidden className="transition-transform duration-300 ease-spring group-hover:translate-x-0.5" /></button>
            : <>
              <button type="button" disabled={disabled} onClick={onReview} className="btn-primary ds-button--lg group w-full sm:w-auto">{t('shell.firstSteps.continue_building_my_buffer')}<ArrowRight size={17} aria-hidden className="transition-transform duration-300 ease-spring group-hover:translate-x-0.5" /></button>
              <button type="button" disabled={disabled} onClick={() => { onReview(); onInvest(); }} className="btn-secondary ds-button--lg w-full sm:w-auto"><LineChart size={17} aria-hidden className="text-[#64d2ff]" />{t('shell.firstSteps.compare_first_investments')}</button>
            </>}
        </motion.div>
      </>}

      <motion.p variants={riseIn} className="mt-4 flex items-start gap-1.5 text-xs leading-4 text-slate-500">
        <Info size={13} aria-hidden className="mt-px shrink-0" />{t('shell.firstSteps.this_choice_changes_your_actual')}
      </motion.p>
    </motion.div>
  </section>;
}
