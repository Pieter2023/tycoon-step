import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { AnimatedNumber } from '../ui';
import { MOTION_DISABLED, springs } from '../ui/motion';
import { AnnualReport } from '../../types';
import { formatCurrencyCompactValue } from '../../i18n';
import { SheetItem, SheetStagger, useSheetReducedMotion } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);
const signed = (val: number): string => `${val >= 0 ? '+' : ''}${formatMoney(val)}`;

/** A thin horizontal bar that grows to its share on a spring (display only). */
const Bar: React.FC<{ share: number; color: string; delay?: number }> = ({ share, color, delay = 0 }) => {
  const reduce = useSheetReducedMotion();
  const width = `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%`;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[rgb(118_118_128/0.2)]" aria-hidden>
      {MOTION_DISABLED ? (
        <div className="h-full rounded-full" style={{ width, background: color }} />
      ) : (
        <motion.div
          className="h-full origin-left rounded-full"
          style={{ width, background: color }}
          initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
          animate={reduce ? { opacity: 1 } : { scaleX: 1 }}
          transition={reduce ? { duration: 0.2 } : { ...springs.settle, delay: 0.35 + delay }}
        />
      )}
    </div>
  );
};

// Year-in-review (learning counterfactuals; normal games only). Dismissable.
interface AnnualReportModalProps {
  report: AnnualReport;
  onDismiss: () => void;
}

const AnnualReportModal: React.FC<AnnualReportModalProps> = ({ report, onDismiss }) => {
  const nwDelta = report.endNetWorth - report.startNetWorth;
  const investingEdge = report.marketGains + report.passiveIncome;
  const cashOnlyNetWorth = report.endNetWorth - investingEdge;

  // The headline figure counts from where the year began to where it ended (display only).
  const [arrived, setArrived] = useState(MOTION_DISABLED);
  useEffect(() => {
    if (arrived) return;
    const id = window.setTimeout(() => setArrived(true), 380);
    return () => window.clearTimeout(id);
  }, [arrived]);

  // Bar lengths compare the year's figures with each other (their own scale, nothing recomputed).
  const flowScale = Math.max(Math.abs(report.marketGains), Math.abs(report.passiveIncome), 1);
  const worthScale = Math.max(Math.abs(report.endNetWorth), Math.abs(cashOnlyNetWorth), 1);

  return (
    <Modal
      isOpen
      onClose={onDismiss}
      ariaLabel="Year in review"
      overlayClassName="bg-black/70"
      contentClassName="max-w-lg overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(90%_80%_at_20%_0%,rgb(48_209_88/0.16),transparent_70%),radial-gradient(80%_70%_at_95%_0%,rgb(100_210_255/0.12),transparent_70%)]" />
      <SheetStagger className="relative px-5 pb-5 pt-7 sm:px-6" gap={0.06} delay={0.08}>
        <SheetItem>
          <p className="eyebrow text-emerald-300">Year in review</p>
          <h2 className="t-title-1 mt-0.5 text-white">📅 Year {report.year} wrapped</h2>
        </SheetItem>

        {/* The year in one number: where net worth ended, and by how much it moved. */}
        <SheetItem className="mt-5">
          <p className="text-[13px] text-slate-400">Net worth</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-white">
              <AnimatedNumber value={arrived ? report.endNetWorth : report.startNetWorth} format={formatMoney} flash={false} />
            </span>
            <span className={`num rounded-full px-2.5 py-1 text-[14px] font-semibold ${nwDelta >= 0 ? 'bg-emerald-400/[0.15] text-emerald-300' : 'bg-red-500/[0.15] text-red-300'}`}>
              {nwDelta >= 0 ? '+' : ''}{formatMoney(nwDelta)}
            </span>
          </div>
          <p className="num mt-1.5 text-[13px] text-slate-500">{formatMoney(report.startNetWorth)} → {formatMoney(report.endNetWorth)}</p>
        </SheetItem>

        <SheetItem className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-[18px] bg-white/[0.05] p-3.5 ring-1 ring-inset ring-white/[0.05]">
            <p className="text-[13px] text-slate-400">Market gains</p>
            <p className={`num mt-0.5 text-[22px] font-bold ${report.marketGains >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {signed(report.marketGains)}
            </p>
            <div className="mt-2.5">
              <Bar share={Math.abs(report.marketGains) / flowScale} color={report.marketGains >= 0 ? '#30d158' : '#ff453a'} />
            </div>
          </div>
          <div className="rounded-[18px] bg-white/[0.05] p-3.5 ring-1 ring-inset ring-white/[0.05]">
            <p className="text-[13px] text-slate-400">Passive income</p>
            <p className="num mt-0.5 text-[22px] font-bold text-amber-300">+{formatMoney(report.passiveIncome)}</p>
            <div className="mt-2.5">
              <Bar share={Math.abs(report.passiveIncome) / flowScale} color="#ff9f0a" delay={0.08} />
            </div>
          </div>
        </SheetItem>

        <SheetItem className="mt-3">
          <div className="rounded-[18px] bg-violet-400/[0.08] p-4 ring-1 ring-inset ring-violet-400/20">
            <p className="eyebrow mb-1 text-violet-300">What contributed to this year?</p>
            <p className="text-[14px] leading-[1.5] text-slate-200">
              Removing only recorded investment income and price changes gives <span className="num font-bold text-white">{formatMoney(cashOnlyNetWorth)}</span>.{' '}
              {investingEdge > 0 ? (
                <>Your money earned <span className="num font-bold text-emerald-300">{formatMoney(investingEdge)}</span> through payments and price changes. Only reinvested earnings compound.</>
              ) : investingEdge < 0 ? (
                <>Your portfolio lost <span className="num font-bold text-red-300">{formatMoney(-investingEdge)}</span> this year. A lower market value reduces your wealth even before you sell. Recovery is uncertain; review your cash needs and concentration.</>
              ) : (
                <>Recorded investment contributions were flat this year.</>
              )}
            </p>
            {/* Actual net worth against the same year without the investment contributions. */}
            <div className="mt-3 space-y-1.5" aria-hidden>
              <div className="flex items-center gap-2.5">
                <div className="flex-1"><Bar share={Math.abs(report.endNetWorth) / worthScale} color="linear-gradient(90deg,#30d158,#64d2ff)" delay={0.1} /></div>
                <span className="num w-16 text-right text-[12px] font-semibold text-white">{formatMoney(report.endNetWorth)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex-1"><Bar share={Math.abs(cashOnlyNetWorth) / worthScale} color="rgb(174 174 178 / 0.55)" delay={0.18} /></div>
                <span className="num w-16 text-right text-[12px] font-semibold text-slate-400">{formatMoney(cashOnlyNetWorth)}</span>
              </div>
            </div>
            <p className="mt-2.5 text-[12px] leading-snug text-slate-400">This is an accounting comparison, not a replay of another strategy. It excludes alternative uses of the cash, taxes and financing effects.</p>
          </div>
        </SheetItem>

        {report.city && (report.city.badges.length > 0 || report.city.challengesCompleted > 0 || report.city.cafeProfit !== undefined) && (
          <SheetItem className="mt-3">
            <div className="rounded-[18px] bg-amber-400/[0.08] p-4 ring-1 ring-inset ring-amber-400/20">
              <p className="eyebrow mb-1 text-amber-300">🏙 Your city this year</p>
              <p className="text-[14px] leading-[1.5] text-slate-200">
                {report.city.badges.length ? <>Badges: <span className="font-bold text-white">{report.city.badges.join(', ')}</span>. </> : null}
                Notice board: <span className="num font-bold text-white">{report.city.challengesCompleted}</span> challenges completed{report.city.cleanSweeps ? <>, <span className="num font-bold text-white">{report.city.cleanSweeps}</span> clean sweep{report.city.cleanSweeps === 1 ? '' : 's'}</> : null}.
                {report.city.cafeProfit !== undefined && <> The café made <span className={`num font-bold ${report.city.cafeProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatMoney(report.city.cafeProfit)}</span> after all operating costs across {report.city.ownerShifts} owner shift{report.city.ownerShifts === 1 ? '' : 's'}; reputation stands at {report.city.cafeReputation}/100.</>}
              </p>
              {report.city.review && <p className="mt-2 text-[14px] text-slate-200">Performance review: <span className="font-bold text-white">{report.city.review.grade}</span> ({report.city.review.score}/100){report.city.review.bonus ? <> · bonus <span className="num font-bold text-emerald-300">{formatMoney(report.city.review.bonus)}</span> paid</> : null}.</p>}
              <p className="mt-2 text-[12px] text-slate-400">Badges and challenges never added cash; the habits behind them did the work.</p>
            </div>
          </SheetItem>
        )}

        {report.hindsights.length > 0 && (
          <SheetItem className="mt-3">
            <div className="list-group p-4">
              <p className="eyebrow mb-2">🎓 Hindsight</p>
              {report.hindsights.map((h, i) => (
                <p key={i} className="mb-1.5 text-[14px] leading-snug text-slate-300 last:mb-0">{h.text}</p>
              ))}
            </div>
          </SheetItem>
        )}

        <SheetItem className="mt-5">
          <button
            type="button"
            onClick={onDismiss}
            className="btn-primary num min-h-[50px] w-full px-5 text-[16px]"
          >
            On to Year {report.year + 1} →
          </button>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default AnnualReportModal;
