import React from 'react';
import { motion } from 'framer-motion';
import { Banknote, Plus } from 'lucide-react';
import { ActivityRing, MOTION_DISABLED, riseIn, springs, stagger } from '../ui';

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

/** Ring colours for the credit gauge, by tier (Apple Fitness-style two-stop arcs). */
const CREDIT_RING: Record<string, [string, string]> = {
  EXCELLENT: ['#30d158', '#64d2ff'],
  GOOD: ['#30d158', '#9cf0ad'],
  FAIR: ['#ff9f0a', '#ffd60a'],
  POOR: ['#ff453a', '#ff9f0a']
};

const sentenceCase = (value: string) => {
  const lower = String(value || '').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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

  // Where the score sits on the 300–850 scale, for the ring only.
  const creditProgress = Math.max(0, Math.min(1, (creditScore - 300) / 550));

  return (
    <div className="space-y-7">
      {/* The bank as a Wallet card: deep blue material, the credit score as a ring. */}
      <section className="relative overflow-hidden rounded-[24px] border border-white/[0.1] bg-[linear-gradient(135deg,#0c2d63_0%,#10204a_42%,#16122f_100%)] p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_24px_48px_-24px_rgb(10_132_255/0.45)] sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(100_210_255/0.22),transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(94_92_230/0.22),transparent_65%)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="t-title-2 flex items-center gap-2.5 text-white">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white/[0.14] text-sky-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]">
                <Banknote size={19} aria-hidden />
              </span>
              First National Bank
            </h2>
            <p className="mt-2 max-w-md text-[15px] leading-[21px] text-sky-100/75">Get the funds you need. All loans have fixed rates and terms.</p>
            <div className="mt-4">
              <p className="text-[12px] font-medium text-sky-100/60">Base Rate</p>
              <p className="num text-[28px] font-bold leading-8 tracking-[-0.02em] text-white">{formatPercent(gameState.economy.interestRate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ActivityRing
              progress={creditProgress}
              size={96}
              stroke={10}
              colors={CREDIT_RING[creditTier] || ['#8e8e93', '#aeaeb2']}
              trackColor="rgb(255 255 255 / 0.12)"
              ariaLabel={`Credit score ${creditScore}`}
            >
              <span className="num text-[22px] font-bold leading-none tracking-[-0.02em] text-white">{creditScore}</span>
            </ActivityRing>
            <div>
              <p className="text-[12px] font-medium text-sky-100/60">Your Credit</p>
              <p className={`t-title-3 ${getCreditTierColor(creditTier)}`}>{sentenceCase(creditTier)}</p>
              <p className="num text-[12px] text-sky-100/50">300–850</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="t-title-3 mb-3 px-1 text-white">Available Loans</h3>
        <motion.div
          ref={coachBankLoansRef}
          className={`grid gap-3 md:grid-cols-2 ${coachHighlight('bank-loans')}`}
          variants={stagger(0.05)}
          initial={MOTION_DISABLED ? false : 'hidden'}
          animate="show"
        >
          {adjustedLoanOptions.map(loan => {
            const payment = calculateLoanPayment(loan.amount, loan.rate, loan.term);
            const totalCost = payment * loan.term;
            const totalInterest = totalCost - loan.amount;

            return (
              <motion.div key={loan.id} variants={riseIn} className="surface-card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="t-headline text-white">{loan.name}</h4>
                    <p className="mt-0.5 text-[13px] text-slate-400">{loan.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-500/[0.15] px-2.5 py-1 text-[12px] font-medium text-sky-300/80">
                    Rate <span className="num font-semibold text-sky-200">{formatPercent(loan.rate)}</span>
                  </span>
                </div>
                {loan.perkLabel && (
                  <p className="mt-2 self-start rounded-full bg-emerald-400/[0.14] px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">{loan.perkLabel}</p>
                )}

                <p className="num mt-4 text-[34px] font-bold leading-[38px] tracking-[-0.025em] text-white">{formatMoney(loan.amount)}</p>

                {/* Pass-style fields: label above value. */}
                <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.07] rounded-[14px] bg-white/[0.045] py-2.5 [&>div]:px-3.5">
                  <div>
                    <p className="text-[12px] text-slate-400">Term</p>
                    <p className="num text-[15px] font-semibold text-white">{loan.term} mo</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-400">Payment</p>
                    <p className="num text-[15px] font-semibold text-white">{formatMoney(payment)}/mo</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-400">Total Interest</p>
                    <p className="num text-[15px] font-semibold text-rose-400">{formatMoney(totalInterest)}</p>
                  </div>
                </div>

                <button onClick={() => handleTakeLoan(loan)}
                  className="pressable mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[rgb(10_132_255/0.18)] py-2.5 text-[15px] font-semibold text-[#5EB0FF] transition-colors hover:bg-[rgb(10_132_255/0.28)] hover:text-[#8cc8ff]">
                  <Plus size={17} strokeWidth={2.6} aria-hidden />
                  Get This Loan
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Current Debts in Bank Tab */}
      {gameState.liabilities.length > 0 && (
        <section>
          <h3 className="t-title-3 mb-3 px-1 text-white">Your Current Debts</h3>
          <div className="list-group">
            {gameState.liabilities.map(liability => {
              const paidOff = liability.originalBalance > 0
                ? Math.max(0, Math.min(100, ((liability.originalBalance - liability.balance) / liability.originalBalance) * 100))
                : 0;
              return (
                <div key={liability.id} className="list-row flex-col items-stretch gap-2.5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold leading-5 text-white">{liability.name}</h4>
                      <p className="num mt-0.5 text-[13px] text-slate-400">
                        <span className="text-slate-300">{formatPercent(liability.interestRate)}</span> interest • <span className="text-slate-300">{formatMoney(liability.monthlyPayment)}/mo</span> payment
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num text-[17px] font-semibold leading-6 text-rose-400">{formatMoney(liability.balance)}</p>
                      <button onClick={() => handlePayDebt(liability.id, liability.balance)}
                        disabled={gameState.cash < liability.balance}
                        className="pressable -mr-1 rounded-full px-1 py-0.5 text-[13px] font-semibold text-sky-400 hover:text-sky-300 disabled:cursor-not-allowed disabled:text-slate-600">
                        Pay in full
                      </button>
                    </div>
                  </div>
                  <div className="meter h-[5px]">
                    <motion.div
                      className="h-full rounded-full bg-emerald-400"
                      initial={MOTION_DISABLED ? false : { width: 0 }}
                      animate={{ width: `${paidOff}%` }}
                      transition={springs.settle}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default BankTab;
