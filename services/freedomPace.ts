import { GameState } from '../types';
import { calculateMonthlyCashFlowEstimate, financialFreedom } from './gameLogic';

// How far away financial freedom is at the player's current pace: the answer a FIRE calculator gives. Freedom
// income is turned into the capital it stands for (the 4% rule: 300 × a month's income), today's monthly surplus
// is assumed to go into a broad index fund, and everything grows at a real return (after inflation, because the
// target rises with prices). Raises, promotions and new expenses are left out, so it moves when the player acts.
// Deterministic: never calls rand(), so it is safe for previews and daily challenges.

/** A broad index fund's expected return (10%) less inflation (3%), less a little for the uneven path real prices take. */
export const PACE_REAL_RETURN = 0.06;
const monthlyGrowth = Math.pow(1 + PACE_REAL_RETURN, 1 / 12) - 1;
/** Past this the estimate says "not on track" rather than quote a lifetime. */
export const PACE_HORIZON_MONTHS = 50 * 12;

export type FreedomPace =
  | { status: 'free' }
  | { status: 'on-track'; months: number; surplus: number }
  | { status: 'between-jobs' }
  | { status: 'off-track'; surplus: number };

export const freedomPace = (state: GameState, flow = calculateMonthlyCashFlowEstimate(state)): FreedomPace => {
  const freedom = financialFreedom(state, flow);
  if (state.hasWon || freedom.coverage >= 1) return { status: 'free' };
  // A layoff's months without pay say nothing about the pace the player keeps once back at work.
  if ((state.jobLossMonthsRemaining ?? 0) > 0 && flow.salary <= 0) return { status: 'between-jobs' };
  const surplus = Math.round(flow.income - flow.expenses);
  // Spending more than comes in draws the capital down; the date only exists once there is something to invest.
  if (surplus < 0) return { status: 'off-track', surplus };
  const have = Math.max(0, freedom.income) * 300, need = freedom.target * 300;
  if (have <= 0 && surplus === 0) return { status: 'off-track', surplus };
  const months = Math.ceil(Math.log((need + surplus / monthlyGrowth) / (have + surplus / monthlyGrowth)) / Math.log(1 + monthlyGrowth));
  if (!Number.isFinite(months) || months > PACE_HORIZON_MONTHS) return { status: 'off-track', surplus };
  return { status: 'on-track', months: Math.max(1, months), surplus };
};

/** "about 14 years", "about 8 months": whole years from two years out, months below that. */
export const paceLabel = (months: number) => months >= 24 ? `about ${Math.round(months / 12)} years` : `about ${months} month${months === 1 ? '' : 's'}`;
