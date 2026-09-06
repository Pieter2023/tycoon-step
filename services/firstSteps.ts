import { GameState } from '../types';

export const REPAIR_COST = 400;
export const REPAIR_LOAN_RATE = .15;
const monthlyRate = REPAIR_LOAN_RATE / 12;
export const REPAIR_LOAN_PAYMENT = REPAIR_COST * monthlyRate / (1 - Math.pow(1 + monthlyRate, -12));

export const resolveFirstRepair = (state: GameState, choice: 'cash' | 'loan'): GameState => {
  if (!state.firstSteps || state.firstSteps.repairChoice || state.pendingScenario || state.hasWon || state.isBankrupt) return state;
  if (choice === 'cash' && state.cash < REPAIR_COST) return state;
  return { ...state,
    cash: state.cash - (choice === 'cash' ? REPAIR_COST : 0),
    liabilities: choice === 'loan' ? [...state.liabilities, {
      id: 'first-repair-loan', name: 'Car repair loan', type: 'PERSONAL_LOAN',
      balance: REPAIR_COST, originalBalance: REPAIR_COST, interestRate: REPAIR_LOAN_RATE,
      monthlyPayment: REPAIR_LOAN_PAYMENT
    }] : state.liabilities,
    firstSteps: { ...state.firstSteps, repairChoice: choice, repairMonth: state.month },
    events: [{ id: 'first-repair', month: state.month, title: 'Car repaired',
      description: choice === 'cash' ? 'Used $400 from your cash reserve. No new repayments.'
        : 'Borrowed $400 and paid the repairer. Cash preserved; a 15% APR loan adds 12 monthly payments.', type: 'DECISION' }, ...state.events]
  };
};
