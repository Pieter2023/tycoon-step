import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { useI18n } from '../i18n';
import { Tooltip } from './ui';

type FinancialFreedomBreakdownProps = {
  passive: number;
  expenses: number;
  goalPercent: number;
  lastPassive: number | null;
  lastExpenses: number | null;
};

const FinancialFreedomBreakdown: React.FC<FinancialFreedomBreakdownProps> = ({
  passive,
  expenses,
  goalPercent,
  lastPassive,
  lastExpenses
}) => {
  const { t, formatCurrency, formatNumber } = useI18n();

  const ratioPercent = useMemo(() => {
    if (expenses <= 0) return 0;
    return (passive / expenses) * 100;
  }, [passive, expenses]);

  const passiveDelta = lastPassive !== null ? passive - lastPassive : 0;
  const expenseDelta = lastExpenses !== null ? expenses - lastExpenses : 0;

  const formatDelta = (value: number) => {
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    const formatted = formatCurrency(Math.abs(Math.round(value)), { maximumFractionDigits: 0 });
    return `${sign}${formatted}`;
  };

  const deltaLabel = (delta: number, fallback: string) =>
    (lastPassive === null && lastExpenses === null) ? fallback : formatDelta(delta);

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_1fr]">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{t('freedom.breakdown.title')}</span>
          <span>{t('freedom.breakdown.goal', { value: formatNumber(Math.round(goalPercent)) })}</span>
        </div>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-300">
              <span>{t('freedom.breakdown.passiveIncome')}</span>
              <Tooltip content={t('freedom.breakdown.passiveTooltip')}>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-200"
                  aria-label={t('freedom.breakdown.passiveHelp')}
                >
                  <Info size={14} />
                </button>
              </Tooltip>
            </div>
            <div className="font-semibold text-white">
              {formatCurrency(Math.round(passive), { maximumFractionDigits: 0 })}/mo
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-slate-300">
              <span>{t('freedom.breakdown.expenses')}</span>
              <Tooltip content={t('freedom.breakdown.expensesTooltip')}>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-200"
                  aria-label={t('freedom.breakdown.expensesHelp')}
                >
                  <Info size={14} />
                </button>
              </Tooltip>
            </div>
            <div className="font-semibold text-white">
              {formatCurrency(Math.round(expenses), { maximumFractionDigits: 0 })}/mo
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('freedom.breakdown.ratio')}</span>
            <span className="text-slate-200">
              {t('freedom.breakdown.ratioValue', {
                passive: formatCurrency(Math.round(passive), { maximumFractionDigits: 0 }),
                expenses: formatCurrency(Math.round(expenses), { maximumFractionDigits: 0 }),
                percent: ratioPercent.toFixed(1)
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="text-xs text-slate-400">{t('freedom.breakdown.change')}</div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">{t('freedom.breakdown.passiveLabel')}</span>
            <span className={`font-semibold ${passiveDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {deltaLabel(passiveDelta, t('general.emptyDash'))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">{t('freedom.breakdown.expenses')}</span>
            <span className={`font-semibold ${expenseDelta <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {deltaLabel(expenseDelta, t('general.emptyDash'))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialFreedomBreakdown;
