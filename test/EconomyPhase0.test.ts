import { describe, it, expect, vi, afterEach } from 'vitest';
import { CHARACTERS, MARKET_ITEMS } from '../constants';
import { AssetType, GameState } from '../types';
import {
  processTurn, calculateMonthlyCashFlowEstimate, calculateAssetCashPayment, incomeTaxFor, STANDARD_DEDUCTION,
  businessUnits, nextBusinessUnitShare, businessIncomeRange, financialFreedom, updateAssetPrices, expectedPriceReturn,
  generateLifeEvent, CARD_ID, creditLimit, clearSimSeed, __testOnly_setBusinessSeed, calculateCreditScoreUpdate,
} from '../services/gameLogic';
import { mulberry32 } from '../services/dailyChallenge';
import { startState, buy } from './strategyHarness';

// The 2026-09-25 economy fix (assessment §1, Phase 0): prices earn their expected return, extra units
// of a business earn less and a business can lose money, shortfalls become card debt, tax is withheld
// monthly, and investments count toward freedom at the 4% rule.
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });
const alex = () => startState(CHARACTERS.find(c => c.id === 'alex')!);
const item = (id: string) => MARKET_ITEMS.find(i => i.id === id)!;

describe('income tax is withheld every month', () => {
  it('uses the standard deduction and brackets that rise with inflation', () => {
    expect(incomeTaxFor(STANDARD_DEDUCTION)).toBe(0);
    expect(incomeTaxFor(70000)).toBe(Math.round(5147 + (70000 - STANDARD_DEDUCTION - 44725) * .22));
    // A raise that only matches inflation leaves the tax rate unchanged.
    expect(Math.abs(incomeTaxFor(140000, 0, 2) - incomeTaxFor(70000) * 2)).toBeLessThanOrEqual(1);
    expect(incomeTaxFor(70000, 2)).toBe(incomeTaxFor(70000) - 4000);
  });
  it('is a line in the monthly cash flow from month one', () => {
    const flow = calculateMonthlyCashFlowEstimate({ ...alex(), month: 1 });
    expect(flow.taxes).toBeGreaterThan(0);
    expect(flow.expenses).toBe(flow.lifestyleCost + flow.debtPayments + flow.educationPayment + flow.childrenExpenses + flow.vehicleCosts + flow.insurancePremiums + flow.taxes);
  });
  it('never arrives as an April lump sum', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.99);
    for (const month of [16, 28, 40]) expect(generateLifeEvent({ ...alex(), month })?.id).not.toBe('annual_taxes');
  });
});

describe('a shortfall becomes credit-card debt', () => {
  const broke = (): GameState => ({ ...alex(), cash: 0, lifestyle: 'LUXURIOUS', month: 6 });
  it('puts the gap on the card instead of forgiving it, with no missed payment inside the limit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    // About a $1,000 gap: spending runs ahead of pay and the cash only covers part of it.
    const flow = calculateMonthlyCashFlowEstimate(broke());
    expect(flow.income).toBeLessThan(flow.expenses);
    const s = { ...broke(), cash: flow.expenses - flow.income - 1000 };
    const next = processTurn(s).newState;
    const card = next.liabilities.find(l => l.id === CARD_ID)!;
    expect(next.cash).toBe(0);
    expect(card.balance).toBeGreaterThan(0);
    expect(card.interestRate).toBe(.24);
    expect(card.monthlyPayment).toBeGreaterThanOrEqual(35);
    expect(next.missedPayments ?? 0).toBe(0);
    expect(next.events.some(e => e.title.includes('credit card'))).toBe(true);
  });
  it('counts only the part past the limit as a missed payment', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const s = { ...broke(), liabilities: [{ id: CARD_ID, name: 'Credit card', balance: 50000, originalBalance: 50000, interestRate: .24, monthlyPayment: 1500, type: 'CREDIT_CARD' as const }] };
    expect(creditLimit(s)).toBeLessThan(50000);
    const next = processTurn(s).newState;
    expect(next.missedPayments).toBe(1);
    expect(next.liabilities.find(l => l.id === CARD_ID)!.balance).toBeGreaterThan(50000);
  });
});

describe('businesses', () => {
  it('earn less for each extra unit of the same business', () => {
    expect(businessUnits(1)).toBe(1);
    expect(businessUnits(2)).toBeCloseTo(1.75);
    expect(businessUnits(40)).toBeLessThan(4);
    expect(nextBusinessUnitShare(4)).toBeCloseTo(.75 ** 4);
    let s = { ...alex(), cash: 100000, townProgress: { permitMonth: 1 } } as GameState;
    s = buy(s, item('coffee_cart'), 3);
    const cart = s.assets.find(a => a.marketItemId === 'coffee_cart')!;
    expect(calculateAssetCashPayment(s, cart, true)).toBeCloseTo(cart.cashFlow * businessUnits(3), 5);
  });
  it('can run at a loss in a bad month', () => {
    let s = { ...alex(), cash: 500000, month: 3 } as GameState;
    s = buy(s, item('saas'), 1);
    const saas = s.assets.find(a => a.marketItemId === 'saas')!;
    expect(businessIncomeRange(saas).min).toBeLessThan(0);
    __testOnly_setBusinessSeed(7); vi.spyOn(Math, 'random').mockImplementation(mulberry32(3));
    const incomes: number[] = [];
    for (let m = 0; m < 36; m++) { s = { ...processTurn(s).newState, pendingScenario: null }; incomes.push(s.assets.find(a => a.marketItemId === 'saas')!.currentMonthIncome!); }
    expect(Math.min(...incomes)).toBeLessThan(0);
    expect(incomes.reduce((a, b) => a + b, 0) / incomes.length).toBeGreaterThan(0);
  });
});

describe('prices earn their expected return', () => {
  it('drifts an index fund at its expected price return, with no hidden crash rule', () => {
    const sp = item('sp500');
    expect(expectedPriceReturn({ type: sp.type, marketItemId: sp.id })).toBeCloseTo(.085);
    const rng = mulberry32(42); vi.spyOn(Math, 'random').mockImplementation(rng);
    let total = 0, below = 0; const paths = 1500;
    for (let p = 0; p < paths; p++) {
      let s = { ...buy({ ...alex(), cash: 10000 }, sp, 1), marketCycle: { phase: 'PEAK' as const, monthsInPhase: 0, nextPhaseIn: 24, intensity: .5 } } as GameState;
      for (let m = 0; m < 12; m++) s = updateAssetPrices(s);
      const growth = s.assets[0].value / 500; total += growth; if (growth < 1) below++;
    }
    expect(total / paths).toBeGreaterThan(1.06);
    expect(total / paths).toBeLessThan(1.11);
    expect(below / paths).toBeLessThan(.35);   // losing years happen, a bit under a third of the time
  });
  it('gives a volatile growth stock a lower typical return than its average one', () => {
    const g = item('growth'); const rng = mulberry32(9); vi.spyOn(Math, 'random').mockImplementation(rng);
    const finals: number[] = [];
    for (let p = 0; p < 800; p++) { let s = { ...buy({ ...alex(), cash: 10000 }, g, 1), marketCycle: { phase: 'PEAK' as const, monthsInPhase: 0, nextPhaseIn: 24, intensity: .5 } } as GameState; for (let m = 0; m < 12; m++) s = updateAssetPrices(s); finals.push(s.assets[0].value / 800); }
    finals.sort((a, b) => a - b);
    const mean = finals.reduce((a, b) => a + b, 0) / finals.length, median = finals[finals.length >> 1];
    expect(median).toBeGreaterThan(1);          // no blanket 1%-a-month crash dragging the median below zero
    expect(median).toBeLessThan(mean);
  });
});

describe('financial freedom', () => {
  it('counts investments at 4% of their value and savings only above inflation', () => {
    let s = { ...alex(), cash: 400000 } as GameState;
    const base = financialFreedom(s);
    const withIndex = financialFreedom(buy(s, item('sp500'), 400));
    expect(withIndex.income - base.income).toBeCloseTo(400 * 500 * .04 / 12, -1);
    const withSavings = financialFreedom(buy(s, item('hysa'), 200));
    // $200k at 4.5% pays $750 a month; only the 1.5% above 3% inflation ($250) counts toward freedom.
    expect(withSavings.income - base.income).toBeCloseTo(200000 * (.045 - .03) / 12, -1);
  });
  it('sets the target at 110% of living costs, not counting tax on a salary', () => {
    const s = alex(), flow = calculateMonthlyCashFlowEstimate(s), f = financialFreedom(s, flow);
    expect(f.target).toBe(Math.ceil((flow.expenses - flow.taxes) * 1.1));
  });
  it('wins the game when freedom income reaches the target', () => {
    let s = { ...alex(), cash: 3000000, month: 10 } as GameState;
    s = buy(s, item('sp500'), 5000);
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    expect(processTurn(s).newState.hasWon).toBe(true);
  });
});

describe('credit score', () => {
  it('climbs slowly near the top instead of reaching 850 in a debt-free year and a half', () => {
    let s = { ...alex(), creditRating: 650, liabilities: [] } as GameState; const flow = { income: 5775, debtPayments: 0 };
    const monthsTo = (target: number) => { let m = 0, st = s; while ((st.creditRating ?? 650) < target && m < 400) { const u = calculateCreditScoreUpdate(st, st, flow, false); st = { ...st, creditRating: u.score }; m++; } return m; };
    expect(monthsTo(750)).toBeLessThan(18);              // good habits still show quickly
    expect(monthsTo(800)).toBeGreaterThan(24);
    expect(monthsTo(850)).toBeGreaterThan(60);
    // A missed payment still costs the full amount.
    expect(calculateCreditScoreUpdate({ ...s, creditRating: 800 }, { ...s, creditRating: 800 }, flow, true).delta).toBeLessThan(-25);
  });
});
