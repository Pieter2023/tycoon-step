import { vi } from 'vitest';
import { INITIAL_GAME_STATE, DIFFICULTY_SETTINGS, CAREER_PATHS, MARKET_ITEMS, getInitialQuestState } from '../constants';
import { AssetType, GameState, Character, MarketItem } from '../types';
import { processTurn, applyScenarioOutcome, calculateMonthlyCashFlowEstimate, calculateNetWorth, financialFreedom } from '../services/gameLogic';
import { mulberry32 } from '../services/dailyChallenge';
import { optionLocked, settleClaim } from '../services/townInsurance';
import { incomeYield, nominalPrice } from '../services/investmentModel';

// Long-horizon strategy runs (up to 30 years) for the economy's ranking test. A scripted player keeps a
// three-month cash reserve, invests any surplus above it by one rule, and picks the cheapest open option
// in every event. The question is which rule reaches financial freedom, and how fast.
export type LongStrategy = 'index' | 'carts' | 'savings' | 'nothing';
export type LongRun = { char: string; strategy: LongStrategy; seed: number; won: boolean; winMonth: number | null; bankrupt: boolean; months: number; netWorth: number; coverage: number; detail?: Record<string, number | string>;
  /** First month freedom coverage reached each share (0.1, 0.25, 0.5, 0.75); null if never. */
  reached: Record<string, number | null> };
export type Difficulty = keyof typeof DIFFICULTY_SETTINGS;

const loanPayment = (p: number, r: number, n: number) => { const m = r / 12; return Math.round(p * m * Math.pow(1 + m, n) / (Math.pow(1 + m, n) - 1)); };
export const startState = (char: Character, difficulty: Difficulty = 'NORMAL'): GameState => {
  const diff = DIFFICULTY_SETTINGS[difficulty]; let cash = diff.startingCash + (char.startingBonus.type === 'cash' ? char.startingBonus.amount : 0);
  const liabilities: GameState['liabilities'] = [];
  if (char.startingBonus.amount < 0) { const d = Math.abs(char.startingBonus.amount); liabilities.push({ id: 'sl', name: 'Student Loans', balance: d, originalBalance: d, interestRate: .065, monthlyPayment: loanPayment(d, .065, 120), type: 'STUDENT_LOAN' }); cash = diff.startingCash; }
  const career = CAREER_PATHS[char.careerPath], salary = Math.round(career.levels[0].baseSalary * diff.salaryMultiplier);
  if ('startingDebt' in diff && diff.startingDebt) liabilities.push({ id: 'pl', name: 'Personal Loan', balance: diff.startingDebt, originalBalance: diff.startingDebt, interestRate: .10, monthlyPayment: loanPayment(diff.startingDebt, .10, 48), type: 'PERSONAL_LOAN' });
  return { ...structuredClone(INITIAL_GAME_STATE), character: char, difficulty, lifestyle: char.startingLifestyle ?? INITIAL_GAME_STATE.lifestyle, cash: Math.max(0, cash), reserveBaseline: Math.max(0, cash) - liabilities.reduce((n, l) => n + l.balance, 0), career: { path: char.careerPath, title: career.levels[0].title, salary, level: 1, experience: 0, skills: {}, aiVulnerability: career.aiVulnerability, futureProofScore: career.futureProofScore }, playerJob: { title: career.levels[0].title, salary, level: 1, experience: 0 }, liabilities, activeSideHustles: [], quests: getInitialQuestState(char.id) };
};

/** Cash purchase exactly as App's handleBuyAsset does it (same-name holdings merge). */
export const buy = (s: GameState, item: MarketItem, units: number): GameState => {
  const price = nominalPrice(item, s.month, s.economy.inflationRate), total = price * units;
  if (units < 1 || s.cash < total) return s;
  const assets = [...s.assets]; const i = assets.findIndex(a => a.name === item.name && !a.mortgageId);
  if (i >= 0) {
    const a = assets[i], quantity = a.quantity + units, costBasis = (a.costBasis * a.quantity + total) / quantity, cashFlow = incomeYield(item) * costBasis / 12;
    assets[i] = { ...a, quantity, value: price, costBasis, cashFlow, currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(cashFlow * quantity) : a.currentMonthIncome };
  } else {
    const cashFlow = incomeYield(item) * price / 12;
    assets.push({ id: `${item.id}-${s.month}`, name: item.name, type: item.type, value: price, costBasis: price, quantity: units, cashFlow, volatility: item.volatility, appreciationRate: incomeYield(item) * .4, priceHistory: [{ month: s.month, value: price }], baseYield: incomeYield(item), marketItemId: item.id, incomeModelVersion: 2, industry: item.industry, currentMonthIncome: item.type === AssetType.BUSINESS ? Math.round(cashFlow * units) : undefined, lastMonthIncome: item.type === AssetType.BUSINESS ? Math.round(cashFlow * units) : undefined });
  }
  return { ...s, cash: s.cash - total, assets };
};
const item = (id: string) => MARKET_ITEMS.find(i => i.id === id)!;
const MIX: Record<Exclude<LongStrategy, 'nothing'>, [string, number][]> = {
  index: [['sp500', .6], ['intl', .25], ['total', .15]],
  carts: [['coffee_cart', 1]],
  savings: [['hysa', 1]],
};

export const MILESTONE_SHARES = [.1, .25, .5, .75];
export function playLong(char: Character, strategy: LongStrategy, seed: number, years = 30, difficulty: Difficulty = 'NORMAL', onMonth?: (s: GameState) => void, prepare?: (s: GameState) => GameState): LongRun {
  const rng = mulberry32(seed); vi.spyOn(Math, 'random').mockImplementation(rng);
  let s = startState(char, difficulty); let winMonth: number | null = null;
  if (prepare) s = prepare(s);
  const reached: Record<string, number | null> = Object.fromEntries(MILESTONE_SHARES.map(x => [String(x), null]));
  // The cart earns nothing until its $60 permit is paid (the opening journey); the scripted cart owner pays it up front.
  if (strategy === 'carts') s = { ...s, cash: s.cash - 60, townProgress: { ...s.townProgress, permitMonth: 1 } };
  for (let m = 1; m <= years * 12; m++) {
    if (s.pendingScenario) {
      const open = s.pendingScenario.options.filter(o => !optionLocked(s, s.pendingScenario!.id, o.label));
      // A careful player counts a loan at its full balance (plus interest) and pays cash when the reserve allows it.
      const scored = open.map(o => { const cash = o.outcome.cashChange ?? 0; const claim = cash < 0 ? settleClaim(s, s.pendingScenario!.id, o.label, -cash) : null; const out = -(cash + (claim?.paid ?? 0)); return { o, out, cost: out + (o.outcome.addLiability?.balance ?? 0) * 1.15 }; });
      const affordable = scored.filter(x => x.out <= Math.max(0, s.cash));
      const pick = (affordable.length ? affordable : scored).reduce((a, b) => b.cost < a.cost ? b : a);
      s = applyScenarioOutcome(s, pick.o.outcome, pick.o.label);
      if (s.pendingScenario) s = applyScenarioOutcome(s, s.pendingScenario.options[0].outcome, s.pendingScenario.options[0].label);
    }
    if (strategy !== 'nothing') {
      const surplus = s.cash - calculateMonthlyCashFlowEstimate(s).expenses * 3;
      if (surplus > 0) for (const [id, share] of MIX[strategy]) { const it = item(id); s = buy(s, it, Math.floor(surplus * share / nominalPrice(it, s.month, s.economy.inflationRate))); }
    }
    s = processTurn(s).newState;
    onMonth?.(s);
    const cover = financialFreedom(s, calculateMonthlyCashFlowEstimate(s)).coverage;
    for (const x of MILESTONE_SHARES) if (reached[String(x)] === null && cover >= x) reached[String(x)] = s.month;
    if (s.hasWon && winMonth === null) winMonth = s.month;
    if (s.hasWon || s.isBankrupt) break;
  }
  const flow = calculateMonthlyCashFlowEstimate(s);
  return { reached, char: char.name, strategy, seed, won: winMonth !== null, winMonth, bankrupt: !!s.isBankrupt, months: s.month, netWorth: calculateNetWorth({ ...s, pendingScenario: null }), coverage: financialFreedom(s, flow).coverage, detail: { cash: Math.round(s.cash), portfolio: Math.round(s.assets.reduce((n, a) => n + a.value * a.quantity, 0)), expenses: flow.expenses, lifestyle: flow.lifestyleCost, lifestyleTier: s.lifestyle, debt: flow.debtPayments, kids: flow.childrenExpenses, cars: flow.vehicleCosts, ins: flow.insurancePremiums, salary: flow.salary, passive: flow.passive, freedomIncome: financialFreedom(s, flow).income, target: financialFreedom(s, flow).target, liab: Math.round(s.liabilities.reduce((n, l) => n + l.balance, 0)) } };
}

export const median = (xs: number[]) => { if (!xs.length) return NaN; const v = [...xs].sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
