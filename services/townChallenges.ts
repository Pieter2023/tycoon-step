import { AssetType, type GameState } from '../types';
import { calculateMonthlyCashFlowEstimate } from './gameLogic';
import { savingsBalance } from './townActivities';
import { serviceStars } from './cafeService';
import { INDEX_FUND_IDS } from './townJourney';

// Three small, checkable challenges every month, pinned on the square's notice board. They are
// judged against a snapshot taken when the month began, so they measure what the player did
// this month rather than what they already had. Rewards are badges, never cash.
export type ChallengeId = 'reserve' | 'invest' | 'debt' | 'savings' | 'shift3' | 'tip' | 'cart' | 'hold';
export type ChallengeSnapshot = { month: number; cash: number; invested: number; debt: number; savings: number; indexUnits: number };
export type Challenge = { id: ChallengeId; title: string; detail: string; target: number; unit: 'dollars' | 'count' };
export type ChallengeProgress = { id: ChallengeId; done: boolean; value: number; target: number };
export type ChallengeResult = { month: number; completed: ChallengeId[]; total: number };

const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);
const investedIn = (state: GameState) => state.assets.filter(a => a.type !== AssetType.SAVINGS && !a.mortgageId).reduce((s, a) => s + a.costBasis * a.quantity, 0);
const debtOf = (state: GameState) => state.liabilities.reduce((s, l) => s + l.balance, 0) + (state.mortgages ?? []).reduce((s, m) => s + m.balance, 0);
const indexUnits = (state: GameState) => state.assets.filter(a => INDEX_FUND_IDS.includes(a.marketItemId ?? '')).reduce((s, a) => s + a.quantity, 0);

export const snapshotFor = (state: GameState): ChallengeSnapshot => ({ month: state.month, cash: state.cash, invested: investedIn(state), debt: debtOf(state), savings: savingsBalance(state), indexUnits: indexUnits(state) });

// Deterministic per month: a stable hash orders the applicable pool so the same month always shows the same three.
const hash = (n: number) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return h >>> 0; };
export function monthlyChallenges(state: GameState): Challenge[] {
  const flow = calculateMonthlyCashFlowEstimate(state), cart = state.assets.some(a => a.marketItemId === 'coffee_cart' && a.quantity > 0) && state.townProgress?.permitMonth !== undefined;
  const pool: Challenge[] = [
    { id: 'reserve', title: 'End the month with a full reserve', detail: `Keep at least $${Math.round(flow.expenses).toLocaleString('en-US')} (one month of expenses) in cash when the month closes.`, target: Math.round(flow.expenses), unit: 'dollars' },
    { id: 'invest', title: 'Put new money to work', detail: 'Buy investments with fresh cash this month (cost basis, not price moves).', target: roundTo(flow.income * .08, 50), unit: 'dollars' },
    { id: 'savings', title: 'Top up savings', detail: 'Move money into savings at the bank this month.', target: roundTo(flow.income * .05, 50), unit: 'dollars' },
  ];
  if (debtOf(state) > 0) pool.push({ id: 'debt', title: 'Pay debt down', detail: 'Reduce what you owe beyond the scheduled payment.', target: roundTo(Math.min(debtOf(state), flow.income * .06), 50), unit: 'dollars' });
  if (state.cafe) { pool.push({ id: 'shift3', title: 'Run a three-star owner shift', detail: 'Serve everyone in the café and earn tips from at least half of them.', target: 3, unit: 'count' }); pool.push({ id: 'tip', title: 'Earn a tip', detail: 'Serve a café guest fast enough to be tipped in a paid owner shift.', target: 1, unit: 'count' }); }
  if (cart) pool.push({ id: 'cart', title: 'Work your cart', detail: 'Run this month\'s pop-up shift at the coffee cart.', target: 1, unit: 'count' });
  if (indexUnits(state) > 0 && (state.marketCycle.phase === 'CONTRACTION' || state.economy.recession)) pool.push({ id: 'hold', title: 'Hold through the dip', detail: 'Keep every index-fund unit you own while prices fall.', target: 1, unit: 'count' });
  const always = pool.filter(c => c.id === 'reserve'), rest = pool.filter(c => c.id !== 'reserve').sort((a, b) => hash(state.month * 31 + a.id.length * 7 + a.id.charCodeAt(0)) - hash(state.month * 31 + b.id.length * 7 + b.id.charCodeAt(0)));
  return [...always, ...rest].slice(0, 3);
}

export function challengeProgress(challenge: Challenge, snapshot: ChallengeSnapshot, state: GameState): ChallengeProgress {
  const value = (() => {
    switch (challenge.id) {
      case 'reserve': return state.cash;
      case 'invest': return Math.max(0, investedIn(state) - snapshot.invested);
      case 'savings': return Math.max(0, savingsBalance(state) - snapshot.savings);
      case 'debt': return Math.max(0, snapshot.debt - debtOf(state));
      case 'shift3': return state.cafe?.service?.month === snapshot.month ? serviceStars(state.cafe.service) : 0;
      case 'tip': return state.cafe?.service?.month === snapshot.month ? state.cafe.service.guests.filter(g => (g.tip ?? 0) > 0).length : 0;
      case 'cart': return state.townProgress?.lastShift?.month === snapshot.month ? 1 : 0;
      case 'hold': return indexUnits(state) >= snapshot.indexUnits ? 1 : 0;
    }
  })();
  return { id: challenge.id, done: value >= challenge.target, value, target: challenge.target };
}

export const currentSnapshot = (state: GameState): ChallengeSnapshot => state.townProgress?.challengeSnapshot?.month === state.month ? state.townProgress.challengeSnapshot : snapshotFor(state);

// Called by the turn processor with the month that is ending. Records what was completed and
// starts the next month's snapshot on the new state.
export function closeChallengeMonth(ending: GameState): ChallengeResult | null {
  const snapshot = ending.townProgress?.challengeSnapshot;
  if (!snapshot || snapshot.month !== ending.month) return null;
  const challenges = monthlyChallenges({ ...ending, townProgress: ending.townProgress });
  const completed = challenges.filter(c => challengeProgress(c, snapshot, ending).done).map(c => c.id);
  return { month: ending.month, completed, total: challenges.length };
}
export const cleanSweeps = (log: ChallengeResult[] | undefined) => (log ?? []).filter(r => r.total > 0 && r.completed.length === r.total).length;
export const completedCount = (log: ChallengeResult[] | undefined) => (log ?? []).reduce((s, r) => s + r.completed.length, 0);
