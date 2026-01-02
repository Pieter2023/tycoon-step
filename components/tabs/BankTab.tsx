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
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/30 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Banknote className="text-blue-400" />
                First National Bank
              </h2>
              <p className="text-slate-400">Get the funds you need. All loans have fixed rates and terms.</p>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-slate-400">Base Rate</p>
                  <p className="text-xl font-bold text-white">{formatPercent(gameState.economy.interestRate)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
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
                  <div key={loan.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-bold text-lg">{loan.name}</h4>
                        <p className="text-slate-400 text-sm">{loan.description}</p>
                        {loan.perkLabel && (
                          <p className="text-emerald-300 text-xs mt-1">{loan.perkLabel}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{formatMoney(loan.amount)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-sm mb-4">
                      <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                        <p className="text-slate-500 text-xs">Rate</p>
                        <p className="text-white font-medium">{formatPercent(loan.rate)}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                        <p className="text-slate-500 text-xs">Term</p>
                        <p className="text-white font-medium">{loan.term} mo</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                        <p className="text-slate-500 text-xs">Payment</p>
                        <p className="text-white font-medium">{formatMoney(payment)}/mo</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                        <p className="text-slate-500 text-xs">Total Interest</p>
                        <p className="text-red-400 font-medium">{formatMoney(totalInterest)}</p>
                      </div>
                    </div>
                    
                    <button onClick={() => handleTakeLoan(loan)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
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
                    <div key={liability.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">{liability.name}</h4>
                          <p className="text-slate-400 text-sm">{formatPercent(liability.interestRate)} • {formatMoney(liability.monthlyPayment)}/mo</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-bold">{formatMoney(liability.balance)}</p>
                          <button onClick={() => handlePayDebt(liability.id, liability.balance)}
                            disabled={gameState.cash < liability.balance}
                            className="text-xs text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed">
                            Pay in full
                          </button>
                        </div>
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
