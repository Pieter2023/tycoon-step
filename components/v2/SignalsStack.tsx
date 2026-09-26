import React, { useMemo, useState } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { AlertTriangle, Bot, ChevronRight, CreditCard, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Modal from '../Modal';
import { GameState } from '../../types';
import { useI18n, type Translate } from '../../i18n';
import { CAREER_PATHS } from '../../constants';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';

type SignalsStackProps = {
  gameState: GameState;
  creditScore: number;
  creditTier: string;
  getCreditTierColor: (tier: string) => string;
  aiImpact: { automationRisk?: string } | undefined;
  careerPath: string;
  getAIRiskColor: (risk: string) => string;
};

const getEconomyTone = (t: Translate, trend?: string, recession?: boolean) => {
  if (recession) return t('shell.signalsStack.volatile');
  if (trend === 'BEAR' || trend === 'CRASH') return t('shell.signalsStack.volatile');
  return t('shell.signalsStack.stable');
};

const MEDALLION = {
  green: 'bg-[#30d158]/[0.16] text-[#30d158]',
  purple: 'bg-[#bf5af2]/[0.18] text-[#da8fff]',
  blue: 'bg-[#0a84ff]/[0.2] text-[#409cff]',
  red: 'bg-[#ff453a]/[0.16] text-[#ff6961]'
};

const Medallion: React.FC<{ tone: string; large?: boolean; children: React.ReactNode }> = ({ tone, large, children }) => (
  <span aria-hidden className={`flex shrink-0 items-center justify-center ${large ? 'h-11 w-11 rounded-[13px]' : 'h-9 w-9 rounded-[10px]'} ${tone}`}>{children}</span>
);

/** Recharts tooltip as a dark material, matching the dashboard's charts. */
const tooltipStyle = {
  contentStyle: {
    background: 'rgba(44, 44, 46, 0.86)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    boxShadow: '0 12px 32px -12px rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 12,
    padding: '8px 12px'
  },
  labelStyle: { color: '#aeaeb2', fontSize: 11 },
  itemStyle: { color: '#fff', fontVariantNumeric: 'tabular-nums' as const }
};

/** Sheet header: a large tinted medallion, the title, and one line of context. */
const SheetHeader: React.FC<{ tone: string; icon: React.ReactNode; title: string; body: string }> = ({ tone, icon, title, body }) => (
  <motion.div variants={riseIn} className="flex items-start gap-3.5">
    <Medallion tone={tone} large>{icon}</Medallion>
    <div className="min-w-0 pt-0.5">
      <h3 className="text-[22px] font-bold leading-7 tracking-[-0.018em] text-white [font-family:var(--font-display)]">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-400">{body}</p>
    </div>
  </motion.div>
);

/** Sheet content assembles with a short stagger after the sheet itself slides in. */
const sheetMotion = {
  variants: stagger(0.05, 0.08),
  initial: MOTION_DISABLED ? (false as const) : 'hidden',
  animate: 'show'
};

const SignalsStack: React.FC<SignalsStackProps> = ({
  gameState,
  creditScore,
  creditTier,
  getCreditTierColor,
  aiImpact,
  careerPath,
  getAIRiskColor
}) => {
  const { t, formatPercent } = useI18n();
  const reduce = useReducedMotionConfig();
  const [activeSignal, setActiveSignal] = useState<null | 'credit' | 'ai' | 'economy'>(null);
  const economy = gameState.economy;
  const economyTone = getEconomyTone(t, economy?.marketTrend, economy?.recession);
  const disruption = gameState.aiDisruption?.disruptionLevel || 0;
  const marketTone = economy?.marketTrend === 'BULL' || economy?.marketTrend === 'BOOM'
    ? 'text-[#30d158]'
    : economy?.marketTrend === 'BEAR' || economy?.marketTrend === 'CRASH'
      ? 'text-[#ff6961]'
      : 'text-slate-300';

  const creditHistory = useMemo(() => (gameState.creditHistory || []).slice(-12), [gameState.creditHistory]);
  const latest = creditHistory[creditHistory.length - 1];
  const previous = creditHistory[creditHistory.length - 2];
  const delta = latest && previous ? latest.score - previous.score : 0;
  const reasons = gameState.creditLastChangeReasons || latest?.reasons || [];

  const rowClass = 'list-row w-full cursor-pointer gap-3.5 py-3 text-left';

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-[19px] font-semibold leading-6 tracking-[-0.016em] text-white">{t('shell.signalsStack.signals')}</h3>
        <div className="list-group">
          <button type="button" onClick={() => setActiveSignal('credit')} className={rowClass}>
            <Medallion tone={MEDALLION.green}><CreditCard size={18} /></Medallion>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium leading-5 text-white">{t('shell.signalsStack.credit_score')}</span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">{t('shell.signalsStack.tap_for_credit_detail_and')}</span>
            </span>
            <span className={`num shrink-0 text-right text-[17px] font-semibold leading-5 ${getCreditTierColor(creditTier)}`}>
              {creditScore} <span className="block text-[11px] font-semibold leading-4 opacity-90">{creditTier}</span>
            </span>
            <ChevronRight size={17} aria-hidden className="shrink-0 text-slate-600" />
          </button>

          <button type="button" onClick={() => setActiveSignal('ai')} className={rowClass}>
            <Medallion tone={MEDALLION.purple}><Bot size={18} /></Medallion>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium leading-5 text-white">{t('shell.signalsStack.ai_disruption')}</span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">{t('shell.signalsStack.tap_for_ai_impact_breakdown')}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="num block text-[17px] font-semibold leading-5 text-white">{disruption.toFixed(0)}%</span>
              <span className={`block text-[11px] font-semibold leading-4 ${getAIRiskColor(aiImpact?.automationRisk || 'LOW')}`}>
                Risk: {aiImpact?.automationRisk || 'LOW'}
              </span>
            </span>
            <ChevronRight size={17} aria-hidden className="shrink-0 text-slate-600" />
          </button>

          <button type="button" onClick={() => setActiveSignal('economy')} className={rowClass}>
            <Medallion tone={economy?.recession ? MEDALLION.red : MEDALLION.blue}><TrendingUp size={18} /></Medallion>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium leading-5 text-white">{t('shell.signalsStack.economy')}</span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">{t('shell.signalsStack.tap_for_market_detail')}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[17px] font-semibold leading-5 text-white">{economyTone}</span>
              <span className="num block text-[11px] leading-4 text-slate-400">
                Rate: {formatPercent(economy?.interestRate || 0.065)}
              </span>
            </span>
            <ChevronRight size={17} aria-hidden className="shrink-0 text-slate-600" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={activeSignal === 'credit'}
        onClose={() => setActiveSignal(null)}
        ariaLabel={t('shell.signalsStack.credit_details')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-xl rounded-none rounded-l-3xl p-6"
      >
        <motion.div className="space-y-6" {...sheetMotion}>
          <SheetHeader
            tone={MEDALLION.green}
            icon={<CreditCard size={21} />}
            title={t('shell.signalsStack.credit_score')}
            body={t('shell.signalsStack.drivers_on_time_payments_utilization')}
          />
          <motion.div variants={riseIn} className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{t('shell.signalsStack.current_score')}</p>
              <p className={`num mt-1 text-[40px] font-bold leading-[44px] tracking-[-0.025em] [font-family:var(--font-display)] ${getCreditTierColor(creditTier)}`}>
                {creditScore} <span className="text-base font-semibold tracking-normal">{creditTier}</span>
              </p>
            </div>
            <p className={`num mb-1 rounded-full px-2.5 py-1 text-xs font-semibold ${delta >= 0 ? 'bg-[#30d158]/[0.14] text-[#30d158]' : 'bg-[#ff453a]/[0.14] text-[#ff6961]'}`}>
              {delta >= 0 ? '+' : ''}{delta} this month
            </p>
          </motion.div>
          <motion.div variants={riseIn} className="h-44 w-full min-h-[1px] min-w-[1px] rounded-2xl bg-white/[0.035] px-1 pt-3">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={creditHistory.map(entry => ({ month: entry.month, score: entry.score }))} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="creditGradientV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#30d158" stopOpacity={0.36} />
                    <stop offset="80%" stopColor="#30d158" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#30d158" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <YAxis domain={[300, 850]} hide />
                <Tooltip
                  cursor={{ stroke: 'rgba(255, 255, 255, 0.16)', strokeWidth: 1 }}
                  {...tooltipStyle}
                  formatter={(value: number) => [value, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#30d158"
                  fill="url(#creditGradientV2)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  activeDot={{ r: 4, fill: '#30d158', stroke: '#1c1c1e', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div variants={riseIn}>
            <p className="mb-2.5 text-[15px] font-semibold text-white">{t('credit.whyChanged')}</p>
            {reasons.length === 0 ? (
              <p className="text-sm text-slate-500">{t('credit.noChange')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reasons.map((reason, idx) => (
                  <span key={`${reason}-${idx}`} className="chip text-xs text-slate-200">
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </Modal>

      <Modal
        isOpen={activeSignal === 'ai'}
        onClose={() => setActiveSignal(null)}
        ariaLabel={t('shell.signalsStack.ai_disruption_details')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-xl rounded-none rounded-l-3xl p-6"
      >
        <motion.div className="space-y-6" {...sheetMotion}>
          <SheetHeader
            tone={MEDALLION.purple}
            icon={<Bot size={21} />}
            title={t('shell.signalsStack.ai_disruption')}
            body={t('shell.signalsStack.your_career_exposure_to_automation')}
          />
          <motion.div variants={riseIn}>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="text-slate-400">{t('shell.signalsStack.disruption_level')}</span>
              <span className="num text-[22px] font-bold tracking-[-0.02em] text-white">{disruption.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgb(118_118_128/0.24)]">
              {MOTION_DISABLED ? (
                <div className="h-full rounded-full bg-gradient-to-r from-[#5e5ce6] to-[#bf5af2]" style={{ width: `${disruption}%` }} />
              ) : (
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#5e5ce6] to-[#bf5af2]"
                  initial={reduce ? false : { width: '0%' }}
                  animate={{ width: `${Math.max(0, Math.min(100, disruption))}%` }}
                  transition={reduce ? { duration: 0 } : { ...springs.settle, delay: 0.2 }}
                />
              )}
            </div>
          </motion.div>
          <motion.div variants={riseIn} className="list-group">
            <div className="list-row justify-between text-sm">
              <span className="text-slate-300">{t('shell.signalsStack.your_career_risk')}</span>
              <span className={`font-semibold ${getAIRiskColor(aiImpact?.automationRisk || 'LOW')}`}>
                {aiImpact?.automationRisk || 'LOW'}
              </span>
            </div>
            <div className="list-row justify-between text-sm">
              <span className="text-slate-300">{t('shell.signalsStack.future_proof_score')}</span>
              <span className="num font-semibold text-white">{CAREER_PATHS[careerPath]?.futureProofScore || 50}%</span>
            </div>
          </motion.div>
        </motion.div>
      </Modal>

      <Modal
        isOpen={activeSignal === 'economy'}
        onClose={() => setActiveSignal(null)}
        ariaLabel={t('shell.signalsStack.economy_details')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-xl rounded-none rounded-l-3xl p-6"
      >
        <motion.div className="space-y-6" {...sheetMotion}>
          <SheetHeader
            tone={economy?.recession ? MEDALLION.red : MEDALLION.blue}
            icon={<TrendingUp size={21} />}
            title={t('shell.signalsStack.economy')}
            body={t('shell.signalsStack.macro_conditions_that_affect_asset')}
          />
          <motion.div variants={riseIn} className="list-group">
            <div className="list-row justify-between text-sm">
              <span className="text-slate-300">{t('shell.signalsStack.market')}</span>
              <span className={`font-semibold ${marketTone}`}>{economy?.marketTrend || 'STABLE'}</span>
            </div>
            <div className="list-row justify-between text-sm">
              <span className="text-slate-300">{t('shell.signalsStack.interest_rate')}</span>
              <span className="num font-semibold text-white">{formatPercent(economy?.interestRate || 0.065)}</span>
            </div>
            <div className="list-row justify-between text-sm">
              <span className="text-slate-300">{t('shell.signalsStack.inflation')}</span>
              <span className="num font-semibold text-[#ff9f0a]">{formatPercent(economy?.inflationRate || 0.03)}</span>
            </div>
          </motion.div>
          {economy?.recession && (
            <motion.div variants={riseIn} className="flex items-start gap-3 rounded-2xl bg-[#ff453a]/[0.12] p-4">
              <AlertTriangle size={18} aria-hidden className="mt-0.5 shrink-0 text-[#ff6961]" />
              <div>
                <span className="font-semibold text-[#ff6961]">{t('shell.signalsStack.recession')}</span>
                <p className="num mt-0.5 text-xs text-slate-400">{economy.recessionMonths} months remaining</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Modal>
    </>
  );
};

export default SignalsStack;
