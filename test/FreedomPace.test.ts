import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS, MARKET_ITEMS } from '../constants';
import { calculateMonthlyCashFlowEstimate, clearSimSeed } from '../services/gameLogic';
import { freedomPace, paceLabel, PACE_REAL_RETURN } from '../services/freedomPace';
import { buy, playLong, startState } from './strategyHarness';

// "Free in about N years at this pace": the FIRE-calculator answer shown next to the freedom meter.
const alex = CHARACTERS.find(c => c.id === 'alex')!;
const sp500 = MARKET_ITEMS.find(i => i.id === 'sp500')!;
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });

describe('freedomPace', () => {
  it('gives a date for a new player who saves, and never draws a random number', () => {
    const random = vi.spyOn(Math, 'random');
    const pace = freedomPace(startState(alex));
    expect(pace.status).toBe('on-track');
    // Alex saves about $2,500 a month of a $5,775 salary: a few decades out before any raise.
    if (pace.status === 'on-track') expect(pace.months).toBeGreaterThan(12 * 15);
    expect(random).not.toHaveBeenCalled();
  });

  it('comes closer with a lower budget, and with money already invested', () => {
    const base = startState(alex);
    const months = (s: typeof base) => { const p = freedomPace(s); return p.status === 'on-track' ? p.months : Infinity; };
    expect(months({ ...base, lifestyle: 'FRUGAL' })).toBeLessThan(months(base));
    expect(months(buy(base, sp500, 15))).toBeLessThan(months(base));
  });

  it('matches the closed form: capital for the target at 300 × monthly income, surplus invested at the real return', () => {
    const s = startState(alex), flow = calculateMonthlyCashFlowEstimate(s), pace = freedomPace(s, flow);
    const g = Math.pow(1 + PACE_REAL_RETURN, 1 / 12) - 1, surplus = Math.round(flow.income - flow.expenses);
    let capital = 0, month = 0; const need = Math.round(1.1 * (flow.expenses - flow.taxes)) * 300;
    while (capital < need && month < 1200) { capital = capital * (1 + g) + surplus; month++; }
    expect(pace.status === 'on-track' && Math.abs(pace.months - month)).toBeLessThanOrEqual(2);
  });

  it('says off track when spending more than comes in, pauses between jobs, and is done once free', () => {
    const s = startState(alex);
    expect(freedomPace({ ...s, lifestyle: 'LUXURY' as any, cash: 0 }, { ...calculateMonthlyCashFlowEstimate(s), expenses: 9000 }).status).toBe('off-track');
    expect(freedomPace({ ...s, jobLossMonthsRemaining: 2 }, { ...calculateMonthlyCashFlowEstimate(s), salary: 0, income: 0 }).status).toBe('between-jobs');
    expect(freedomPace({ ...s, hasWon: true }).status).toBe('free');
  });

  it('is within a few years of the real win for a careful investor from year five on', () => {
    const run: { month: number; predicted: number }[] = [];
    const result = playLong(alex, 'index', 131 * 11 + 4, 30, 'NORMAL', s => { if (s.month === 60) { const p = freedomPace(s); if (p.status === 'on-track') run.push({ month: s.month, predicted: s.month + p.months }); } });
    expect(result.won).toBe(true);
    expect(run).toHaveLength(1);
    expect(Math.abs(run[0].predicted - result.winMonth!)).toBeLessThanOrEqual(36);
  });

  it('labels months under two years and whole years beyond', () => {
    expect(paceLabel(1)).toBe('about 1 month');
    expect(paceLabel(9)).toBe('about 9 months');
    expect(paceLabel(30)).toBe('about 3 years');
    expect(paceLabel(174)).toBe('about 15 years');
  });
});
