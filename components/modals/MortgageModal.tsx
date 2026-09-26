import React from 'react';
import { Check, Info } from 'lucide-react';
import Modal from '../Modal';
import { Tooltip } from '../ui';
import { MarketItem } from '../../types';
import { formatCurrencyCompactValue, formatCurrencyValue, formatPercentValue } from '../../i18n';
import { closingCosts } from '../../services/propertyCosts';
import { SheetItem, SheetStagger } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);
const formatMoneyFull = (val: number): string =>
  formatCurrencyValue(val, { maximumFractionDigits: 0 });
const formatPercent = (val: number): string => formatPercentValue(val, 1);

// One row per mortgage option, fully precomputed in App (the math shares
// credit/loan helpers with the buy/refinance flows there).
export type MortgagePreview = {
  id: string;
  name: string;
  description: string;
  minScore: number;
  incomeRequirement?: number;
  netWorthRequirement?: number;
  down: number;
  loanAmount: number;
  rate: number;
  payment: number;
  /** Mortgage insurance included in payment (less than 20% down). */
  pmi: number;
  closingCosts: number;
  /** Why this option cannot be used at all (e.g. a second FHA loan). */
  blockedReason?: string;
  rentIncome: number;
  maintenance: number;
  cashflowImpact: number;
  approvalChance: number;
  canAfford: boolean;
  meetsIncomeReq: boolean;
  meetsNetWorthReq: boolean;
  meetsCreditReq: boolean;
};

interface MortgageModalProps {
  item: MarketItem;
  /** Inflation-adjusted purchase price. */
  price: number;
  previews: MortgagePreview[];
  selectedMortgage: string;
  onSelectMortgage: (id: string) => void;
  cash: number;
  cashFlowIncome: number;
  cashFlowDebtPayments: number;
  /** Open the confirm dialog for the selected option. */
  onReview: (preview: MortgagePreview) => void;
  onBuyCash: () => void;
  onClose: () => void;
}

const statChip = 'num inline-flex items-center rounded-full bg-[rgb(118_118_128/0.18)] px-2 py-0.5 text-[12px] text-slate-300';

const MortgageModal: React.FC<MortgageModalProps> = ({
  item,
  price,
  previews,
  selectedMortgage,
  onSelectMortgage,
  cash,
  cashFlowIncome,
  cashFlowDebtPayments,
  onReview,
  onBuyCash,
  onClose
}) => {
  const selectedPreview = previews.find((preview) => preview.id === selectedMortgage) || null;
  const cashAfterDown = selectedPreview ? cash - selectedPreview.down : null;
  const positive = selectedPreview ? selectedPreview.cashflowImpact >= 0 : true;

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Mortgage options"
      overlayClassName="bg-black/60"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-lg"
    >
      <SheetStagger className="px-5 pb-5 pt-6 sm:px-6" gap={0.04}>
        <SheetItem className="pr-10">
          <h2 className="t-title-2 text-white">🏠 Finance {item.name}</h2>
          <p className="num mt-1 text-[15px] text-slate-400">
            Price: {formatMoneyFull(price)}
          </p>
        </SheetItem>

        <div className="mt-4 space-y-2.5">
          {previews.map((preview) => {
            const {
              id,
              name,
              description,
              down,
              rate,
              payment,
              cashflowImpact,
              approvalChance,
              meetsIncomeReq,
              meetsNetWorthReq,
              meetsCreditReq,
              canAfford
            } = preview;
            const selected = selectedMortgage === id;

            return (
              <SheetItem key={id}>
                <div
                  onClick={() => canAfford && onSelectMortgage(id)}
                  className={`relative rounded-[18px] p-4 transition-[background-color,box-shadow,scale] duration-200 ${
                    selected
                      ? 'bg-emerald-400/[0.09] shadow-[inset_0_0_0_1.5px_rgb(48_209_88/0.75)]'
                      : canAfford
                        ? 'surface-interactive cursor-pointer bg-white/[0.05] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] hover:bg-white/[0.08]'
                        : 'cursor-not-allowed bg-white/[0.03] opacity-55'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors ${
                          selected ? 'bg-emerald-400 text-[#03170a]' : 'ring-[1.5px] ring-inset ring-slate-600'
                        }`}
                      >
                        {selected && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="text-[16px] font-semibold text-white">{name}</span>
                    </div>
                    <span className="num shrink-0 text-right text-[13px] font-semibold text-emerald-300">{formatMoney(down)} down + {formatMoney(preview.closingCosts)} closing</span>
                  </div>
                  <p className="mt-1 pl-[32px] text-[13px] leading-snug text-slate-400">{description}</p>
                  {preview.blockedReason && <p className="mt-1 pl-[32px] text-[13px] text-amber-300">{preview.blockedReason}</p>}
                  {!meetsCreditReq && (
                    <p className="mt-1 pl-[32px] text-[13px] text-amber-300">Requires credit score {preview.minScore}+</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[32px]">
                    <span className={statChip}>Rate: {formatPercent(rate)}</span>
                    <span className={statChip}>Payment: {formatMoney(payment)}/mo{preview.pmi ? ` incl. ${formatMoney(preview.pmi)} PMI` : ''}</span>
                    <span className={`num inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold ${cashflowImpact >= 0 ? 'bg-emerald-400/[0.14] text-emerald-300' : 'bg-red-500/[0.14] text-red-300'}`}>
                      Cashflow: {cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(cashflowImpact))}/mo
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-[32px] text-[12px] text-slate-500">
                    <span className="num inline-flex items-center gap-1">
                      Upkeep, tax &amp; ins.
                      <Tooltip content="Upkeep (1%), property tax (1.1%) and homeowner's insurance (0.35%) of the price, per year.">
                        <Info size={12} className="text-slate-400" />
                      </Tooltip>
                      : {formatMoney(preview.maintenance)}/mo
                    </span>
                    <span className="num">
                      Approval chance: {Math.round(approvalChance * 100)}% • DTI: {Math.round(((cashFlowDebtPayments + payment) / Math.max(1, cashFlowIncome)) * 100)}%
                    </span>
                  </div>
                  {!meetsIncomeReq && preview.incomeRequirement !== undefined && (
                    <p className="num mt-1.5 pl-[32px] text-[12px] text-red-300">Income required: {formatMoney(preview.incomeRequirement)}/mo</p>
                  )}
                  {!meetsNetWorthReq && preview.netWorthRequirement !== undefined && (
                    <p className="num mt-1.5 pl-[32px] text-[12px] text-red-300">Net worth required: {formatMoney(preview.netWorthRequirement)}</p>
                  )}
                </div>
              </SheetItem>
            );
          })}
        </div>

        {selectedPreview && (
          <SheetItem className="mt-4">
            <div className="list-group p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">Estimated impact</span>
                <span className={`num text-[15px] font-bold ${positive ? 'text-emerald-300' : 'text-red-300'}`}>
                  {positive ? '+' : '-'}{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo
                </span>
              </div>
              <div className="num mt-2.5 flex flex-wrap gap-1.5 text-[13px] text-slate-300">
                <span className="rounded-full bg-emerald-400/[0.1] px-2.5 py-1 text-emerald-200">Rent: {formatMoney(selectedPreview.rentIncome)}/mo</span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1">Mortgage: -{formatMoney(selectedPreview.payment)}/mo</span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1">Upkeep, tax &amp; ins.: -{formatMoney(selectedPreview.maintenance)}/mo</span>
              </div>
              <p className={`num mt-3 text-[14px] font-semibold ${positive ? 'text-emerald-300' : 'text-red-300'}`}>
                This deal is cashflow {positive ? 'positive' : 'negative'} by ~{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo.
              </p>
              <div className="num mt-1.5 text-[13px] leading-snug text-slate-400">
                Buying this will reduce cash to <span className="font-semibold text-white">{formatMoneyFull(cashAfterDown || 0)}</span> and
                change monthly cashflow by <span className={positive ? 'text-emerald-300' : 'text-red-300'}>
                  {positive ? '+' : '-'}{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo
                </span>.
              </div>
            </div>
          </SheetItem>
        )}

        <SheetItem className="mt-5 flex gap-2.5">
          <button type="button" onClick={onClose} className="btn-secondary touch-target min-h-[46px] flex-1 px-4 text-[15px]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => selectedPreview && onReview(selectedPreview)}
            disabled={!selectedMortgage}
            className="btn-primary touch-target min-h-[46px] flex-1 px-4 text-[15px]"
          >
            Review Purchase
          </button>
        </SheetItem>

        <SheetItem className="mt-2.5">
          <button
            type="button"
            onClick={onBuyCash}
            disabled={cash < price + closingCosts(price)}
            className="pressable touch-target num min-h-[44px] w-full rounded-full bg-amber-400/[0.12] px-4 text-[14px] font-semibold text-amber-300 hover:bg-amber-400/[0.2] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-amber-400/[0.12]"
          >
            Pay Full Cash ({formatMoney(price + closingCosts(price))} incl. closing)
          </button>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default MortgageModal;
