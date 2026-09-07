import type { GameState, EducationOption, TabId } from '../types';
import { EDUCATION_OPTIONS, CAREER_PATHS } from '../constants';
import { calculateEffectiveMonthlySalary, getEducationSalaryMultiplier } from './gameLogic';
import { tl } from '../i18n/town';

// Freedom Square Community College: the city's front door to the Education tab. Every course is
// priced the way an investor prices anything: what it costs up front and on credit, what it adds
// to the salary each month once finished, and how many months until it has paid for itself.
// Enrolment goes through App's handleEnrollEducation (same deposit, loan and relevance rules);
// nothing here moves money.
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const EXPENSIVE_COURSE = 20000, DEPOSIT_SHARE = .1, STUDENT_LOAN_RATE = .065, SALARY_CAP = 3;
const LEVEL_ORDER = ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'];
export const levelName = (level: string) => ({ HIGH_SCHOOL: tl('High school','Secundaria'), CERTIFICATE: tl('Certificate','Certificado'), ASSOCIATE: tl('Associate','Técnico'), BACHELOR: tl('Bachelor','Licenciatura'), MASTER: tl('Master','Maestría'), MBA: 'MBA', PHD: tl('Doctorate','Doctorado'), LAW: tl('Law','Derecho'), MEDICAL: tl('Medicine','Medicina') } as Record<string, string>)[level] ?? level;

// Same amortisation the enrolment handler uses for the student loan.
export const loanPayment = (principal: number, annualRate: number, months: number) => { if (principal <= 0 || months <= 0) return 0; const r = annualRate / 12; return r ? Math.round(principal * r / (1 - Math.pow(1 + r, -months))) : Math.round(principal / months); };

export type CourseStatus = 'done' | 'enrolled' | 'busy' | 'locked' | 'short' | 'open';
export type CourseCard = {
  id: string; name: string; icon: string; level: string; category: string; cost: number; months: number;
  deposit: number; loan: number; loanPayment: number; totalCost: number;
  relevant: boolean; salaryNow: number; salaryAfter: number; gainMonthly: number; paybackMonths: number | null; capped: boolean;
  status: CourseStatus; reason?: string; option: EducationOption;
};

export function courseCard(state: GameState, edu: EducationOption): CourseCard {
  const path = state.career?.path ?? 'TECH';
  const relevant = edu.relevantCareers.includes(path);
  const deposit = edu.cost > EXPENSIVE_COURSE ? Math.round(edu.cost * DEPOSIT_SHARE) : edu.cost;
  const loan = edu.cost > EXPENSIVE_COURSE ? edu.cost - deposit : 0;
  const payment = loanPayment(loan, STUDENT_LOAN_RATE, edu.duration);
  const totalCost = deposit + payment * edu.duration;
  // Between jobs the effective salary is zero; the projection then uses the pay the job will resume at, so the payback still means something.
  const salaryNow = calculateEffectiveMonthlySalary(state) || (state.career?.salary ?? state.playerJob?.salary ?? 0);
  const multiplierNow = getEducationSalaryMultiplier(state), capped = multiplierNow >= SALARY_CAP;
  const multiplierAfter = Math.min(SALARY_CAP, multiplierNow * edu.salaryBoost);
  const salaryAfter = relevant && multiplierNow > 0 ? Math.round(salaryNow * multiplierAfter / multiplierNow) : salaryNow;
  const gainMonthly = Math.max(0, salaryAfter - salaryNow);
  const paybackMonths = gainMonthly > 0 ? edu.duration + Math.ceil(totalCost / gainMonthly) : null;
  const degrees = state.education?.degrees ?? [], enrolled = state.education?.currentlyEnrolled?.educationId;
  let status: CourseStatus = 'open', reason: string | undefined;
  if (degrees.includes(edu.id)) status = 'done';
  else if (enrolled === edu.id) status = 'enrolled';
  else if (enrolled) { status = 'busy'; reason = tl('Finish your current course first.','Termina tu curso actual primero.'); }
  else if (edu.requirements?.length && !edu.requirements.some(req => degrees.some(d => EDUCATION_OPTIONS.find(e => e.id === d)?.level === req))) { status = 'locked'; reason = `${tl('Needs a','Requiere un título de')} ${edu.requirements.map(levelName).join(tl(' or ',' o '))} ${tl('first.','antes.')}`; }
  else if (state.cash < deposit) { status = 'short'; reason = `${tl('Needs','Necesitas')} ${money(deposit)} ${loan > 0 ? tl('as a deposit; you have','de anticipo; tienes') : tl('up front; you have','por adelantado; tienes')} ${money(state.cash)}.`; }
  return { id: edu.id, name: edu.name, icon: edu.icon, level: edu.level, category: edu.category, cost: edu.cost, months: edu.duration, deposit, loan, loanPayment: payment, totalCost, relevant, salaryNow, salaryAfter, gainMonthly, paybackMonths, capped, status, reason, option: edu };
}

export type StudyPlan = { cards: CourseCard[]; relevant: CourseCard[]; other: CourseCard[]; best?: CourseCard; cheapest?: CourseCard; enrolled?: CourseCard; degrees: CourseCard[] };
// Relevant courses first, quickest payback first; everything else by price. `best` is the quickest
// payback the player can start today; `cheapest` the smallest deposit among relevant courses not yet held.
export function studyPlan(state: GameState): StudyPlan {
  const cards = EDUCATION_OPTIONS.map(edu => courseCard(state, edu));
  const relevant = cards.filter(c => c.relevant).sort((a, b) => (a.paybackMonths ?? 1e9) - (b.paybackMonths ?? 1e9) || a.cost - b.cost);
  const other = cards.filter(c => !c.relevant).sort((a, b) => a.cost - b.cost);
  const best = relevant.find(c => c.status === 'open' && c.paybackMonths !== null);
  const cheapest = relevant.filter(c => c.status !== 'done' && c.status !== 'enrolled').sort((a, b) => a.deposit - b.deposit)[0];
  return { cards, relevant, other, best, cheapest, enrolled: cards.find(c => c.status === 'enrolled'), degrees: cards.filter(c => c.status === 'done') };
}

export type Enrolment = { card: CourseCard; monthsRemaining: number; monthsDone: number; loanBalance: number; loanPayment: number } | undefined;
export function enrolment(state: GameState): Enrolment {
  const current = state.education?.currentlyEnrolled; if (!current?.educationId) return undefined;
  const edu = EDUCATION_OPTIONS.find(e => e.id === current.educationId); if (!edu) return undefined;
  const card = courseCard(state, edu);
  const loan = state.liabilities.find(l => l.type === 'STUDENT_LOAN' && l.name?.includes(edu.name));
  return { card, monthsRemaining: current.monthsRemaining, monthsDone: Math.max(0, edu.duration - current.monthsRemaining), loanBalance: loan?.balance ?? 0, loanPayment: loan?.monthlyPayment ?? 0 };
}

export function registrarLine(state: GameState): string {
  const now = enrolment(state), plan = studyPlan(state), path = state.career ? CAREER_PATHS[state.career.path]?.name : undefined;
  if (now) return `${now.monthsRemaining} ${tl(now.monthsRemaining === 1 ? 'month to go on' : 'months to go on', now.monthsRemaining === 1 ? 'mes para terminar' : 'meses para terminar')} ${now.card.name}. ${tl('The raise lands the month you finish.','El aumento llega el mes que termines.')}`;
  if (plan.best) return `${plan.best.name} ${tl('pays for itself in about','se paga sola en unos')} ${plan.best.paybackMonths} ${tl('months on your path.','meses en tu carrera.')}`;
  if (plan.cheapest) return `${tl('Save','Ahorra')} ${money(plan.cheapest.deposit)} ${tl('and','y')} ${plan.cheapest.name} ${tl('is your next step.','es tu siguiente paso.')}`;
  return `${tl('You hold every qualification','Ya tienes todos los títulos que')} ${path ? `${tl('a','una carrera de')} ${path} ${tl('career rewards.','premia.')}` : tl('your path rewards.','tu carrera premia.')} ${tl('The rest is experience.','El resto es experiencia.')}`;
}

export type Certificate = { id: string; name: string; certified: boolean; bestScore: number; total: number; perk: string; tab: TabId };
// The four self-study certifications from the Learn page, read from the same state they write.
export function certificates(state: GameState): Certificate[] {
  const row = (id: string, name: string, course: { certified?: boolean; bestScore?: number } | undefined, total: number, perk: string, tab: TabId): Certificate => ({ id, name, certified: !!course?.certified, bestScore: course?.bestScore ?? 0, total, perk, tab });
  return [
    row('sales', tl('Sales accelerator','Acelerador de ventas'), state.salesAcceleratorCourse, 10, tl('Sharper side-hustle and business income','Ingresos extra y de negocio más fuertes'), 'self_learn'),
    row('compound', tl('Compound interest','Interés compuesto'), state.compoundInterestCourse, 10, tl('Understand why time beats timing','Entender por qué el tiempo vence al momento'), 'self_learn'),
    row('eq', tl('Emotional intelligence','Inteligencia emocional'), state.eqCourse, 15, tl('Lower stress, steadier decisions','Menos estrés, decisiones más firmes'), 'eq'),
    row('negotiations', tl('Master negotiations','Negociación avanzada'), state.negotiationsCourse, 15, tl('Better raise odds and purchase prices','Mejores probabilidades de aumento y precios'), 'negotiations'),
  ];
}

export type CollegeBoard = { title: string; rows: { name: string; payback: string; state: CourseStatus | 'other' }[]; headline: string; degrees: string[]; certified: number; certificates: { name: string; done: boolean }[] };
export function collegeBoard(state: GameState): CollegeBoard {
  const plan = studyPlan(state), path = state.career ? CAREER_PATHS[state.career.path]?.name : undefined, certs = certificates(state);
  const rows = plan.relevant.filter(c => c.status !== 'done').slice(0, 5).map(c => ({ name: `${c.icon} ${c.name}`, payback: c.paybackMonths === null ? '—' : `${c.paybackMonths} ${tl('mo','m')}`, state: c.status }));
  return {
    title: `${tl('STUDY PLAN','PLAN DE ESTUDIO')}${path ? ` · ${path.toUpperCase()}` : ''}`,
    rows, headline: registrarLine(state),
    degrees: plan.degrees.map(c => `${c.icon} ${c.name}`),
    certified: certs.filter(c => c.certified).length,
    certificates: certs.map(c => ({ name: c.name, done: c.certified })),
  };
}
