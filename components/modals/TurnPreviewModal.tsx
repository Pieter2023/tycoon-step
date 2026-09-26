import React from 'react';
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
import { AnimatedNumber } from '../ui';
import { GameState, MonthlyActionId, TABS, TabId } from '../../types';
import { formatCurrencyValue } from '../../i18n';
import { SheetItem, SheetStagger, Switch } from './sheet';

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

// Status tint for the projection card: calm green, orange for a thin buffer, red for a shortfall.
const STATUS = {
  SAFE: { card: 'bg-emerald-400/[0.07] ring-emerald-400/20', dot: 'bg-emerald-400' },
  LOW_BUFFER: { card: 'bg-amber-400/[0.08] ring-amber-400/25', dot: 'bg-amber-400' },
  SHORTFALL: { card: 'bg-red-500/[0.09] ring-red-500/25', dot: 'bg-red-500' }
} as const;

/** The tinted icon tile on a quick-fix card. */
const Tile: React.FC<{ tint: string; children: React.ReactNode }> = ({ tint, children }) => (
  <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${tint}`}>{children}</span>
);

/** One column of the estimate: its top lines as a quiet list, the total set apart below. */
const FlowList: React.FC<{
  title: string;
  hint: string;
  tone: 'income' | 'expense';
  lines: TurnPreviewLine[];
  total: number;
}> = ({ title, hint, tone, lines, total }) => (
  <div className="list-group flex flex-col">
    <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold text-white">
        <span aria-hidden className={`h-2 w-2 rounded-full ${tone === 'income' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        {title}
      </h3>
      <span className="text-[12px] text-slate-500">{hint}</span>
    </div>
    <div className="flex-1 space-y-1.5 px-4 pb-3">
      {lines.map((l) => (
        <div key={l.label} className="flex items-baseline justify-between gap-3 text-[14px]">
          <span className="min-w-0 leading-snug text-slate-300">{l.label}</span>
          <span className={`num shrink-0 font-medium ${tone === 'expense' ? 'text-slate-200' : l.value < 0 ? 'text-red-300' : 'text-slate-200'}`}>
            {formatMoneyFull(l.value)}
          </span>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between border-t border-[rgb(84_84_88/0.45)] px-4 py-2.5">
      <span className="text-[13px] text-slate-400">Estimated total</span>
      <span className={`num text-[15px] font-bold ${tone === 'income' ? 'text-emerald-300' : 'text-amber-300'}`}>{formatMoneyFull(total)}</span>
    </div>
  </div>
);

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
}) => {
  const status = STATUS[preview.warningLevel] ?? STATUS.SAFE;
  const up = preview.netChange >= 0;
  // How much of the month's income the costs take (drawn as a meter; display only).
  const spendShare = preview.income > 0 ? Math.min(1, Math.max(0, preview.expenses / preview.income)) : preview.expenses > 0 ? 1 : 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Next Month preview"
      overlayClassName="bg-black/60"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-xl!"
    >
      <SheetStagger className="px-5 pb-5 pt-6 sm:px-6" gap={0.04}>
        <SheetItem className="pr-10">
          <p className="eyebrow num">Year {preview.nextYear} • Month {preview.monthOfYear} (estimated)</p>
          <h2 className="t-title-2 mt-0.5 text-white">📅 Next Month Preview</h2>
        </SheetItem>

        {/* The answer first: how cash moves next month. */}
        <SheetItem className="mt-4">
          <div className={`rounded-[20px] p-4 ring-1 ring-inset sm:p-5 ${status.card}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[13px] font-medium text-slate-300">
                  <span aria-hidden className={`h-2 w-2 rounded-full ${status.dot}`} />
                  Projected cash change
                </div>
                <div className={`mt-1 flex items-center gap-1.5 font-display text-[34px] font-bold leading-none tracking-[-0.025em] ${up ? 'text-emerald-300' : 'text-red-300'}`}>
                  {up ? <ArrowUpRight size={26} strokeWidth={2.6} aria-hidden /> : <ArrowDownRight size={26} strokeWidth={2.6} aria-hidden />}
                  <span className="num">
                    {up ? '+' : '-'}
                    <AnimatedNumber value={Math.abs(preview.netChange)} format={formatMoneyFull} flash={false} />
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[13px] text-slate-400">Projected end cash</div>
                <div className="num mt-1 text-[20px] font-semibold text-white">
                  <AnimatedNumber value={Math.max(0, preview.projectedEndCash)} format={formatMoneyFull} flash={false} />
                </div>
              </div>
            </div>

            <div className="mt-4" aria-hidden>
              {/* Green is the month's income, orange the share of it that costs take (red once they exceed it). */}
              <div className={`meter h-[6px] ${spendShare >= 1 ? 'bg-red-500/30!' : 'bg-emerald-400/45!'}`}>
                <div
                  className={`meter-fill ${spendShare >= 1 ? 'bg-red-500' : 'bg-amber-400'}`}
                  style={{ width: `${Math.round(spendShare * 100)}%` }}
                />
              </div>
            </div>

            {lifestyleCashDelta !== null && (
              <div className="mt-3 flex items-center justify-between text-[14px]">
                <div className="text-slate-300">Lifestyle change impact</div>
                <div className={`num font-semibold ${lifestyleCashDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {lifestyleCashDelta >= 0 ? '+' : '-'}
                  {formatMoneyFull(Math.abs(lifestyleCashDelta))}/mo
                </div>
              </div>
            )}

            {preview.warningLevel === 'SHORTFALL' && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-[14px] bg-red-500/[0.1] p-3 text-[14px] text-red-200">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" aria-hidden />
                <div>
                  <div className="num font-semibold">Projected shortfall: {formatMoneyFull(preview.shortfall)}</div>
                  <div className="mt-1 text-[13px] leading-snug text-red-200/85">
                    The gap goes on your credit card at 24% a year (past its limit it becomes a missed payment and a credit hit). Consider lowering lifestyle, selling an asset, or using a Monthly Action (Overtime / Hustle Sprint).
                  </div>
                </div>
              </div>
            )}

            {preview.warningLevel === 'LOW_BUFFER' && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-[14px] bg-amber-400/[0.1] p-3 text-[14px] text-amber-200">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden />
                <div>
                  <div className="font-semibold">Low buffer</div>
                  <div className="mt-1 text-[13px] leading-snug text-amber-200/85">
                    One bad event could push you into delinquency. Consider building a 1–3 month cash reserve.
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetItem>

        <SheetItem className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FlowList title="Income" hint="Top sources" tone="income" lines={preview.incomeLines.slice(0, 5)} total={preview.income} />
          <FlowList title="Expenses" hint="Top drivers" tone="expense" lines={preview.expenseLines.slice(0, 5)} total={preview.expenses} />
        </SheetItem>

        {gameState.cafe && (
          <SheetItem>
            <p className="mt-2.5 px-1 text-[12px] leading-snug text-slate-400">Café net operating profit includes all café stock, wages, rent and utilities. A loss reduces the income total above. Annual taxes are separate.</p>
          </SheetItem>
        )}

        {/* Coach Actions (Step 11): jump to fixes before advancing */}
        {(preview.warningLevel === 'SHORTFALL' || preview.warningLevel === 'LOW_BUFFER') && (
          <SheetItem className="mt-5">
            <div className="flex items-center justify-between px-1">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                <Sparkles size={16} className="text-amber-400" aria-hidden /> Quick Fixes
              </h3>
              <span className="text-[12px] text-slate-500">Before advancing</span>
            </div>
            <p className="mt-0.5 px-1 text-[13px] text-slate-400">
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

              const btnBase =
                'surface-interactive flex w-full items-start gap-3 rounded-[16px] p-3 text-left disabled:cursor-not-allowed';
              const btnEnabled = 'bg-white/[0.06] hover:bg-white/[0.1]';
              const btnDisabled = 'bg-white/[0.025] opacity-60';

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
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={!canLowerLifestyle}
                    onClick={() => onQuickFixNavigate(TABS.LIFESTYLE, 'Coach Tip', 'Drop one lifestyle tier to cut monthly expenses.', 'info')}
                    className={`${btnBase} ${canLowerLifestyle ? btnEnabled : btnDisabled}`}
                  >
                    <Tile tint="bg-pink-500/[0.18] text-pink-300"><Heart size={17} /></Tile>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white">Lower Lifestyle</p>
                      <p className="text-[12px] leading-snug text-slate-400">
                        {canLowerLifestyle ? 'Reduce monthly costs (you choose the tier).' : 'Already at the lowest tier.'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!hasAssets}
                    onClick={() => onQuickFixNavigate(TABS.ASSETS, 'Coach Tip', 'Sell an asset to raise cash (watch out for underwater mortgages).', 'info')}
                    className={`${btnBase} ${hasAssets ? btnEnabled : btnDisabled}`}
                  >
                    <Tile tint="bg-amber-400/[0.18] text-amber-300"><Wallet size={17} /></Tile>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white">Sell an Asset</p>
                      <p className="text-[12px] leading-snug text-slate-400">
                        {hasAssets ? 'Convert an asset into cash to cover your buffer.' : 'No assets available to sell yet.'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!canUseAction}
                    onClick={() => onUseQuickAction('OVERTIME')}
                    className={`${btnBase} ${canUseAction ? btnEnabled : btnDisabled}`}
                  >
                    <Tile tint="bg-emerald-400/[0.18] text-emerald-300"><Clock size={17} /></Tile>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white">Use Overtime</p>
                      <p className="text-[12px] leading-snug text-slate-400">
                        {canUseAction ? 'Monthly Action: +10% salary bonus (next month).' : overtimeDisabledReason}
                      </p>
                    </div>
                  </button>

                  {hasHustle ? (
                    <button
                      type="button"
                      disabled={!(canUseAction && hasHustle)}
                      onClick={() => onUseQuickAction('HUSTLE_SPRINT')}
                      className={`${btnBase} ${(canUseAction && hasHustle) ? btnEnabled : btnDisabled}`}
                    >
                      <Tile tint="bg-yellow-400/[0.18] text-yellow-300"><Zap size={17} /></Tile>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-white">Hustle Sprint</p>
                        <p className="text-[12px] leading-snug text-slate-400">
                          {(canUseAction && hasHustle) ? 'Monthly Action: +25% side hustle income (next month).' : sprintDisabledReason}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuickFixNavigate(TABS.SIDEHUSTLE, 'Coach Tip', 'Start a side hustle to increase monthly income.', 'info')}
                      className={`${btnBase} ${btnEnabled}`}
                    >
                      <Tile tint="bg-sky-400/[0.18] text-sky-300"><Coffee size={17} /></Tile>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-white">Start a Side Hustle</p>
                        <p className="text-[12px] leading-snug text-slate-400">Add extra income streams (energy/stress tradeoff).</p>
                      </div>
                    </button>
                  )}

                  {showLoan && (
                    <button
                      type="button"
                      onClick={() => onQuickFixNavigate(TABS.BANK, 'Coach Warning', 'A loan can patch a shortfall fast, but increases monthly payments.', 'warning')}
                      className={`${btnBase} ${btnEnabled}`}
                    >
                      <Tile tint="bg-[#0a84ff]/[0.2] text-sky-300"><Banknote size={17} /></Tile>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-white">Get a Loan</p>
                        <p className="text-[12px] leading-snug text-slate-400">Fast cash now, higher expenses later.</p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })()}
          </SheetItem>
        )}

        <SheetItem>
          <p className="mt-3 px-1 text-[12px] leading-snug text-slate-500">
            Estimates include income tax but exclude random events and side-hustle variance. Use this as a planning snapshot.
          </p>
        </SheetItem>

        <SheetItem className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-[14px] text-slate-300">
            <Switch checked={showNextMonthPreview} onChange={(e) => onToggleShowPreview(e.target.checked)} />
            Show month preview
          </label>

          <div className="flex gap-2.5">
            <button type="button" onClick={onClose} className="btn-secondary touch-target min-h-[46px] flex-1 px-6 text-[15px] sm:flex-none">
              Back
            </button>
            <button type="button" onClick={onConfirm} className="btn-primary touch-target min-h-[46px] flex-[2] px-6 text-[15px] sm:flex-none">
              Advance Month
            </button>
          </div>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default TurnPreviewModal;
