import React from 'react';
import Modal from '../Modal';
import { AnnualReport } from '../../types';
import { formatCurrencyCompactValue } from '../../i18n';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

// Year-in-review (learning counterfactuals; normal games only). Dismissable.
interface AnnualReportModalProps {
  report: AnnualReport;
  onDismiss: () => void;
}

const AnnualReportModal: React.FC<AnnualReportModalProps> = ({ report, onDismiss }) => {
  const nwDelta = report.endNetWorth - report.startNetWorth;
  const investingEdge = report.marketGains + report.passiveIncome;
  const cashOnlyNetWorth = report.endNetWorth - investingEdge;
  return (
    <Modal
      isOpen
      onClose={onDismiss}
      ariaLabel="Year in review"
      overlayClassName="bg-black/85"
      contentClassName="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6"
    >
      <div className="text-center mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Year in review</p>
        <h2 className="text-2xl font-bold text-white mt-1">📅 Year {report.year} wrapped</h2>
      </div>

      <div className="bg-black/30 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-400">Net worth</p>
          <p className="text-white font-bold">{formatMoney(report.startNetWorth)} → {formatMoney(report.endNetWorth)}</p>
        </div>
        <div>
          <p className="text-slate-400">Change</p>
          <p className={`font-bold ${nwDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {nwDelta >= 0 ? '+' : ''}{formatMoney(nwDelta)}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Market gains</p>
          <p className={`font-bold ${report.marketGains >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {report.marketGains >= 0 ? '+' : ''}{formatMoney(report.marketGains)}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Passive income</p>
          <p className="text-amber-400 font-bold">+{formatMoney(report.passiveIncome)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300 mb-1">What contributed to this year?</p>
        <p className="text-sm text-slate-200">
          Removing only recorded investment income and price changes gives <span className="font-bold text-white">{formatMoney(cashOnlyNetWorth)}</span>.{' '}
          {investingEdge > 0 ? (
            <>Your money earned <span className="font-bold text-emerald-300">{formatMoney(investingEdge)}</span> through payments and price changes. Only reinvested earnings compound.</>
          ) : investingEdge < 0 ? (
            <>Your portfolio lost <span className="font-bold text-red-300">{formatMoney(-investingEdge)}</span> this year. A lower market value reduces your wealth even before you sell. Recovery is uncertain; review your cash needs and concentration.</>
          ) : (
            <>Recorded investment contributions were flat this year.</>
          )}
        </p>
        <p className="mt-2 text-xs text-slate-400">This is an accounting comparison, not a replay of another strategy. It excludes alternative uses of the cash, taxes and financing effects.</p>
      </div>

      {report.city && (report.city.badges.length > 0 || report.city.challengesCompleted > 0 || report.city.cafeProfit !== undefined) && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300 mb-1">🏙 Your city this year</p>
          <p className="text-sm text-slate-200">
            {report.city.badges.length ? <>Badges: <span className="font-bold text-white">{report.city.badges.join(', ')}</span>. </> : null}
            Notice board: <span className="font-bold text-white">{report.city.challengesCompleted}</span> challenges completed{report.city.cleanSweeps ? <>, <span className="font-bold text-white">{report.city.cleanSweeps}</span> clean sweep{report.city.cleanSweeps === 1 ? '' : 's'}</> : null}.
            {report.city.cafeProfit !== undefined && <> The café made <span className={`font-bold ${report.city.cafeProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatMoney(report.city.cafeProfit)}</span> after all operating costs across {report.city.ownerShifts} owner shift{report.city.ownerShifts === 1 ? '' : 's'}; reputation stands at {report.city.cafeReputation}/100.</>}
          </p>
          <p className="mt-2 text-xs text-slate-400">Badges and challenges never added cash; the habits behind them did the work.</p>
        </div>
      )}

      {report.hindsights.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">🎓 Hindsight</p>
          {report.hindsights.map((h, i) => (
            <p key={i} className="text-sm text-slate-300 mb-1 last:mb-0">{h.text}</p>
          ))}
        </div>
      )}

      <button
        onClick={onDismiss}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl font-bold text-white transition-all"
      >
        On to Year {report.year + 1} →
      </button>
    </Modal>
  );
};

export default AnnualReportModal;
