import type { GameState } from '../types';
import { tl } from '../i18n/town';

// Unemployment insurance, filed at the Community Bank. The rules follow the North American shape
// the rest of the game uses: only an involuntary job loss qualifies (a layoff, or the dashboard's
// job-loss event; leaving a job to change careers does not), the benefit is half of prior pay up
// to a cap for up to six months, the first payment lands the month after filing, and each paid
// month needs a job application on record (the office's job search). Payments stop the month the
// player is back at work. The claim is kept in townProgress so the receipts and the annual report
// can see it.
export const BENEFIT_RATE = .5, BENEFIT_CAP = 2400, BENEFIT_MONTHS = 6;
export type UnemploymentClaim = { filedMonth: number; monthly: number; monthsLeft: number; paid: number; lastPaidMonth?: number; closedMonth?: number };
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export const involuntary = (state: GameState) => {
  const laid = state.townProgress?.laidOffMonth, changed = state.townProgress?.careerChangedMonth;
  return laid !== undefined && (changed === undefined || laid >= changed);
};
export type BenefitEligibility = { eligible: boolean; monthly: number; months: number; reason?: string };
export function benefitEligibility(state: GameState): BenefitEligibility {
  const salary = state.career?.salary ?? state.playerJob?.salary ?? 0, monthly = Math.min(BENEFIT_CAP, Math.round(salary * BENEFIT_RATE)), months = Math.min(BENEFIT_MONTHS, state.jobLossMonthsRemaining ?? 0);
  const claim = state.townProgress?.unemploymentClaim;
  if ((state.jobLossMonthsRemaining ?? 0) === 0) return { eligible: false, monthly, months, reason: tl('You are working. Benefits are for an involuntary gap between jobs.', 'Estás trabajando. Las prestaciones son para una pausa involuntaria entre empleos.') };
  if (claim && !claim.closedMonth) return { eligible: false, monthly: claim.monthly, months: claim.monthsLeft, reason: tl('Your claim is already active.', 'Tu solicitud ya está activa.') };
  if (!involuntary(state)) return { eligible: false, monthly, months, reason: tl('You left your last job to change careers, so this gap does not qualify. Benefits cover layoffs, not resignations.', 'Dejaste tu último empleo para cambiar de carrera, así que esta pausa no califica. Las prestaciones cubren despidos, no renuncias.') };
  if (state.pendingScenario) return { eligible: false, monthly, months, reason: tl('Resolve the waiting event first.', 'Resuelve primero el evento pendiente.') };
  if (monthly <= 0) return { eligible: false, monthly, months, reason: tl('No prior pay on record to base a benefit on.', 'No hay sueldo previo registrado para calcular una prestación.') };
  return { eligible: true, monthly, months };
}
export function fileUnemploymentClaim(state: GameState): GameState {
  const check = benefitEligibility(state); if (!check.eligible) return state;
  const claim: UnemploymentClaim = { filedMonth: state.month, monthly: check.monthly, monthsLeft: check.months, paid: 0 };
  return { ...state, townProgress: { ...state.townProgress, unemploymentClaim: claim, lastSearchMonth: state.townProgress?.lastSearchMonth ?? state.month }, events: [{ id: `ui-claim-${state.month}`, month: state.month, title: 'Unemployment claim filed', description: `${money(claim.monthly)} a month for up to ${claim.monthsLeft} month${claim.monthsLeft === 1 ? '' : 's'}, first payment next month. Each paid month needs a job application on record; payments stop when you are back at work.`, type: 'DECISION' }, ...state.events] };
}
// Called by processTurn before the job-loss countdown. `before` is the state as the month opened.
export function payUnemploymentBenefit(state: GameState, before: GameState): Partial<GameState> {
  const claim = state.townProgress?.unemploymentClaim; if (!claim || claim.closedMonth) return {};
  const progress = state.townProgress!;
  if ((before.jobLossMonthsRemaining ?? 0) === 0 || claim.monthsLeft <= 0) {
    return { townProgress: { ...progress, unemploymentClaim: { ...claim, closedMonth: state.month } }, events: [{ id: `ui-closed-${state.month}`, month: state.month, title: 'Unemployment claim closed', description: claim.paid ? `${money(claim.paid)} was paid over the gap. Back at work now.` : 'Closed without a payment: the gap ended first.', type: 'NEWS' }, ...state.events] };
  }
  if (before.month === claim.filedMonth) return {};   // filed this month; first payment next month
  const searched = before.townProgress?.lastSearchMonth === before.month || before.townProgress?.unemploymentClaim?.filedMonth === before.month;
  if (!searched) return { events: [{ id: `ui-skip-${state.month}`, month: state.month, title: 'Benefit paused', description: 'No job application on record last month, so nothing was paid. Apply from the office each month to keep the benefit flowing.', type: 'WARNING' }, ...state.events] };
  const monthsLeft = claim.monthsLeft - 1;
  return { cash: state.cash + claim.monthly, townProgress: { ...progress, unemploymentClaim: { ...claim, monthsLeft, paid: claim.paid + claim.monthly, lastPaidMonth: state.month } }, events: [{ id: `ui-paid-${state.month}`, month: state.month, title: 'Unemployment benefit paid', description: `${money(claim.monthly)} received. ${monthsLeft} month${monthsLeft === 1 ? '' : 's'} of benefit left. Keep applying: a job ends the claim early, and that is the point.`, type: 'NEWS' }, ...state.events] };
}
export function benefitStatus(state: GameState): { active: boolean; monthly: number; monthsLeft: number; paid: number; searchedThisMonth: boolean } | null {
  const claim = state.townProgress?.unemploymentClaim; if (!claim) return null;
  return { active: !claim.closedMonth, monthly: claim.monthly, monthsLeft: claim.monthsLeft, paid: claim.paid, searchedThisMonth: state.townProgress?.lastSearchMonth === state.month || claim.filedMonth === state.month };
}
