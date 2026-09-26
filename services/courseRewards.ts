import type { CourseRaiseId, GameState } from '../types';
import { drawOnCard } from './gameLogic';

// Self Learn certifications pay what the skill really earns: a lasting raise, not a cash windfall.
// The raise multiplies pay after the education premium (getCourseRaiseMultiplier in gameLogic), so a
// promotion or a new job keeps it, and the pay stub, taxes and the freedom pace all see it.
// Until build 55 a pass paid one-time cash ($50k negotiations, $25k sales, $25k EQ); saves that
// claimed it keep the cash (their rewardClaimed flag is set) and get no raise.
export const COURSE_RAISE_PCT: Record<CourseRaiseId, number> = { negotiations: 5, sales: 3, eq: 3 };

// Three tries are included. A third miss costs a small retake fee, like a real exam, and buys three
// more. (It used to cost $25k, or for EQ a $10k fee plus a demotion to the first rung.)
export const COURSE_ATTEMPTS = 3;
export const COURSE_RETAKE_FEE = 150;

/** First pass of a course: the raise, once per save. */
export function grantCourseRaise(state: GameState, course: CourseRaiseId): GameState {
  if (state.courseRaises?.[course]) return state;
  return { ...state, courseRaises: { ...state.courseRaises, [course]: COURSE_RAISE_PCT[course] } };
}

/** The retake fee: from cash first, the rest on the credit card. */
export function chargeRetakeFee(state: GameState, fee = COURSE_RETAKE_FEE): GameState {
  const fromCash = Math.min(Math.max(0, state.cash), fee), rest = fee - fromCash;
  return { ...state, cash: state.cash - fromCash, liabilities: rest > 0 ? drawOnCard(state.liabilities, rest) : state.liabilities };
}

/** A missed (uncertified) attempt: the third miss charges the fee and starts a fresh set of tries. */
export function recordMiss(state: GameState, failedAttempts: number): { state: GameState; failedAttempts: number; feeCharged: boolean } {
  const misses = failedAttempts + 1;
  if (misses < COURSE_ATTEMPTS) return { state, failedAttempts: misses, feeCharged: false };
  return { state: chargeRetakeFee(state), failedAttempts: 0, feeCharged: true };
}
