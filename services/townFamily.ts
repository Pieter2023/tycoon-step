import type { GameState, Child } from '../types';
import { CAREER_PATHS, MARKET_ITEMS } from '../constants';
import { calculateMonthlyCashFlowEstimate } from './gameLogic';
import { incomeYield } from './investmentModel';
import { transferTownSavings, savingsBalance } from './townActivities';
import { tl } from '../i18n/town';

// The family at home. Relationships, weddings and births arrive as dashboard events; this module
// reads the family the events produced and explains what it costs, earns and will need. The one
// action, the college fund, moves real money into the Community Bank savings account through the
// same transfer the teller uses; the per-child tally in townProgress is the player's own note.
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const ADULT_MONTHS = 216, COLLEGE_TARGET = 60000, CHILD_TAX_DEDUCTION = 2000, FUND_STEPS = [250, 1000];
export type Stage = 'expected' | 'infant' | 'preschool' | 'school' | 'teen' | 'college' | 'independent';
// Same age bands and amounts as calculateChildrenExpenses.
export const stageOf = (ageMonths: number, inCollege = false): Stage => ageMonths < 0 ? 'expected' : ageMonths < 24 ? 'infant' : ageMonths < 60 ? 'preschool' : ageMonths < 144 ? 'school' : ageMonths < ADULT_MONTHS ? 'teen' : ageMonths < 264 && inCollege ? 'college' : 'independent';
export const STAGE_COST: Record<Stage, number> = { expected: 300, infant: 1200, preschool: 1000, school: 600, teen: 800, college: 1500, independent: 0 };
export const stageName = (stage: Stage) => ({ expected: tl('on the way','en camino'), infant: tl('baby','bebé'), preschool: tl('preschooler','en preescolar'), school: tl('at school','en la escuela'), teen: tl('teenager','adolescente'), college: tl('at college','en la universidad'), independent: tl('independent','independiente') })[stage];
const NEXT: Partial<Record<Stage, Stage>> = { expected: 'infant', infant: 'preschool', preschool: 'school', school: 'teen', teen: 'independent' };
const STAGE_START: Record<Stage, number> = { expected: -9, infant: 0, preschool: 24, school: 60, teen: 144, college: ADULT_MONTHS, independent: ADULT_MONTHS };

const savingsRate = () => { const item = MARKET_ITEMS.find(i => i.id === 'hysa'); return item ? incomeYield(item) / 12 : 0; };
// What the child costs from now until 18, month by month on the same bands the turn charges.
export const remainingToAdulthood = (ageMonths: number) => { let total = 0; for (let m = ageMonths; m < ADULT_MONTHS; m++) total += STAGE_COST[stageOf(m)]; return total; };
// Future value of what is set aside plus a level monthly saving, at the savings account's yield.
export const grow = (principal: number, monthly: number, months: number, r = savingsRate()) => months <= 0 ? principal : r > 0 ? principal * Math.pow(1 + r, months) + monthly * (Math.pow(1 + r, months) - 1) / r : principal + monthly * months;
export const monthlyToReach = (target: number, principal: number, months: number, r = savingsRate()) => { if (months <= 0) return Math.max(0, target - principal); const projected = grow(principal, 0, months, r); if (projected >= target) return 0; return r > 0 ? (target - projected) * r / (Math.pow(1 + r, months) - 1) : (target - projected) / months; };

export type ChildCard = { id: string; name: string; ageMonths: number; ageYears: number; stage: Stage; stageLabel: string; monthly: number; monthsTo18: number; next?: { stage: Stage; label: string; inMonths: number; monthly: number }; remaining: number; fund: number; fundProjected: number; fundMonthly: number; fundTarget: number; canFund: boolean };
export function childCard(state: GameState, child: Child): ChildCard {
  const ageMonths = state.month - child.birthMonth, stage = stageOf(ageMonths, child.inCollege), monthsTo18 = Math.max(0, ADULT_MONTHS - ageMonths);
  const nextStage = NEXT[stage], next = nextStage ? { stage: nextStage, label: stageName(nextStage), inMonths: Math.max(1, STAGE_START[nextStage] - ageMonths), monthly: STAGE_COST[nextStage] } : undefined;
  const fund = state.townProgress?.collegeFund?.[child.id] ?? 0;
  return { id: child.id, name: child.name, ageMonths, ageYears: Math.max(0, Math.floor(ageMonths / 12)), stage, stageLabel: stageName(stage), monthly: STAGE_COST[stage], monthsTo18, next, remaining: remainingToAdulthood(Math.max(ageMonths, -9)), fund, fundProjected: Math.round(grow(fund, 0, monthsTo18)), fundMonthly: Math.round(monthlyToReach(COLLEGE_TARGET, fund, monthsTo18)), fundTarget: COLLEGE_TARGET, canFund: ageMonths < ADULT_MONTHS };
}

export type HouseholdStatus = 'single' | 'dating' | 'engaged' | 'married';
export type Household = { status: HouseholdStatus; statusLabel: string; spouse?: { name: string; job: string; income: number; yearsMarried: number; share: number; coverage: number }; children: ChildCard[]; childrenMonthly: number; taxBreak: number; headline: string };
export function household(state: GameState): Household {
  const f = state.family, flow = calculateMonthlyCashFlowEstimate(state);
  const status: HouseholdStatus = f?.spouse ? 'married' : f?.isEngaged ? 'engaged' : f?.inRelationship ? 'dating' : 'single';
  const statusLabel = { single: tl('Single','Sin pareja'), dating: tl('In a relationship','En una relación'), engaged: tl('Engaged','Comprometido'), married: tl('Married','Casado') }[status];
  const children = (f?.children ?? []).map(c => childCard(state, c));
  const childrenMonthly = children.reduce((s, c) => s + c.monthly, 0);
  const spouse = f?.spouse ? { name: f.spouse.name, job: CAREER_PATHS[f.spouse.careerPath]?.name ?? f.spouse.careerPath, income: f.spouse.income, yearsMarried: Math.floor(Math.max(0, state.month - f.spouse.marriedMonth) / 12), share: Math.round(f.spouse.income / Math.max(1, flow.income) * 100), coverage: Math.round(f.spouse.income / Math.max(1, flow.expenses) * 100) } : undefined;
  const taxBreak = children.filter(c => c.ageMonths >= 0).length * CHILD_TAX_DEDUCTION;
  let headline: string;
  const oldest = [...children].sort((a, b) => b.ageMonths - a.ageMonths)[0];
  if (children.length && oldest) headline = `${children.length} ${tl(children.length === 1 ? 'child costs' : 'children cost', children.length === 1 ? 'hijo cuesta' : 'hijos cuestan')} ${money(childrenMonthly)} ${tl('a month.','al mes.')} ${oldest.stage === 'expected' ? `${oldest.name} ${tl('arrives in','llega en')} ${-oldest.ageMonths} ${tl('months.','meses.')}` : oldest.monthsTo18 > 0 ? `${oldest.name} ${tl('turns 18 in','cumple 18 en')} ${oldest.monthsTo18} ${tl('months.','meses.')}` : `${oldest.name} ${tl('is grown.','ya es adulto.')}`}`;
  else if (spouse) headline = `${spouse.name} ${tl('brings in','aporta')} ${money(spouse.income)} ${tl('a month:','al mes:')} ${spouse.share}% ${tl('of the household income.','de los ingresos del hogar.')}`;
  else if (status === 'engaged') headline = tl('Engaged. The wedding is the next big bill: $15,000 is the middle option.','Comprometidos. La boda es la próxima gran cuenta: $15,000 es la opción intermedia.');
  else if (status === 'dating') headline = tl('Seeing someone. A proposal costs a ring; a wedding costs a lot more.','Saliendo con alguien. Una propuesta cuesta un anillo; una boda cuesta mucho más.');
  else headline = tl('Nobody else on the lease yet.','Nadie más en el contrato todavía.');
  return { status, statusLabel, spouse, children, childrenMonthly, taxBreak, headline };
}

export type Figures = { spouse: boolean; crib: boolean; toys: boolean; children: number[] };
// Who is at home in the 3D flat: a spouse figure, a crib for a baby, a toy box, and a scaled
// figure per child old enough to stand about. Grown children have moved out.
export function householdFigures(state: GameState): Figures {
  const cards = (state.family?.children ?? []).map(c => childCard(state, c));
  return {
    spouse: !!state.family?.spouse,
    crib: cards.some(c => c.stage === 'infant'),
    toys: cards.some(c => c.stage === 'preschool' || c.stage === 'school'),
    children: cards.filter(c => c.stage === 'preschool' || c.stage === 'school' || c.stage === 'teen').slice(0, 3).map(c => c.stage === 'preschool' ? .5 : c.stage === 'school' ? .62 : .8),
  };
}

// Puts cash aside for a child's college in the Community Bank savings account (same transfer as
// the teller) and notes it against the child. Refused while an event waits, for grown children,
// for more than the cash on hand, or for a non-whole amount.
export function contributeCollegeFund(state: GameState, childId: string, amount: number): GameState {
  const child = state.family?.children?.find(c => c.id === childId);
  if (!child || state.month - child.birthMonth >= ADULT_MONTHS || !Number.isSafeInteger(amount) || amount <= 0 || amount > state.cash) return state;
  const next = transferTownSavings(state, { direction: 'deposit', amount });
  if (next === state) return state;
  const fund = { ...(state.townProgress?.collegeFund ?? {}), [childId]: (state.townProgress?.collegeFund?.[childId] ?? 0) + amount };
  return { ...next, townProgress: { ...next.townProgress, collegeFund: fund }, events: [{ id: `fund-${state.month}-${childId}-${Date.now()}`, month: state.month, title: `🎓 College fund: ${child.name}`, description: `${money(amount)} moved to savings for ${child.name}'s college. ${money(fund[childId])} set aside so far; ${money(savingsBalance(next))} in savings.`, type: 'DECISION' }, ...state.events] };
}
