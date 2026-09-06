import type { GameState } from '../types';
import { CAREER_PATHS, EDUCATION_OPTIONS, DIFFICULTY_SETTINGS } from '../constants';
import { calculateEffectiveMonthlySalary, calculateAnnualTaxes, calculateMonthlyCashFlow, calculateMonthlyCashFlowEstimate, getEducationSalaryMultiplier, getNegotiationRaiseBonus } from './gameLogic';

// Main Street Offices: the player's employer in the city. Everything here reads the real career,
// education, stats and economy fields and explains them; nothing moves money. The pay stub
// reconciles line by line to the salary the turn actually pays, and the promotion outlook uses
// the same odds formula as checkPromotion (without the dice).
const LEVEL_ORDER = ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'];
const words = (s: string) => s.replace(/_/g, ' ').toLowerCase();
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');

export type PayLine = { label: string; amount: number; note?: string };
export type PayStub = { title: string; employer: string; gross: number; tax: number; net: number; lines: PayLine[]; unemployed: boolean };
export function payStub(state: GameState): PayStub {
  const career = state.career, path = career ? CAREER_PATHS[career.path] : undefined;
  const base = career?.salary ?? state.playerJob?.salary ?? 0, title = career?.title ?? state.playerJob?.title ?? 'Your job';
  const gross = calculateEffectiveMonthlySalary(state), unemployed = (state.jobLossMonthsRemaining ?? 0) > 0;
  const lines: PayLine[] = [{ label: `${title} · base pay`, amount: base }];
  let running = base;
  const edu = getEducationSalaryMultiplier(state);
  if (edu !== 1) { const next = Math.round(base * edu); lines.push({ label: 'Education premium', amount: next - running, note: `${Math.round((edu - 1) * 100)}% for relevant qualifications` }); running = next; }
  const ai = state.aiDisruption?.affectedIndustries?.[career?.path ?? 'TECH']?.salaryImpact;
  if (ai && ai !== 1) { const next = Math.round(running * ai); lines.push({ label: 'AI pressure on your industry', amount: next - running, note: 'Automation is compressing pay in this field' }); running = next; }
  if (state.economy?.recession && !unemployed) { const next = Math.round(running * .95); lines.push({ label: 'Recession pay squeeze', amount: next - running, note: 'Employers cut costs in a downturn' }); running = next; }
  if (state.tempSalaryBonus) { lines.push({ label: 'Overtime this month', amount: Math.round(state.tempSalaryBonus) }); running += Math.round(state.tempSalaryBonus); }
  if (unemployed) { lines.push({ label: `Between jobs · ${state.jobLossMonthsRemaining} month${state.jobLossMonthsRemaining === 1 ? '' : 's'} to go`, amount: -running, note: 'No salary until you are back at work' }); running = 0; }
  if (Math.abs(running - gross) > 0) lines.push({ label: 'Perks and adjustments', amount: gross - running });
  const flow = calculateMonthlyCashFlow(state), totalIncome = flow.salary + flow.sideHustleIncome + flow.passive + flow.spouseIncome;
  const tax = totalIncome > 0 && gross > 0 ? Math.round(calculateAnnualTaxes(state) / 12 * (gross / totalIncome)) : 0;
  return { title, employer: path?.name ?? 'Your employer', gross, tax, net: gross - tax, lines, unemployed };
}

export type Outlook = { title: string; level: number; top: boolean; next?: { title: string; salary: number; experienceRequired: number }; experience: number; monthsShort: number; educationNeeded?: string; educationMet: boolean; eligible: boolean; chance: number; expectedMonths: number | null; recession: boolean; blockers: string[]; boosters: string[] };
export function promotionOutlook(state: GameState): Outlook {
  const career = state.career, info = career ? CAREER_PATHS[career.path] : undefined, recession = !!state.economy?.recession;
  const none = (title: string, level: number, experience: number, blockers: string[]): Outlook => ({ title, level, top: true, experience, monthsShort: 0, educationMet: true, eligible: false, chance: 0, expectedMonths: null, recession, blockers, boosters: [] });
  if (!career || !info) return none(state.playerJob?.title ?? 'Your job', 0, 0, ['No career path on file yet.']);
  const nextLevel = info.levels[career.level];
  if (!nextLevel) return none(career.title, career.level, career.experience, []);
  const monthsShort = Math.max(0, nextLevel.experienceRequired - career.experience);
  const educationNeeded = nextLevel.educationRequired && nextLevel.educationCategory ? `${words(nextLevel.educationRequired)} in ${words(nextLevel.educationCategory)}` : undefined;
  const educationMet = !educationNeeded || state.education.degrees.some(id => { const e = EDUCATION_OPTIONS.find(o => o.id === id); return !!e && LEVEL_ORDER.indexOf(e.level) >= LEVEL_ORDER.indexOf(nextLevel.educationRequired!) && e.category === nextLevel.educationCategory; });
  let chance = .15 + (state.stats.happiness - 50) / 500 + state.stats.networking / 500 - (state.stats.stress - 30) / 500 + getNegotiationRaiseBonus(state);
  if (recession) chance *= .5; chance = Math.max(0, Math.min(1, chance));
  const eligible = monthsShort === 0 && educationMet && (state.jobLossMonthsRemaining ?? 0) === 0;
  const blockers: string[] = [], boosters: string[] = [];
  if (monthsShort > 0) blockers.push(`${monthsShort} more month${monthsShort === 1 ? '' : 's'} of experience`);
  if (!educationMet) blockers.push(`A ${educationNeeded} qualification`);
  if ((state.jobLossMonthsRemaining ?? 0) > 0) blockers.push('You are between jobs');
  if (recession) blockers.push('Recession: promotions are half as likely');
  if (state.stats.stress > 60) blockers.push('High stress is counting against you');
  if (state.stats.networking >= 40) boosters.push('Your network is working for you'); else boosters.push('Networking would raise your odds');
  if (state.stats.happiness >= 65) boosters.push('Managers notice people who enjoy the work');
  const multiplier = DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS]?.salaryMultiplier ?? 1;
  return { title: career.title, level: career.level, top: false, next: { title: nextLevel.title, salary: Math.max(career.salary, Math.round(nextLevel.baseSalary * multiplier)), experienceRequired: nextLevel.experienceRequired }, experience: career.experience, monthsShort, educationNeeded, educationMet, eligible, chance: eligible ? chance : 0, expectedMonths: eligible && chance > 0 ? Math.max(1, Math.round(1 / chance)) : null, recession, blockers, boosters };
}

export type Security = { score: number; vulnerability: number; label: 'Resilient' | 'Exposed' | 'At risk'; text: string; shields: string[] };
export function jobSecurity(state: GameState): Security {
  const info = state.career ? CAREER_PATHS[state.career.path] : undefined;
  const score = info?.futureProofScore ?? 50, vulnerability = info?.aiVulnerability ?? .5;
  const est = calculateMonthlyCashFlowEstimate(state), flow = calculateMonthlyCashFlow(state), shields: string[] = [];
  shields.push(est.passive > 0 ? `Passive income already covers ${Math.round(est.passive / Math.max(1, est.expenses) * 100)}% of your bills` : 'No passive income yet: this job is your only engine');
  if (flow.sideHustleIncome > 0) shields.push('A side hustle gives you a second engine');
  shields.push(state.education.degrees.length ? `${state.education.degrees.length} qualification${state.education.degrees.length === 1 ? '' : 's'} on file` : 'No qualifications on file yet');
  return { score, vulnerability, label: score >= 80 ? 'Resilient' : score >= 50 ? 'Exposed' : 'At risk', text: info?.specialMechanic ?? 'Every field is changing; people who keep learning keep their options.', shields };
}

export function managerLine(state: GameState): string {
  const out = promotionOutlook(state);
  if ((state.jobLossMonthsRemaining ?? 0) > 0) return 'Come back when you are working again. Your desk will be here.';
  if (out.top) return 'You run this place now. Keep it that way.';
  if (out.eligible) return `You are ready for ${out.next!.title}. Ask me.`;
  if (out.monthsShort > 0) return `${out.monthsShort} more month${out.monthsShort === 1 ? '' : 's'} and we talk about ${out.next!.title}.`;
  return `${out.next!.title} needs a ${out.educationNeeded}. Night school?`;
}

export type WorkBoard = { title: string; lines: { label: string; amount: string }[]; net: string; ladder: { title: string; salary: string; state: 'done' | 'current' | 'next' | 'later' }[]; headline: string };
export function workBoard(state: GameState): WorkBoard {
  const stub = payStub(state), info = state.career ? CAREER_PATHS[state.career.path] : undefined, level = state.career?.level ?? 0;
  return {
    title: `PAYROLL · ${stub.title.toUpperCase()}`,
    lines: [...stub.lines.map(l => ({ label: l.label, amount: money(l.amount) })), { label: 'Income tax (your share)', amount: money(-stub.tax) }],
    net: money(stub.net),
    ladder: (info?.levels ?? []).map((l, i) => ({ title: l.title, salary: money(l.baseSalary), state: i < level - 1 ? 'done' : i === level - 1 ? 'current' : i === level ? 'next' : 'later' })),
    headline: managerLine(state),
  };
}
