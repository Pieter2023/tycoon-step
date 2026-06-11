import React from 'react';
import { Info } from 'lucide-react';
import Modal from '../Modal';
import { Tooltip } from '../ui';
import { MarketItem } from '../../types';
import { formatCurrencyCompactValue, formatCurrencyValue, formatPercentValue } from '../../i18n';

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

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Mortgage options"
      overlayClassName="bg-black/80 backdrop-blur-sm"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
    >
      <h2 className="text-xl font-bold text-white mb-2">🏠 Finance {item.name}</h2>
      <p className="text-slate-400 mb-4">
        Price: {formatMoneyFull(price)}
      </p>

      <div className="space-y-3 mb-4">
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

          return (
            <div
              key={id}
              onClick={() => canAfford && onSelectMortgage(id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedMortgage === id ? 'border-emerald-500 bg-emerald-900/20' :
                canAfford ? 'border-slate-600 hover:border-slate-500' :
                'border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="text-white font-medium">{name}</span>
                <span className="text-emerald-400">{formatMoney(down)} down</span>
              </div>
              <p className="text-slate-400 text-xs">{description}</p>
              {!meetsCreditReq && (
                <p className="text-amber-400 text-xs mt-1">Requires credit score {preview.minScore}+</p>
              )}
              <div className="flex justify-between text-xs mt-2">
                <span className="text-slate-500">Rate: {formatPercent(rate)}</span>
                <span className="text-slate-500">Payment: {formatMoney(payment)}/mo</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className={`font-medium ${cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  Cashflow: {cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(cashflowImpact))}/mo
                </span>
                <span className="text-slate-500 inline-flex items-center gap-1">
                  Est. maint
                  <Tooltip content="Estimated maintenance is 1% of purchase price per year.">
                    <Info size={12} className="text-slate-400" />
                  </Tooltip>
                  : {formatMoney(preview.maintenance)}/mo
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Approval chance: {Math.round(approvalChance * 100)}% • DTI: {Math.round(((cashFlowDebtPayments + payment) / Math.max(1, cashFlowIncome)) * 100)}%
              </p>
              {!meetsIncomeReq && preview.incomeRequirement !== undefined && (
                <p className="text-red-400 text-xs mt-1">Income required: {formatMoney(preview.incomeRequirement)}/mo</p>
              )}
              {!meetsNetWorthReq && preview.netWorthRequirement !== undefined && (
                <p className="text-red-400 text-xs mt-1">Net worth required: {formatMoney(preview.netWorthRequirement)}</p>
              )}
            </div>
          );
        })}
      </div>

      {selectedPreview && (
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wide">
            <span>Estimated impact</span>
            <span className={selectedPreview.cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}>
              {selectedPreview.cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-300 flex flex-wrap gap-3">
            <span>Rent: {formatMoney(selectedPreview.rentIncome)}/mo</span>
            <span>Mortgage: -{formatMoney(selectedPreview.payment)}/mo</span>
            <span>Maint: -{formatMoney(selectedPreview.maintenance)}/mo</span>
          </div>
          <p className={`mt-2 text-sm font-semibold ${selectedPreview.cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            This deal is cashflow {selectedPreview.cashflowImpact >= 0 ? 'positive' : 'negative'} by ~{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo.
          </p>
          <div className="mt-3 text-xs text-slate-300">
            Buying this will reduce cash to <span className="text-white font-semibold">{formatMoneyFull(cashAfterDown || 0)}</span> and
            change monthly cashflow by <span className={selectedPreview.cashflowImpact >= 0 ? 'text-emerald-300' : 'text-red-300'}>
              {selectedPreview.cashflowImpact >= 0 ? '+' : '-'}{formatMoney(Math.abs(selectedPreview.cashflowImpact))}/mo
            </span>.
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all touch-target"
        >
          Cancel
        </button>
        <button
          onClick={() => selectedPreview && onReview(selectedPreview)}
          disabled={!selectedMortgage}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-all touch-target"
        >
          Review Purchase
        </button>
      </div>

      <button
        onClick={onBuyCash}
        disabled={cash < price}
        className="w-full mt-3 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-amber-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-target"
      >
        Pay Full Cash ({formatMoney(price)})
      </button>
    </Modal>
  );
};

export default MortgageModal;
