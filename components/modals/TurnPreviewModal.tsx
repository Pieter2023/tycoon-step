import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock,
  Coffee,
  Heart,
  Sparkles,
  Wallet,
  Zap
} from 'lucide-react';
import Modal from '../Modal';
import { GameState, MonthlyActionId, TABS, TabId } from '../../types';
import { formatCurrencyValue } from '../../i18n';

const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });

export type TurnPreviewLine = { label: string; value: number };

export type TurnPreviewData = {
  nextMonth: number;
  nextYear: number;
  monthOfYear: number;
  incomeLines: TurnPreviewLine[];
  expenseLines: TurnPreviewLine[];
  income: number;
  expenses: number;
  netChange: number;
  projectedEndCash: number;
  shortfall: number;
  warningLevel: 'SAFE' | 'LOW_BUFFER' | 'SHORTFALL';
};

// Next Month preview: income/expense estimate + coach "Quick Fixes" when the
// projection looks risky. Navigation and monthly-action side effects live in
// App (they touch tabs, coach hints, and notifications).
interface TurnPreviewModalProps {
  preview: TurnPreviewData;
  gameState: GameState;
  isProcessing: boolean;
  lifestyleCashDelta: number | null;
  showNextMonthPreview: boolean;
  onToggleShowPreview: (show: boolean) => void;
  onQuickFixNavigate: (tabId: TabId, tipTitle: string, tipMessage: string, tipType?: string) => void;
  onUseQuickAction: (actionId: MonthlyActionId) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const TurnPreviewModal: React.FC<TurnPreviewModalProps> = ({
  preview,
  gameState,
  isProcessing,
  lifestyleCashDelta,
  showNextMonthPreview,
  onToggleShowPreview,
  onQuickFixNavigate,
  onUseQuickAction,
  onClose,
  onConfirm
}) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Next Month preview"
    overlayClassName="bg-black/80 backdrop-blur-sm"
    closeOnOverlayClick
    closeOnEsc
    contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-white">📅 Next Month Preview</h2>
        <p className="text-slate-400 text-sm">
          Year {preview.nextYear} • Month {preview.monthOfYear} (estimated)
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
      <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-300">Income</h3>
          <span className="text-xs text-slate-400">Top sources</span>
        </div>
        <div className="mt-3 space-y-2">
          {preview.incomeLines.slice(0, 5).map((l) => (
            <div key={l.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{l.label}</span>
              <span className="text-emerald-200 font-medium">{formatMoneyFull(l.value)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400">Estimated total</span>
          <span className="text-sm font-bold text-emerald-300">{formatMoneyFull(preview.income)}</span>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-amber-300">Expenses</h3>
          <span className="text-xs text-slate-400">Top drivers</span>
        </div>
        <div className="mt-3 space-y-2">
          {preview.expenseLines.slice(0, 5).map((l) => (
            <div key={l.label} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{l.label}</span>
              <span className="text-amber-200 font-medium">{formatMoneyFull(l.value)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400">Estimated total</span>
          <span className="text-sm font-bold text-amber-300">{formatMoneyFull(preview.expenses)}</span>
        </div>
      </div>
    </div>

    <div className={`mt-4 p-4 rounded-xl border ${
      preview.warningLevel === 'SHORTFALL' ? 'bg-red-900/20 border-red-700/40' :
      preview.warningLevel === 'LOW_BUFFER' ? 'bg-amber-900/20 border-amber-700/40' :
      'bg-emerald-900/10 border-emerald-700/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">Projected cash change</div>
        <div className={`text-sm font-bold flex items-center gap-1 ${preview.netChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          {preview.netChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {preview.netChange >= 0 ? '+' : '-'}{formatMoneyFull(Math.abs(preview.netChange))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-slate-300">Projected end cash</div>
        <div className="text-sm font-bold text-white">
          {formatMoneyFull(Math.max(0, preview.projectedEndCash))}
        </div>
      </div>

      {lifestyleCashDelta !== null && (
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-slate-300">Lifestyle change impact</div>
          <div className={`text-sm font-semibold ${lifestyleCashDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {lifestyleCashDelta >= 0 ? '+' : '-'}
            {formatMoneyFull(Math.abs(lifestyleCashDelta))}/mo
          </div>
        </div>
      )}

      {preview.warningLevel === 'SHORTFALL' && (
        <div className="mt-3 text-sm text-red-200 flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5" />
          <div>
            <div className="font-semibold">Projected shortfall: {formatMoneyFull(preview.shortfall)}</div>
            <div className="text-xs text-red-200/90 mt-1">
              You may miss payments and take a credit hit. Consider lowering lifestyle, selling an asset, or using a Monthly Action (Overtime / Hustle Sprint).
            </div>
          </div>
        </div>
      )}

      {preview.warningLevel === 'LOW_BUFFER' && (
        <div className="mt-3 text-sm text-amber-200 flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5" />
          <div>
            <div className="font-semibold">Low buffer</div>
            <div className="text-xs text-amber-200/90 mt-1">
              One bad event could push you into delinquency. Consider building a 1–3 month cash reserve.
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Coach Actions (Step 11): jump to fixes before advancing */}
    {(preview.warningLevel === 'SHORTFALL' || preview.warningLevel === 'LOW_BUFFER') && (
      <div className="mt-4 bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" /> Quick Fixes
          </h3>
          <span className="text-xs text-slate-400">Before advancing</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Jump straight to the right place (or use a Monthly Action) to reduce cashflow risk.
        </p>

        {(() => {
          const max = gameState.monthlyActionsMax ?? 2;
          const remaining = (typeof gameState.monthlyActionsRemaining === 'number') ? gameState.monthlyActionsRemaining : max;
          const locked = isProcessing || !!gameState.pendingScenario || !!gameState.hasWon || !!gameState.isBankrupt;
          const energy = gameState.stats?.energy ?? 0;
          const tooDrained = energy < 20;
          const canUseAction = !locked && remaining > 0 && !tooDrained;
          const hasHustle = (gameState.activeSideHustles || []).length > 0;
          const canLowerLifestyle = gameState.lifestyle !== 'FRUGAL';
          const hasAssets = (gameState.assets || []).length > 0;
          const showLoan = preview.warningLevel === 'SHORTFALL';

          const btnBase = 'w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3';
          const btnEnabled = 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/40 hover:bg-slate-800/60';
          const btnDisabled = 'bg-slate-900/20 border-slate-700/50 text-slate-500 cursor-not-allowed';

          const overtimeDisabledReason = locked
            ? 'Unavailable right now'
            : remaining <= 0
              ? 'No actions remaining'
              : tooDrained
                ? 'Need 20+ energy'
                : '';

          const sprintDisabledReason = locked
            ? 'Unavailable right now'
            : remaining <= 0
              ? 'No actions remaining'
              : tooDrained
                ? 'Need 20+ energy'
                : !hasHustle
                  ? 'Start a hustle first'
                  : '';

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <motion.button
                whileHover={{ scale: canLowerLifestyle ? 1.02 : 1 }}
                whileTap={{ scale: canLowerLifestyle ? 0.99 : 1 }}
                disabled={!canLowerLifestyle}
                onClick={() => onQuickFixNavigate(TABS.LIFESTYLE, 'Coach Tip', 'Drop one lifestyle tier to cut monthly expenses.', 'info')}
                className={`${btnBase} ${canLowerLifestyle ? btnEnabled : btnDisabled}`}
              >
                <Heart size={18} className="text-pink-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Lower Lifestyle</p>
                  <p className="text-xs text-slate-400">
                    {canLowerLifestyle ? 'Reduce monthly costs (you choose the tier).' : 'Already at the lowest tier.'}
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: hasAssets ? 1.02 : 1 }}
                whileTap={{ scale: hasAssets ? 0.99 : 1 }}
                disabled={!hasAssets}
                onClick={() => onQuickFixNavigate(TABS.ASSETS, 'Coach Tip', 'Sell an asset to raise cash (watch out for underwater mortgages).', 'info')}
                className={`${btnBase} ${hasAssets ? btnEnabled : btnDisabled}`}
              >
                <Wallet size={18} className="text-amber-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Sell an Asset</p>
                  <p className="text-xs text-slate-400">
                    {hasAssets ? 'Convert an asset into cash to cover your buffer.' : 'No assets available to sell yet.'}
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: canUseAction ? 1.02 : 1 }}
                whileTap={{ scale: canUseAction ? 0.99 : 1 }}
                disabled={!canUseAction}
                onClick={() => onUseQuickAction('OVERTIME')}
                className={`${btnBase} ${canUseAction ? btnEnabled : btnDisabled}`}
              >
                <Clock size={18} className="text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Use Overtime</p>
                  <p className="text-xs text-slate-400">
                    {canUseAction ? 'Monthly Action: +10% salary bonus (next month).' : overtimeDisabledReason}
                  </p>
                </div>
              </motion.button>

              {hasHustle ? (
                <motion.button
                  whileHover={{ scale: (canUseAction && hasHustle) ? 1.02 : 1 }}
                  whileTap={{ scale: (canUseAction && hasHustle) ? 0.99 : 1 }}
                  disabled={!(canUseAction && hasHustle)}
                  onClick={() => onUseQuickAction('HUSTLE_SPRINT')}
                  className={`${btnBase} ${(canUseAction && hasHustle) ? btnEnabled : btnDisabled}`}
                >
                  <Zap size={18} className="text-amber-200 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Hustle Sprint</p>
                    <p className="text-xs text-slate-400">
                      {(canUseAction && hasHustle) ? 'Monthly Action: +25% side hustle income (next month).' : sprintDisabledReason}
                    </p>
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onQuickFixNavigate(TABS.SIDEHUSTLE, 'Coach Tip', 'Start a side hustle to increase monthly income.', 'info')}
                  className={`${btnBase} ${btnEnabled}`}
                >
                  <Coffee size={18} className="text-sky-200 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Start a Side Hustle</p>
                    <p className="text-xs text-slate-400">Add extra income streams (energy/stress tradeoff).</p>
                  </div>
                </motion.button>
              )}

              {showLoan && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onQuickFixNavigate(TABS.BANK, 'Coach Warning', 'A loan can patch a shortfall fast, but increases monthly payments.', 'warning')}
                  className={`${btnBase} ${btnEnabled}`}
                >
                  <Banknote size={18} className="text-blue-200 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Get a Loan</p>
                    <p className="text-xs text-slate-400">Fast cash now, higher expenses later.</p>
                  </div>
                </motion.button>
              )}
            </div>
          );
        })()}
      </div>
    )}

    <div className="mt-3 text-xs text-slate-500">
      Estimates exclude random events, taxes, and side-hustle variance. Use this as a planning snapshot.
    </div>

    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <label className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <input
          type="checkbox"
          className="rounded border-slate-600 bg-slate-900"
          checked={showNextMonthPreview}
          onChange={(e) => onToggleShowPreview(e.target.checked)}
        />
        Show month preview
      </label>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white touch-target"
        >
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold touch-target"
        >
          Advance Month
        </motion.button>
      </div>
    </div>
  </Modal>
);

export default TurnPreviewModal;
