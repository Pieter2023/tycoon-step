import { describe, it, expect, vi, afterEach } from 'vitest';
import { CHARACTERS, MARKET_ITEMS } from '../constants';
import { GameState } from '../types';
import { ownershipCostMonthly, closingCosts, pmiMonthly, approvalDraw } from '../services/propertyCosts';
import { createMortgage, processTurn, calculateAssetCashPayment, clearSimSeed } from '../services/gameLogic';
import { startState, buy } from './strategyHarness';

// Assessment §1's smaller issues: owning property costs tax and insurance as well as upkeep, buying costs
// closing costs, low-down loans carry mortgage insurance, and a lender's answer cannot be re-rolled.
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });
const alex = (): GameState => ({ ...startState(CHARACTERS.find(c => c.id === 'alex')!), month: 6 });

describe('the costs of owning property', () => {
  it('prices upkeep, tax and insurance, closing costs and mortgage insurance', () => {
    expect(ownershipCostMonthly(180000)).toBe(368);         // 1% + 1.1% + 0.35% a year
    expect(closingCosts(180000)).toBe(5400);                // 3%
    expect(pmiMonthly(173700, 3.5)).toBe(72);               // 0.5% of the loan a year under 20% down
    expect(pmiMonthly(144000, 20)).toBe(0);
  });
  it('takes the running costs out of the rent a property pays', () => {
    const home = MARKET_ITEMS.find(i => i.id === 'starter_home')!;
    const s = buy({ ...alex(), cash: 500000 }, home, 1), asset = s.assets[0];
    expect(calculateAssetCashPayment(s, asset, true)).toBeCloseTo(asset.cashFlow - ownershipCostMonthly(asset.value), 5);
  });
  it('gives the same lender answer all month, and a fresh one next month', () => {
    expect(approvalDraw(7, 'duplex:fha')).toBe(approvalDraw(7, 'duplex:fha'));
    const draws = Array.from({ length: 24 }, (_, m) => approvalDraw(m, 'duplex:fha'));
    expect(new Set(draws).size).toBe(24);
    expect(draws.every(d => d >= 0 && d < 1)).toBe(true);
  });
  it('drops mortgage insurance once the balance falls to 78% of the price', () => {
    const made = createMortgage('home-1', 'Starter Home', 200000, 'conventional_10', .06)!;
    expect(made.liability.pmi).toBe(75);                    // 0.5% of $180,000 a year
    expect(made.liability.pmiUntil).toBe(156000);
    const fha = createMortgage('home-2', 'Starter Home', 200000, 'fha', .06)!;
    expect(fha.liability.pmi).toBeGreaterThan(0);
    expect(fha.liability.pmiUntil).toBeUndefined();          // FHA insurance stays for the life of the loan
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const s = { ...alex(), cash: 50000, liabilities: [{ ...made.liability, balance: 156100 }], mortgages: [{ ...made.mortgage, balance: 156100 }] };
    const next = processTurn(s).newState;
    const loan = next.liabilities.find(l => l.id === made.liability.id)!;
    expect(loan.pmi).toBeUndefined();
    expect(loan.monthlyPayment).toBe(made.liability.monthlyPayment - 75);
    expect(next.mortgages[0].monthlyPayment).toBe(loan.monthlyPayment);
    expect(next.events.some(e => e.title.includes('Mortgage insurance ended'))).toBe(true);
  });
});
