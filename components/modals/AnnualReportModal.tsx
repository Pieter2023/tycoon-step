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
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300 mb-1">What if you hadn't invested?</p>
        <p className="text-sm text-slate-200">
          Without your investments, you'd have ended the year at <span className="font-bold text-white">{formatMoney(cashOnlyNetWorth)}</span>.{' '}
          {investingEdge > 0 ? (
            <>Your money earned <span className="font-bold text-emerald-300">{formatMoney(investingEdge)}</span> on its own — that's compounding working for you.</>
          ) : investingEdge < 0 ? (
            <>Your portfolio lost <span className="font-bold text-red-300">{formatMoney(-investingEdge)}</span> this year. Paper losses only become real when you sell — downturns usually recover.</>
          ) : (
            <>All of this year's progress came from work. Assets that pay you are how the climb gets easier.</>
          )}
        </p>
      </div>

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
