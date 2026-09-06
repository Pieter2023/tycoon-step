import type { GameState, CareerPath } from '../types';
import { CAREER_PATHS, DIFFICULTY_SETTINGS, EDUCATION_OPTIONS } from '../constants';
import { isEducationRelevant } from './gameLogic';
import { tl } from '../i18n/town';

// Deeper career play at Main Street Offices. Two decisions with real consequences: asking for a
// raise (honest odds, a cooldown, and a consolation rise when it fails) and changing career path
// (a month between jobs, the ladder reset to rung one, a head start when your education fits).
// Nothing here uses the simulation's seeded rand: the city is never open during a daily challenge.
export const RAISE_COOLDOWN = 6, CAREER_CHANGE_COOLDOWN = 12, JOB_GAP_MONTHS = 1, RELEVANT_EDUCATION_CREDIT = 6;
export type RaiseAsk = 8 | 15;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const multiplier = (state: GameState) => DIFFICULTY_SETTINGS[state.difficulty as keyof typeof DIFFICULTY_SETTINGS]?.salaryMultiplier ?? 1;
const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export type RaiseOdds = { chance: number; factors: { label: string; delta: number }[]; eligible: boolean; reason?: string; monthsUntil: number };
export function raiseOdds(state: GameState, ask: RaiseAsk): RaiseOdds {
  const career = state.career, info = career ? CAREER_PATHS[career.path] : undefined;
  const lastAsk = state.townProgress?.lastRaiseAskMonth, monthsUntil = lastAsk === undefined ? 0 : Math.max(0, lastAsk + RAISE_COOLDOWN - state.month);
  if (!career || !info) return { chance: 0, factors: [], eligible: false, reason: tl('No career on file.', 'No hay una carrera registrada.'), monthsUntil: 0 };
  const factors: { label: string; delta: number }[] = [];
  let chance = .5;
  const network = clamp((state.stats.networking - 50) / 100 * .3, -.15, .15); factors.push({ label: tl('Your network', 'Tu red de contactos'), delta: network }); chance += network;
  const previous = info.levels[career.level - 1], next = info.levels[career.level];
  const progress = next && previous ? clamp((career.experience - previous.experienceRequired) / Math.max(1, next.experienceRequired - previous.experienceRequired), 0, 1) : 1;
  const tenure = progress * .15; factors.push({ label: tl('Time in the role', 'Tiempo en el puesto'), delta: tenure }); chance += tenure;
  if (ask === 15) { factors.push({ label: tl('A bold ask', 'Una petición audaz'), delta: -.15 }); chance -= .15; }
  if (state.economy?.recession) { factors.push({ label: tl('Recession budgets', 'Presupuestos en recesión'), delta: -.2 }); chance -= .2; }
  if (state.stats.stress > 70) { factors.push({ label: tl('Visible stress', 'Estrés visible'), delta: -.05 }); chance -= .05; }
  if (next && career.salary >= Math.round(next.baseSalary * multiplier(state))) { factors.push({ label: tl('Already paid above your rung', 'Ya cobras por encima de tu peldaño'), delta: -.1 }); chance -= .1; }
  chance = clamp(chance, .05, .9);
  if ((state.jobLossMonthsRemaining ?? 0) > 0) return { chance, factors, eligible: false, reason: tl('You are between jobs.', 'Estás sin empleo.'), monthsUntil };
  if (state.pendingScenario) return { chance, factors, eligible: false, reason: tl('Resolve the waiting event first.', 'Resuelve primero el evento pendiente.'), monthsUntil };
  if (monthsUntil > 0) return { chance, factors, eligible: false, reason: `${tl('You asked recently. Try again in', 'Preguntaste hace poco. Vuelve a intentarlo en')} ${monthsUntil} ${tl(monthsUntil === 1 ? 'month.' : 'months.', monthsUntil === 1 ? 'mes.' : 'meses.')}`, monthsUntil };
  return { chance, factors, eligible: true, monthsUntil };
}

export type RaiseResult = { state: GameState; asked: boolean; success: boolean; pct: number; oldSalary: number; newSalary: number; line: string };
export function askForRaise(state: GameState, ask: RaiseAsk, roll: () => number = Math.random): RaiseResult {
  const odds = raiseOdds(state, ask), career = state.career!;
  if (!odds.eligible || !career) return { state, asked: false, success: false, pct: 0, oldSalary: career?.salary ?? 0, newSalary: career?.salary ?? 0, line: odds.reason ?? '' };
  const success = roll() < odds.chance, pct = success ? ask : ask === 15 ? 3 : 2;
  const oldSalary = career.salary, newSalary = Math.round(oldSalary * (1 + pct / 100));
  const stats = { ...state.stats, happiness: clamp(state.stats.happiness + (success ? 10 : -5), 0, 100), stress: clamp(state.stats.stress + (success ? -5 : ask === 15 ? 10 : 5), 0, 100) };
  const line = success
    ? `${tl('Approved', 'Aprobado')}: ${pct}% ${tl('from next month', 'a partir del próximo mes')} (${money(oldSalary)} → ${money(newSalary)}).`
    : `${tl('Declined', 'Rechazado')}: ${tl('budget only stretches to', 'el presupuesto solo alcanza para')} ${pct}% (${money(oldSalary)} → ${money(newSalary)}).`;
  const next: GameState = {
    ...state, stats, career: { ...career, salary: newSalary }, playerJob: { ...state.playerJob, salary: newSalary },
    townProgress: { ...state.townProgress, lastRaiseAskMonth: state.month },
    events: [{ id: `raise-${state.month}`, month: state.month, title: success ? 'Raise approved' : 'Raise declined', description: `${success ? `Asked for ${ask}% and got it.` : `Asked for ${ask}%; management offered ${pct}%.`} Salary ${money(oldSalary)} → ${money(newSalary)} a month.`, type: 'DECISION' }, ...state.events],
  };
  return { state: next, asked: true, success, pct, oldSalary, newSalary, line };
}

export type JobListing = { path: CareerPath; name: string; icon: string; title: string; salary: number; futureProofScore: number; aiVulnerability: number; mechanic: string; relevantEducation: boolean; delta: number };
export function jobBoard(state: GameState): JobListing[] {
  const current = state.career?.path, currentSalary = state.career?.salary ?? state.playerJob?.salary ?? 0, mult = multiplier(state);
  const degrees = state.education.degrees.map(id => EDUCATION_OPTIONS.find(e => e.id === id)).filter(Boolean);
  return (Object.keys(CAREER_PATHS) as CareerPath[]).filter(p => p !== current).map(path => {
    const info = CAREER_PATHS[path], entry = info.levels[0], salary = Math.round(entry.baseSalary * mult);
    return { path, name: info.name, icon: info.icon, title: entry.title, salary, futureProofScore: info.futureProofScore, aiVulnerability: info.aiVulnerability, mechanic: info.specialMechanic ?? '', relevantEducation: degrees.some(d => d && isEducationRelevant(d.category, path)), delta: salary - currentSalary };
  }).sort((a, b) => b.futureProofScore - a.futureProofScore);
}

export function careerChangeEligibility(state: GameState): { eligible: boolean; reason?: string; monthsUntil: number } {
  const changed = state.townProgress?.careerChangedMonth, monthsUntil = changed === undefined ? 0 : Math.max(0, changed + CAREER_CHANGE_COOLDOWN - state.month);
  if (!state.career) return { eligible: false, reason: tl('No career on file.', 'No hay una carrera registrada.'), monthsUntil: 0 };
  if ((state.jobLossMonthsRemaining ?? 0) > 0) return { eligible: false, reason: tl('Finish your job search first.', 'Termina primero tu búsqueda de empleo.'), monthsUntil };
  if (state.pendingScenario) return { eligible: false, reason: tl('Resolve the waiting event first.', 'Resuelve primero el evento pendiente.'), monthsUntil };
  if (monthsUntil > 0) return { eligible: false, reason: `${tl('You changed careers recently. Employers want to see', 'Cambiaste de carrera hace poco. Los empleadores quieren ver')} ${monthsUntil} ${tl(monthsUntil === 1 ? 'more month here.' : 'more months here.', monthsUntil === 1 ? 'mes más aquí.' : 'meses más aquí.')}`, monthsUntil };
  return { eligible: true, monthsUntil };
}

// Changing path: entry title and pay on the new ladder, a month between jobs with no salary, a
// six-month experience credit when a qualification on file is relevant, and a year before the
// next change. Education, savings and assets are untouched; stress rises with the upheaval.
export function switchCareer(state: GameState, path: CareerPath): GameState {
  if (!careerChangeEligibility(state).eligible || !state.career || path === state.career.path) return state;
  const listing = jobBoard(state).find(j => j.path === path); if (!listing) return state;
  const info = CAREER_PATHS[path], experience = listing.relevantEducation ? RELEVANT_EDUCATION_CREDIT : 0;
  const career = { ...state.career, path, title: listing.title, salary: listing.salary, level: 1, experience, aiVulnerability: info.aiVulnerability, futureProofScore: info.futureProofScore };
  return {
    ...state, career, playerJob: { ...state.playerJob, title: listing.title, salary: listing.salary, level: 1, experience },
    jobLossMonthsRemaining: Math.max(state.jobLossMonthsRemaining ?? 0, JOB_GAP_MONTHS),
    stats: { ...state.stats, stress: clamp(state.stats.stress + 10, 0, 100), fulfillment: clamp((state.stats.fulfillment ?? 40) + 5, 0, 100) },
    townProgress: { ...state.townProgress, careerChangedMonth: state.month },
    events: [{ id: `career-change-${state.month}`, month: state.month, title: `Career change: ${info.name}`, description: `Left ${CAREER_PATHS[state.career.path].name} for ${listing.title} at ${money(listing.salary)} a month. ${JOB_GAP_MONTHS} month between jobs with no salary; the ladder restarts at rung one${listing.relevantEducation ? ` with ${RELEVANT_EDUCATION_CREDIT} months of credit for a relevant qualification` : ''}.`, type: 'DECISION' }, ...state.events],
  };
}
