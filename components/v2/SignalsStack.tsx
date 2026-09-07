import React, { useMemo, useState } from 'react';
import { Bot, CreditCard, TrendingUp } from 'lucide-react';
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
  const [activeSignal, setActiveSignal] = useState<null | 'credit' | 'ai' | 'economy'>(null);
  const economy = gameState.economy;
  const economyTone = getEconomyTone(t, economy?.marketTrend, economy?.recession);

  const creditHistory = useMemo(() => (gameState.creditHistory || []).slice(-12), [gameState.creditHistory]);
  const latest = creditHistory[creditHistory.length - 1];
  const previous = creditHistory[creditHistory.length - 2];
  const delta = latest && previous ? latest.score - previous.score : 0;
  const reasons = gameState.creditLastChangeReasons || latest?.reasons || [];

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{t('shell.signalsStack.signals')}</h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setActiveSignal('credit')}
            className="w-full glass-tile p-4 text-left hover:border-emerald-400/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{t('shell.signalsStack.credit_score')}</p>
                <p className={`text-lg font-semibold ${getCreditTierColor(creditTier)}`}>
                  {creditScore} <span className="text-xs font-semibold">{creditTier}</span>
                </p>
              </div>
              <CreditCard size={18} className="text-emerald-300" />
            </div>
            <p className="mt-2 text-xs text-slate-400">{t('shell.signalsStack.tap_for_credit_detail_and')}</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSignal('ai')}
            className="w-full glass-tile p-4 text-left hover:border-purple-400/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{t('shell.signalsStack.ai_disruption')}</p>
                <p className="text-lg font-semibold text-white">
                  {(gameState.aiDisruption?.disruptionLevel || 0).toFixed(0)}%
                </p>
                <p className={`text-xs ${getAIRiskColor(aiImpact?.automationRisk || 'LOW')}`}>
                  Risk: {aiImpact?.automationRisk || 'LOW'}
                </p>
              </div>
              <Bot size={18} className="text-purple-300" />
            </div>
            <p className="mt-2 text-xs text-slate-400">{t('shell.signalsStack.tap_for_ai_impact_breakdown')}</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSignal('economy')}
            className="w-full glass-tile p-4 text-left hover:border-blue-400/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{t('shell.signalsStack.economy')}</p>
                <p className="text-lg font-semibold text-white">{economyTone}</p>
                <p className="text-xs text-slate-400">
                  Rate: {formatPercent(economy?.interestRate || 0.065)}
                </p>
              </div>
              <TrendingUp size={18} className="text-blue-300" />
            </div>
            <p className="mt-2 text-xs text-slate-400">{t('shell.signalsStack.tap_for_market_detail')}</p>
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
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <CreditCard className="text-emerald-300" size={20} />{t('shell.signalsStack.credit_score')}
            </h3>
            <p className="text-sm text-slate-400 mt-1">{t('shell.signalsStack.drivers_on_time_payments_utilization')}
            </p>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400">{t('shell.signalsStack.current_score')}</p>
              <p className={`text-2xl font-bold ${getCreditTierColor(creditTier)}`}>
                {creditScore} <span className="text-sm font-semibold">{creditTier}</span>
              </p>
            </div>
            <p className={`text-xs ${delta >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
              {delta >= 0 ? '+' : ''}{delta} this month
            </p>
          </div>
          <div className="h-40 w-full min-w-[1px] min-h-[1px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
              <AreaChart data={creditHistory.map(entry => ({ month: entry.month, score: entry.score }))}>
                <defs>
                  <linearGradient id="creditGradientV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <YAxis domain={[300, 850]} hide />
                <Tooltip formatter={(value: number) => [value, 'Score']} />
                <Area type="monotone" dataKey="score" stroke="#34d399" fill="url(#creditGradientV2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-slate-300 text-sm font-semibold mb-2">{t('credit.whyChanged')}</p>
            {reasons.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('credit.noChange')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reasons.map((reason, idx) => (
                  <span
                    key={`${reason}-${idx}`}
                    className="px-2 py-1 rounded-lg bg-slate-900/40 text-slate-300 text-xs border border-slate-700/60"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeSignal === 'ai'}
        onClose={() => setActiveSignal(null)}
        ariaLabel={t('shell.signalsStack.ai_disruption_details')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-xl rounded-none rounded-l-3xl p-6"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="text-purple-300" size={20} />{t('shell.signalsStack.ai_disruption')}
            </h3>
            <p className="text-sm text-slate-400 mt-1">{t('shell.signalsStack.your_career_exposure_to_automation')}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">{t('shell.signalsStack.disruption_level')}</span>
                <span className="text-white">{(gameState.aiDisruption?.disruptionLevel || 0).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${gameState.aiDisruption?.disruptionLevel || 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t('shell.signalsStack.your_career_risk')}</span>
              <span className={getAIRiskColor(aiImpact?.automationRisk || 'LOW')}>
                {aiImpact?.automationRisk || 'LOW'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t('shell.signalsStack.future_proof_score')}</span>
              <span className="text-white">{CAREER_PATHS[careerPath]?.futureProofScore || 50}%</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeSignal === 'economy'}
        onClose={() => setActiveSignal(null)}
        ariaLabel={t('shell.signalsStack.economy_details')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-xl rounded-none rounded-l-3xl p-6"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <TrendingUp className={economy?.recession ? 'text-red-400' : 'text-blue-300'} size={20} />{t('shell.signalsStack.economy')}
            </h3>
            <p className="text-sm text-slate-400 mt-1">{t('shell.signalsStack.macro_conditions_that_affect_asset')}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('shell.signalsStack.market')}</span>
              <span className={economy?.marketTrend === 'BULL' || economy?.marketTrend === 'BOOM'
                ? 'text-emerald-400'
                : economy?.marketTrend === 'BEAR' || economy?.marketTrend === 'CRASH'
                  ? 'text-red-400'
                  : 'text-slate-300'}>
                {economy?.marketTrend || 'STABLE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('shell.signalsStack.interest_rate')}</span>
              <span className="text-white">{formatPercent(economy?.interestRate || 0.065)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('shell.signalsStack.inflation')}</span>
              <span className="text-amber-300">{formatPercent(economy?.inflationRate || 0.03)}</span>
            </div>
            {economy?.recession && (
              <div className="bg-red-500/20 rounded-lg p-2 text-center mt-2">
                <span className="text-red-400 font-medium">{t('shell.signalsStack.recession')}</span>
                <p className="text-xs text-slate-400">{economy.recessionMonths} months remaining</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SignalsStack;
