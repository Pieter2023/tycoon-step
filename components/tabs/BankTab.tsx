import React from 'react';
import { Banknote, Plus } from 'lucide-react';

type BankTabProps = {
  gameState: any;
  creditTier: string;
  creditScore: number;
  formatMoney: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  getCreditTierColor: (tier: string) => string;
  coachBankLoansRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  adjustedLoanOptions: any[];
  calculateLoanPayment: (amount: number, rate: number, term: number) => number;
  handleTakeLoan: (loan: any) => void;
  handlePayDebt: (liabilityId: string, amount: number) => void;
};

const BankTab: React.FC<BankTabProps> = (props) => {
  const {
    gameState,
    creditTier,
    creditScore,
    formatMoney,
    formatPercent,
    getCreditTierColor,
    coachBankLoansRef,
    coachHighlight,
    adjustedLoanOptions,
    calculateLoanPayment,
    handleTakeLoan,
    handlePayDebt
  } = props;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Banknote className="text-blue-400" />
          First National Bank
        </h2>
        <p className="text-slate-400">Get the funds you need. All loans have fixed rates and terms.</p>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="glass-tile p-3">
            <p className="text-slate-400">Base Rate</p>
            <p className="text-xl font-bold text-white">{formatPercent(gameState.economy.interestRate)}</p>
          </div>
          <div className="glass-tile p-3 min-w-[100px]">
            <p className="text-slate-400">Your Credit</p>
            <p className={`text-xl font-bold ${getCreditTierColor(creditTier)}`}>{creditTier}</p>
            <p className="text-xs text-slate-400 mt-1">{creditScore}</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-4">Available Loans</h3>
      <div
        ref={coachBankLoansRef}
        className={`grid gap-4 ${coachHighlight('bank-loans')}`}
      >
        {adjustedLoanOptions.map(loan => {
          const payment = calculateLoanPayment(loan.amount, loan.rate, loan.term);
          const totalCost = payment * loan.term;
          const totalInterest = totalCost - loan.amount;

          return (
            <div key={loan.id} className="glass-panel p-5 transition-all hover:border-slate-500/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-white font-bold text-lg">{loan.name}</h4>
                  <p className="text-slate-400 text-sm">{loan.description}</p>
                  {loan.perkLabel && (
                    <p className="text-emerald-300 text-xs mt-1 font-medium">{loan.perkLabel}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{formatMoney(loan.amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-sm mb-4">
                <div className="glass-tile p-2 text-center">
                  <p className="text-slate-500 text-xs uppercase font-bold">Rate</p>
                  <p className="text-white font-bold">{formatPercent(loan.rate)}</p>
                </div>
                <div className="glass-tile p-2 text-center">
                  <p className="text-slate-500 text-xs uppercase font-bold">Term</p>
                  <p className="text-white font-bold">{loan.term} mo</p>
                </div>
                <div className="glass-tile p-2 text-center">
                  <p className="text-slate-500 text-xs uppercase font-bold">Payment</p>
                  <p className="text-white font-bold">{formatMoney(payment)}/mo</p>
                </div>
                <div className="glass-tile p-2 text-center">
                  <p className="text-slate-500 text-xs uppercase font-bold">Total Interest</p>
                  <p className="text-red-400 font-bold">{formatMoney(totalInterest)}</p>
                </div>
              </div>

              <button onClick={() => handleTakeLoan(loan)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                <Plus size={18} />
                Get This Loan
              </button>
            </div>
          );
        })}
      </div>

      {/* Current Debts in Bank Tab */}
      {gameState.liabilities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Your Current Debts</h3>
          <div className="space-y-3">
            {gameState.liabilities.map(liability => (
              <div key={liability.id} className="glass-panel p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-white font-bold">{liability.name}</h4>
                  <p className="text-slate-400 text-sm mt-1">
                    <span className="text-slate-300">{formatPercent(liability.interestRate)}</span> interest • <span className="text-slate-300">{formatMoney(liability.monthlyPayment)}/mo</span> payment
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-lg">{formatMoney(liability.balance)}</p>
                  <button onClick={() => handlePayDebt(liability.id, liability.balance)}
                    disabled={gameState.cash < liability.balance}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-600 disabled:cursor-not-allowed mt-1 uppercase tracking-wider">
                    Pay in full
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTab;
