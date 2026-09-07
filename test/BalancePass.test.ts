import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, DIFFICULTY_SETTINGS, CAREER_PATHS, MARKET_ITEMS, getInitialQuestState } from '../constants';
import { AssetType, GameState, Character } from '../types';
import { processTurn, applyScenarioOutcome, calculateMonthlyCashFlowEstimate, calculateNetWorth, clearSimSeed } from '../services/gameLogic';
import { mulberry32 } from '../services/dailyChallenge';
import { buyPolicy, settleClaim, optionLocked, COVERAGE } from '../services/townInsurance';
import { buyVehicle } from '../services/townGarage';
import { studyPlan } from '../services/townCollege';
import { incomeYield } from '../services/investmentModel';

// A headless 36-month demo run (the free tier's whole length) for every character under three
// scripted players, seeded so the numbers are stable. It guards the balance envelope the city's
// mechanics were tuned to on 2026-09-07: insurance protects without bankrupting the buyer, a
// financed cheap car is a cost rather than a trap, and a certificate pays back inside the demo.
const loanPayment = (p: number, r: number, n: number) => { const m = r / 12; return Math.round(p * m * Math.pow(1 + m, n) / (Math.pow(1 + m, n) - 1)); };
const start = (char: Character): GameState => {
  const diff = DIFFICULTY_SETTINGS.NORMAL; let cash = diff.startingCash + (char.startingBonus.type === 'cash' ? char.startingBonus.amount : 0);
  const liabilities: GameState['liabilities'] = [];
  if (char.startingBonus.amount < 0) { const d = Math.abs(char.startingBonus.amount); liabilities.push({ id: 'sl', name: 'Student Loans', balance: d, originalBalance: d, interestRate: .065, monthlyPayment: loanPayment(d, .065, 120), type: 'STUDENT_LOAN' }); cash = diff.startingCash; }
  const career = CAREER_PATHS[char.careerPath], salary = Math.round(career.levels[0].baseSalary * diff.salaryMultiplier);
  return { ...structuredClone(INITIAL_GAME_STATE), character: char, difficulty: 'NORMAL', lifestyle: char.startingLifestyle ?? INITIAL_GAME_STATE.lifestyle, cash: Math.max(0, cash), reserveBaseline: Math.max(0, cash) - liabilities.reduce((n, l) => n + l.balance, 0), career: { path: char.careerPath, title: career.levels[0].title, salary, level: 1, experience: 0, skills: {}, aiVulnerability: career.aiVulnerability, futureProofScore: career.futureProofScore }, playerJob: { title: career.levels[0].title, salary, level: 1, experience: 0 }, liabilities, activeSideHustles: [], quests: getInitialQuestState(char.id) };
};
const invest = (s: GameState, amount: number): GameState => {
  const item = MARKET_ITEMS.find(i => i.id === 'sp500')!; const qty = Math.floor(amount / item.price); if (qty < 1) return s;
  return { ...s, cash: s.cash - qty * item.price, assets: [...s.assets, { id: `sp-${s.month}`, marketItemId: item.id, incomeModelVersion: 2, name: item.name, type: AssetType.INDEX_FUND, value: item.price, costBasis: item.price, quantity: qty, cashFlow: item.price * incomeYield(item) / 12, volatility: item.volatility, appreciationRate: item.expectedYield, baseYield: incomeYield(item), priceHistory: [{ month: s.month, value: item.price }] } as GameState['assets'][number]] };
};
export type Strategy = 'coaster' | 'saver' | 'driver';
export type Run = { char: string; strategy: Strategy; bankrupt: boolean; cash: number; netWorth: number; premiums: number; shocks: number; enrolled: boolean; graduated: boolean; salaryStart: number; salaryEnd: number };
export function play(char: Character, strategy: Strategy, seed: number): Run {
  const rng = mulberry32(seed); vi.spyOn(Math, 'random').mockImplementation(rng);
  let s = start(char); const salaryStart = s.career!.salary; let shocks = 0, enrolled = false;
  for (let month = 1; month <= 36; month++) {
    const flow = calculateMonthlyCashFlowEstimate(s);
    if (strategy === 'saver') {
      if (month === 1) s = buyPolicy(s, 'health', 2000);
      if (!enrolled) { const best = studyPlan(s).best; if (best && best.paybackMonths !== null && best.paybackMonths <= 24 && s.cash - best.deposit >= flow.expenses * 2) { s = { ...s, cash: s.cash - best.deposit, education: { ...s.education, currentlyEnrolled: { educationId: best.id, monthsRemaining: best.months, monthlyPayment: 0 } } }; enrolled = true; } }
      const surplus = s.cash - flow.expenses * 2; if (surplus > 1000) s = invest(s, Math.floor(surplus * .5));
    }
    if (strategy === 'driver' && month === 2) s = buyVehicle({ ...s, vehicles: [] }, 'hatch', true);
    // Events: the cheapest open option after any insurance payout, as a careful player would choose.
    if (s.pendingScenario) {
      const open = s.pendingScenario.options.filter(o => !optionLocked(s, s.pendingScenario!.id, o.label));
      const pick = open.map(o => { const cash = o.outcome.cashChange ?? 0; const claim = cash < 0 ? settleClaim(s, s.pendingScenario!.id, o.label, -cash) : null; return { o, net: cash + (claim?.paid ?? 0) }; }).reduce((a, b) => b.net > a.net ? b : a);
      const cost = -(pick.o.outcome.cashChange ?? 0); if (cost > 0) shocks += cost;
      s = applyScenarioOutcome(s, pick.o.outcome, pick.o.label);
      if (s.pendingScenario) s = applyScenarioOutcome(s, s.pendingScenario.options[0].outcome, s.pendingScenario.options[0].label);
    }
    s = processTurn(s).newState;
    if (s.isBankrupt) break;
  }
  return { char: char.name, strategy, bankrupt: !!s.isBankrupt, cash: s.cash, netWorth: calculateNetWorth({ ...s, pendingScenario: null }), premiums: s.insurance?.premiumsPaid ?? 0, shocks, enrolled, graduated: enrolled && !s.education.currentlyEnrolled?.educationId, salaryStart, salaryEnd: s.career?.salary ?? 0 };
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });
describe('balance envelope over a 36-month demo run', () => {
  const runs: Run[] = [];
  for (const char of CHARACTERS) for (const strategy of ['coaster', 'saver', 'driver'] as Strategy[]) for (const seed of [1, 2]) runs.push(play(char, strategy, seed * 7919 + char.id.length));
  const of = (strategy: Strategy) => runs.filter(r => r.strategy === strategy);
  it('an insured, investing, studying player never goes bankrupt and ends ahead of a coaster', () => {
    const saver = of('saver'), coaster = of('coaster');
    expect(saver.filter(r => r.bankrupt)).toEqual([]);
    // Cover and study cost money up front; over the demo they should not cost more than a slice of net worth (six-seed runs put the saver ahead; two seeds are noisier).
    expect(mean(saver.map(r => r.netWorth))).toBeGreaterThan(mean(coaster.map(r => r.netWorth)) * .85);
    // Marcus bootstraps from a frugal flat on a founder's draw: doing nothing is survivable, not a scripted bankruptcy.
    expect(coaster.filter(r => r.char === 'Marcus Johnson' && !r.bankrupt).length).toBeGreaterThan(0);
    expect(mean(saver.map(r => r.shocks))).toBeLessThan(mean(coaster.map(r => r.shocks)));
  });
  it('health cover costs what the price list says and is mostly money gone, as intended', () => {
    const saver = of('saver'); const premium = COVERAGE.health.base[1];
    for (const r of saver) expect(r.premiums).toBeLessThanOrEqual(36 * Math.round(premium * 1.6));
    const saved = mean(of('coaster').map(r => r.shocks)) - mean(saver.map(r => r.shocks));
    expect(saved).toBeGreaterThan(0); expect(saved).toBeLessThan(mean(saver.map(r => r.premiums)));
  });
  it('a financed cheap car is a cost, not a trap', () => {
    const driver = of('driver'), coaster = of('coaster');
    expect(driver.filter(r => r.bankrupt).length).toBeLessThanOrEqual(coaster.filter(r => r.bankrupt).length + 3);
    expect(mean(driver.map(r => r.cash))).toBeGreaterThan(mean(coaster.map(r => r.cash)) * .6);
  });
  it('a certificate on the career path pays back inside the demo for some characters', () => {
    const saver = of('saver');
    const graduates = saver.filter(r => r.graduated);
    expect(graduates.length).toBeGreaterThan(0);
    // Promotions are random; the certificate's raise is not. Every graduate ends above where they started.
    for (const r of graduates) expect(r.salaryEnd).toBeGreaterThan(r.salaryStart);
  });
});
