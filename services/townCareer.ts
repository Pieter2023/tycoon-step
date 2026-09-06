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
    jobLossMonthsRemaining: JOB_GAP_MONTHS,   // a fresh start replaces any longer search that was under way
    stats: { ...state.stats, stress: clamp(state.stats.stress + 10, 0, 100), fulfillment: clamp((state.stats.fulfillment ?? 40) + 5, 0, 100) },
    townProgress: { ...state.townProgress, careerChangedMonth: state.month },
    events: [{ id: `career-change-${state.month}`, month: state.month, title: `Career change: ${info.name}`, description: `Left ${CAREER_PATHS[state.career.path].name} for ${listing.title} at ${money(listing.salary)} a month. ${JOB_GAP_MONTHS} month between jobs with no salary; the ladder restarts at rung one${listing.relevantEducation ? ` with ${RELEVANT_EDUCATION_CREDIT} months of credit for a relevant qualification` : ''}.`, type: 'DECISION' }, ...state.events],
  };
}

// ---------------------------------------------------------------- performance reviews
// Every January the manager grades the year that closed. The score is built from things the
// player controls (stress, energy, networking, the desk actions taken) and things that happened
// (months between jobs). Grade A and B pay a bonus; D puts the player on notice, which doubles
// the layoff hazard until the next review. Factor ids are stored so the panel can label them
// in either language later.
export type ReviewFactorId = 'network' | 'stress' | 'energy' | 'happiness' | 'overtime' | 'training' | 'networking-events' | 'unemployed' | 'financial-iq' | 'recovery';
export type ReviewGrade = 'A' | 'B' | 'C' | 'D';
export type PerformanceReview = { month: number; year: number; score: number; grade: ReviewGrade; bonus: number; factors: { id: ReviewFactorId; delta: number }[] };
export const REVIEW_BONUS_PCT: Record<ReviewGrade, number> = { A: .6, B: .25, C: 0, D: 0 };
export const reviewFactorLabel = (id: ReviewFactorId) => ({
  network: tl('Network', 'Red de contactos'), stress: tl('Stress', 'Estrés'), energy: tl('Energy', 'Energía'), happiness: tl('Morale', 'Ánimo'), overtime: tl('Overtime months', 'Meses con horas extra'), training: tl('Training', 'Capacitación'), 'networking-events': tl('Networking events', 'Eventos de contactos'), unemployed: tl('Months between jobs', 'Meses sin empleo'), 'financial-iq': tl('Financial judgement', 'Criterio financiero'), recovery: tl('Recovery plan completed', 'Plan de recuperación completado'),
} as Record<ReviewFactorId, string>)[id];
export const gradeFor = (score: number): ReviewGrade => score >= 80 ? 'A' : score >= 62 ? 'B' : score >= 45 ? 'C' : 'D';
export function performanceReview(state: GameState): PerformanceReview | null {
  const career = state.career; if (!career || (state.jobLossMonthsRemaining ?? 0) > 0) return null;
  const s = state.stats, work = state.yearStats?.workActions ?? { overtime: 0, network: 0, training: 0 }, idle = state.yearStats?.monthsUnemployed ?? 0;
  const factors: { id: ReviewFactorId; delta: number }[] = ([
    { id: 'network', delta: clamp(Math.round((s.networking - 50) / 2), -15, 15) },
    { id: 'stress', delta: s.stress <= 40 ? 10 : s.stress <= 60 ? 4 : s.stress <= 80 ? -5 : -12 },
    { id: 'energy', delta: s.energy >= 60 ? 5 : s.energy < 35 ? -6 : 0 },
    { id: 'happiness', delta: s.happiness >= 65 ? 5 : s.happiness < 35 ? -5 : 0 },
    { id: 'overtime', delta: Math.min(12, work.overtime * 3) },
    { id: 'training', delta: Math.min(8, work.training * 4) },
    { id: 'networking-events', delta: Math.min(6, work.network * 2) },
    { id: 'unemployed', delta: -Math.min(24, idle * 8) },
    { id: 'financial-iq', delta: s.financialIQ >= 60 ? 3 : 0 },
    { id: 'recovery', delta: state.townProgress?.recoveryCredit ? state.townProgress.recoveryCredit.points : 0 },
  ] as { id: ReviewFactorId; delta: number }[]).filter(f => f.delta !== 0);
  const score = clamp(50 + factors.reduce((sum, f) => sum + f.delta, 0), 0, 100), grade = gradeFor(score);
  return { month: state.month, year: Math.max(1, Math.floor((state.month - 2) / 12) + 1), score, grade, bonus: Math.round(career.salary * REVIEW_BONUS_PCT[grade]), factors };
}
// Applied at the January boundary by processTurn (never in a challenge). Returns the fields to merge.
export function applyPerformanceReview(state: GameState): Partial<GameState> {
  const review = performanceReview(state); if (!review) return {};
  const grade = review.grade, verdict = grade === 'A' ? 'Outstanding year.' : grade === 'B' ? 'Solid year.' : grade === 'C' ? 'Met expectations, barely.' : 'On notice: improve or the next cut has your name on it.';
  return {
    cash: state.cash + review.bonus,
    townProgress: { ...state.townProgress, lastReview: review, recoveryCredit: undefined, noticeLiftedMonth: undefined },
    events: [{ id: `review-${state.month}`, month: state.month, title: `Performance review: ${grade}`, description: `${verdict} Score ${review.score}/100.${review.bonus ? ` Annual bonus ${money(review.bonus)} paid.` : ''}${grade === 'D' ? ' Layoff risk is doubled until the next review.' : ''}`, type: grade === 'D' ? 'WARNING' : 'ACHIEVEMENT' }, ...state.events],
  };
}
export const reviewPromotionBonus = (state: GameState) => { const r = state.townProgress?.lastReview; if (!r || state.month - r.month >= 12) return 0; if (r.grade === 'D' && noticeLifted(state)) return 0; return r.grade === 'A' ? .1 : r.grade === 'B' ? .04 : r.grade === 'D' ? -.05 : 0; };

// ---------------------------------------------------------------- layoffs and the job search
export const LAYOFF_BASE = .004, LAYOFF_MONTHS = 3;
export type LayoffHazard = { monthly: number; annual: number; factors: { label: string; multiplier: number }[] };
export function layoffHazard(state: GameState): LayoffHazard {
  const career = state.career; if (!career || (state.jobLossMonthsRemaining ?? 0) > 0) return { monthly: 0, annual: 0, factors: [] };
  const info = CAREER_PATHS[career.path], factors: { label: string; multiplier: number }[] = [];
  let monthly = LAYOFF_BASE;
  const exposure = .5 + info.aiVulnerability * 2.5; factors.push({ label: tl('AI exposure of your field', 'Exposición de tu campo a la IA'), multiplier: exposure }); monthly *= exposure;
  if (state.economy?.recession) { factors.push({ label: tl('Recession', 'Recesión'), multiplier: 2 }); monthly *= 2; }
  const review = state.townProgress?.lastReview; if (review && state.month - review.month < 12) { const grade = noticeLifted(state) ? 'C' : review.grade; const m = grade === 'A' ? .5 : grade === 'B' ? 1 : grade === 'C' ? 1.5 : 2.5; if (m !== 1) { factors.push({ label: `${tl('Last review', 'Última evaluación')}: ${grade}${noticeLifted(state) ? ` (${tl('notice lifted', 'aviso levantado')})` : ''}`, multiplier: m }); monthly *= m; } }
  if (career.level >= 4) { factors.push({ label: tl('Seniority', 'Antigüedad'), multiplier: .8 }); monthly *= .8; }
  monthly = clamp(monthly, 0, .05);
  return { monthly, annual: 1 - Math.pow(1 - monthly, 12), factors };
}
// Rolled once per turn by processTurn with the seeded rand. Returns the fields to merge.
export function applyLayoff(state: GameState, roll: number): Partial<GameState> {
  const hazard = layoffHazard(state); if (!state.career || hazard.monthly <= 0 || roll >= hazard.monthly) return {};
  const salary = state.career.salary, severance = Math.round(salary * clamp(.5 + state.career.experience / 24, .5, 3));
  const reason = state.economy?.recession ? tl('recession cuts', 'recortes por recesión') : CAREER_PATHS[state.career.path].aiVulnerability >= .5 ? tl('an AI restructuring', 'una reestructuración por IA') : tl('a restructuring', 'una reestructuración');
  return {
    cash: state.cash + severance,
    jobLossMonthsRemaining: Math.max(state.jobLossMonthsRemaining ?? 0, LAYOFF_MONTHS),
    stats: { ...state.stats, stress: clamp(state.stats.stress + 20, 0, 100), happiness: clamp(state.stats.happiness - 15, 0, 100) },
    townProgress: { ...state.townProgress, laidOffMonth: state.month },
    events: [{ id: `layoff-${state.month}`, month: state.month, title: 'Laid off', description: `Your role was cut in ${reason}. Severance of ${money(severance)} paid; no salary for ${LAYOFF_MONTHS} months unless you land something sooner. Search from the office, or take another path from the job board.`, type: 'WARNING' }, ...state.events],
  };
}
export type SearchOdds = { chance: number; eligible: boolean; reason?: string; factors: { label: string; delta: number }[] };
export function jobSearchOdds(state: GameState): SearchOdds {
  const career = state.career, factors: { label: string; delta: number }[] = [];
  if (!career) return { chance: 0, eligible: false, reason: tl('No career on file.', 'No hay una carrera registrada.'), factors };
  if ((state.jobLossMonthsRemaining ?? 0) === 0) return { chance: 0, eligible: false, reason: tl('You are working.', 'Estás trabajando.'), factors };
  let chance = .35;
  const network = clamp((state.stats.networking - 50) / 100 * .3, -.15, .15); factors.push({ label: tl('Your network', 'Tu red de contactos'), delta: network }); chance += network;
  const field = clamp((CAREER_PATHS[career.path].futureProofScore - 50) / 200, -.15, .25); factors.push({ label: tl('Demand for your field', 'Demanda de tu campo'), delta: field }); chance += field;
  if (state.economy?.recession) { factors.push({ label: tl('Recession', 'Recesión'), delta: -.1 }); chance -= .1; }
  chance = clamp(chance, .1, .8);
  if (state.pendingScenario) return { chance, eligible: false, reason: tl('Resolve the waiting event first.', 'Resuelve primero el evento pendiente.'), factors };
  if (state.townProgress?.lastSearchMonth === state.month) return { chance, eligible: false, reason: tl('You have applied everywhere this month. Try again next month, or take a different path from the board.', 'Ya postulaste a todo este mes. Intenta de nuevo el próximo mes, o toma otro camino en la bolsa de trabajo.'), factors };
  return { chance, eligible: true, factors };
}
export function jobSearch(state: GameState, roll: () => number = Math.random): { state: GameState; applied: boolean; success: boolean; line: string } {
  const odds = jobSearchOdds(state); if (!odds.eligible || !state.career) return { state, applied: false, success: false, line: odds.reason ?? '' };
  const success = roll() < odds.chance;
  const line = success ? tl('An offer came through: you start next month at your old title and pay.', 'Llegó una oferta: empiezas el próximo mes con tu mismo puesto y sueldo.') : tl('No offers this month. Keep the reserve intact and try again.', 'Sin ofertas este mes. Conserva la reserva y vuelve a intentarlo.');
  const next: GameState = {
    ...state,
    jobLossMonthsRemaining: success ? 0 : state.jobLossMonthsRemaining,
    stats: { ...state.stats, stress: clamp(state.stats.stress + (success ? -10 : 5), 0, 100), happiness: clamp(state.stats.happiness + (success ? 10 : -2), 0, 100) },
    townProgress: { ...state.townProgress, lastSearchMonth: state.month },
    events: success ? [{ id: `job-search-${state.month}`, month: state.month, title: 'Job search: offer accepted', description: `Back at ${state.career.title} from next month after ${state.jobLossMonthsRemaining} month${state.jobLossMonthsRemaining === 1 ? '' : 's'} of searching.`, type: 'DECISION' }, ...state.events] : state.events,
  };
  return { state: next, applied: true, success, line };
}

// ---------------------------------------------------------------- the one-on-one and the recovery plan
// The manager explains the last review factor by factor, projects the grade if the year ended
// today, and offers a three-month plan of two or three trackable goals drawn from the weakest
// factors. Goals count desk actions through a cumulative log (`townProgress.workLog`) so a plan
// can straddle January; the turn judges the plan when it ends. A completed plan credits the next
// review and lifts a D notice.
export type PlanGoalId = 'stress-down' | 'network-up' | 'overtime' | 'training' | 'networking-event' | 'recover' | 'land-job';
export type WorkLog = { overtime: number; network: number; training: number; recover: number };
export type PlanGoal = { id: PlanGoalId; target: number };
export type RecoveryPlan = { startMonth: number; endMonth: number; goals: PlanGoal[]; startLog: WorkLog; startNetworking: number; result?: 'completed' | 'missed'; judgedMonth?: number };
export const PLAN_MONTHS = 3, PLAN_CREDIT = 10;
export const emptyLog = (): WorkLog => ({ overtime: 0, network: 0, training: 0, recover: 0 });
export const workLogOf = (state: GameState): WorkLog => ({ ...emptyLog(), ...(state.townProgress?.workLog ?? {}) });

export const planGoalLabel = (goal: PlanGoal): string => ({
  'stress-down': `${tl('Bring stress down to', 'Baja el estrés a')} ${goal.target} ${tl('or less', 'o menos')}`,
  'network-up': `${tl('Lift networking to', 'Sube tu red de contactos a')} ${goal.target}`,
  overtime: `${tl('Work overtime', 'Haz horas extra')} ${goal.target} ${tl(goal.target === 1 ? 'month' : 'months', goal.target === 1 ? 'mes' : 'meses')}`,
  training: `${tl('Take skill training', 'Toma capacitación')} ${goal.target === 1 ? tl('once', 'una vez') : `${goal.target} ${tl('times', 'veces')}`}`,
  'networking-event': `${tl('Attend', 'Asiste a')} ${goal.target} ${tl(goal.target === 1 ? 'networking event' : 'networking events', goal.target === 1 ? 'evento de contactos' : 'eventos de contactos')}`,
  recover: `${tl('Take a recovery month', 'Toma un mes de descanso')}${goal.target > 1 ? ` ×${goal.target}` : ''}`,
  'land-job': tl('Land a job', 'Consigue un empleo'),
} as Record<PlanGoalId, string>)[goal.id];

export type MentorPoint = { id: ReviewFactorId | 'projection'; why: string; fix: string; delta?: number };
export type MentorTalk = { opener: string; projected: { grade: ReviewGrade; score: number } | null; points: MentorPoint[]; closing: string };
export function mentorTalk(state: GameState): MentorTalk {
  const review = state.townProgress?.lastReview, projectedReview = performanceReview(state), projected = projectedReview ? { grade: projectedReview.grade, score: projectedReview.score } : null;
  const source = review?.factors ?? projectedReview?.factors ?? [], s = state.stats;
  const advice: Record<ReviewFactorId, { why: string; fix: string }> = {
    stress: { why: tl('Stress above 60 reads as someone about to burn out; managers stop handing those people the interesting work.', 'Un estrés por encima de 60 se lee como alguien a punto de quemarse; los jefes dejan de darle el trabajo interesante a esas personas.'), fix: tl('Take a recovery month, and keep overtime to months when you can afford the energy.', 'Toma un mes de descanso y limita las horas extra a los meses en que te sobre energía.') },
    network: { why: tl('Promotions and raises go to people other people vouch for. A thin network makes every ask a cold ask.', 'Los ascensos y aumentos van a quien otros respaldan. Una red delgada convierte cada petición en una petición fría.'), fix: tl('One networking event a quarter is enough to move the needle.', 'Un evento de contactos por trimestre basta para mover la aguja.') },
    energy: { why: tl('Low energy shows up as missed details and slower months.', 'La poca energía se nota en detalles perdidos y meses más lentos.'), fix: tl('Rest before you stack more actions; energy is the budget for everything else.', 'Descansa antes de apilar más acciones; la energía es el presupuesto de todo lo demás.') },
    happiness: { why: tl('Morale leaks into the work. People notice.', 'El ánimo se filtra en el trabajo. La gente lo nota.'), fix: tl('Fix the money pressure first; most low morale here is a thin reserve.', 'Arregla primero la presión del dinero; casi todo el desánimo aquí es una reserva escasa.') },
    overtime: { why: tl('Extra hours are the clearest signal that you want the next rung.', 'Las horas extra son la señal más clara de que quieres el siguiente peldaño.'), fix: tl('One or two overtime months a year, when energy allows, is plenty.', 'Uno o dos meses de horas extra al año, cuando la energía lo permita, es suficiente.') },
    training: { why: tl('Skills are the only thing that travels with you if this role disappears.', 'Las habilidades son lo único que viaja contigo si este puesto desaparece.'), fix: tl('Skill training once a year keeps you current and lifts your judgement.', 'Una capacitación al año te mantiene al día y mejora tu criterio.') },
    'networking-events': { why: tl('Events are where the next job hears about you before you need it.', 'En los eventos el próximo empleo oye de ti antes de que lo necesites.'), fix: tl('Go to one; the $100 is the cheapest insurance in the game.', 'Ve a uno; los $100 son el seguro más barato del juego.') },
    unemployed: { why: tl('Months out of work drag the year down whatever else happened.', 'Los meses sin trabajo hunden el año pase lo que pase.'), fix: tl('Search every month you are out, and keep six months of bills in reach so a gap never forces a bad decision.', 'Busca cada mes que estés fuera, y ten seis meses de facturas a la mano para que una pausa nunca fuerce una mala decisión.') },
    'financial-iq': { why: tl('Financial judgement shows in how you handle the surprises.', 'El criterio financiero se nota en cómo manejas las sorpresas.'), fix: tl('Skill training raises it; so does reading the receipts you already get.', 'La capacitación lo sube; también leer los recibos que ya recibes.') },
    recovery: { why: tl('A completed plan counts.', 'Un plan completado cuenta.'), fix: tl('Keep the habits that got you here.', 'Conserva los hábitos que te trajeron hasta aquí.') },
  };
  const weak = source.filter(f => f.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3);
  const points: MentorPoint[] = weak.map(f => ({ id: f.id, delta: f.delta, ...advice[f.id] }));
  if (!points.length) {
    if (s.stress > 60) points.push({ id: 'stress', ...advice.stress });
    if (s.networking < 50) points.push({ id: 'network', ...advice.network });
    if (!points.length) points.push({ id: 'training', ...advice.training });
  }
  const opener = (state.jobLossMonthsRemaining ?? 0) > 0
    ? tl('Sit down. Losing a role is not the same as losing your value. Let us talk about what gets you back in.', 'Siéntate. Perder un puesto no es perder tu valor. Hablemos de qué te devuelve al trabajo.')
    : review ? (review.grade === 'D' ? tl('Sit down. That review was hard to write, and I would rather fix it with you than watch it repeat.', 'Siéntate. Esa evaluación fue difícil de escribir, y prefiero arreglarla contigo que verla repetirse.')
      : review.grade === 'C' ? tl('You met the bar. Let us talk about clearing it.', 'Cumpliste con lo justo. Hablemos de superarlo.')
      : tl('Good year. Let us make the next one count for the promotion.', 'Buen año. Hagamos que el siguiente cuente para el ascenso.'))
    : tl('No review on file yet. Here is how the year is shaping up.', 'Aún no hay evaluación registrada. Así va tomando forma el año.');
  const closing = tl('None of this needs money. It needs the next three months.', 'Nada de esto necesita dinero. Necesita los próximos tres meses.');
  return { opener, projected, points, closing };
}

export function proposeRecoveryPlan(state: GameState): PlanGoal[] {
  const s = state.stats, goals: PlanGoal[] = [];
  if ((state.jobLossMonthsRemaining ?? 0) > 0) goals.push({ id: 'land-job', target: 1 });
  if (s.stress > 60) goals.push({ id: 'stress-down', target: 55 });
  if (s.networking < 50) goals.push({ id: 'network-up', target: Math.min(100, Math.round(s.networking) + 10) });
  if (s.stress > 75 || s.energy < 40) goals.push({ id: 'recover', target: 1 });
  if (goals.length < 3 && (state.yearStats?.workActions?.training ?? 0) === 0) goals.push({ id: 'training', target: 1 });
  if (goals.length < 3 && (state.yearStats?.workActions?.network ?? 0) === 0) goals.push({ id: 'networking-event', target: 1 });
  if (goals.length < 2 && s.energy >= 50) goals.push({ id: 'overtime', target: 1 });
  return goals.slice(0, 3);
}
export function acceptRecoveryPlan(state: GameState): GameState {
  const active = state.townProgress?.recoveryPlan;
  if (!state.career || state.pendingScenario || (active && !active.result)) return state;
  const goals = proposeRecoveryPlan(state); if (!goals.length) return state;
  const plan: RecoveryPlan = { startMonth: state.month, endMonth: state.month + PLAN_MONTHS, goals, startLog: workLogOf(state), startNetworking: state.stats.networking };
  return { ...state, townProgress: { ...state.townProgress, recoveryPlan: plan }, events: [{ id: `plan-${state.month}`, month: state.month, title: 'Recovery plan agreed', description: `Three months, ${goals.length} goal${goals.length === 1 ? '' : 's'}: ${goals.map(g => planGoalLabel(g)).join('; ')}. Judged in month ${plan.endMonth}.`, type: 'DECISION' }, ...state.events] };
}
export function planProgress(state: GameState, plan: RecoveryPlan = state.townProgress!.recoveryPlan!): { goal: PlanGoal; value: number; done: boolean }[] {
  const log = workLogOf(state), s = state.stats;
  return plan.goals.map(goal => {
    const value = goal.id === 'stress-down' ? Math.round(s.stress) : goal.id === 'network-up' ? Math.round(s.networking) : goal.id === 'overtime' ? log.overtime - plan.startLog.overtime : goal.id === 'training' ? log.training - plan.startLog.training : goal.id === 'networking-event' ? log.network - plan.startLog.network : goal.id === 'recover' ? log.recover - plan.startLog.recover : (state.jobLossMonthsRemaining ?? 0) === 0 ? 1 : 0;
    const done = goal.id === 'stress-down' ? value <= goal.target : value >= goal.target;
    return { goal, value, done };
  });
}
// Called by processTurn each month (normal games). Returns the fields to merge once the plan ends.
export function judgeRecoveryPlan(state: GameState): Partial<GameState> {
  const plan = state.townProgress?.recoveryPlan; if (!plan || plan.result || state.month < plan.endMonth) return {};
  const progress = planProgress(state, plan), completed = progress.every(p => p.done);
  const review = state.townProgress?.lastReview;
  return {
    townProgress: { ...state.townProgress, recoveryPlan: { ...plan, result: completed ? 'completed' : 'missed', judgedMonth: state.month }, recoveryCredit: completed ? { month: state.month, points: PLAN_CREDIT } : state.townProgress?.recoveryCredit, noticeLiftedMonth: completed && review?.grade === 'D' ? state.month : state.townProgress?.noticeLiftedMonth },
    stats: completed ? { ...state.stats, stress: clamp(state.stats.stress - 8, 0, 100), happiness: clamp(state.stats.happiness + 6, 0, 100), fulfillment: clamp((state.stats.fulfillment ?? 40) + 5, 0, 100) } : state.stats,
    events: [{ id: `plan-result-${state.month}`, month: state.month, title: completed ? 'Recovery plan completed' : 'Recovery plan missed', description: completed ? `Every goal landed: ${progress.map(p => planGoalLabel(p.goal)).join('; ')}. The next review carries +${PLAN_CREDIT}${review?.grade === 'D' ? ' and the notice is lifted' : ''}.` : `Missed: ${progress.filter(p => !p.done).map(p => planGoalLabel(p.goal)).join('; ')}. No penalty beyond the review itself; agree another plan when you are ready.`, type: completed ? 'ACHIEVEMENT' : 'NEWS' }, ...state.events],
  };
}
export const noticeLifted = (state: GameState) => { const r = state.townProgress?.lastReview, lifted = state.townProgress?.noticeLiftedMonth; return !!r && r.grade === 'D' && lifted !== undefined && lifted > r.month; };
