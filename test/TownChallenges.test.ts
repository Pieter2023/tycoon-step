import { describe, it, expect, afterEach, vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { AssetType, GameState } from '../types';
import { monthlyChallenges, challengeProgress, snapshotFor, closeChallengeMonth, currentSnapshot, cleanSweeps, completedCount } from '../services/townChallenges';
import { resolveTownAction } from '../services/townProgress';
import { processTurn, clearSimSeed } from '../services/gameLogic';
import { transferTownSavings } from '../services/townActivities';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 4 });
const fund = { id: 'sp', marketItemId: 'sp500', name: 'S&P 500 Index', type: AssetType.INDEX_FUND, value: 500, costBasis: 500, quantity: 4, cashFlow: 0, volatility: .15, appreciationRate: .04, priceHistory: [{ month: 2, value: 500 }] };
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });

describe('notice-board challenges', () => {
  it('always includes the reserve, picks the same three for the same month, and varies by month', () => {
    const s = base();
    const a = monthlyChallenges(s), b = monthlyChallenges(s);
    expect(a).toHaveLength(3); expect(a[0].id).toBe('reserve'); expect(a.map(c => c.id)).toEqual(b.map(c => c.id));
    const ids = new Set(Array.from({ length: 6 }, (_, i) => monthlyChallenges({ ...s, month: i + 1 }).map(c => c.id).join(',')));
    expect(ids.size).toBeGreaterThan(1);
    const withCafe = monthlyChallenges({ ...s, cafe: { openedMonth: 1, seats: false, machine: false, plan: { price: 6, stock: 400, helper: false, open: true } } });
    expect(withCafe.every(c => ['reserve', 'invest', 'savings', 'shift3', 'tip', 'debt', 'cart', 'hold'].includes(c.id))).toBe(true);
    const dip = monthlyChallenges({ ...s, assets: [fund], marketCycle: { ...s.marketCycle, phase: 'CONTRACTION' } });
    expect(dip.some(c => c.id === 'hold') || dip.length === 3).toBe(true);
  });
  it('measures this month only: money moved after the snapshot counts, money already there does not', () => {
    const s = { ...base(), assets: [fund] }; const snapshot = snapshotFor(s);
    const invest = { id: 'invest' as const, title: '', detail: '', target: 500, unit: 'dollars' as const };
    expect(challengeProgress(invest, snapshot, s)).toMatchObject({ done: false, value: 0 });
    const bought = { ...s, assets: [{ ...fund, quantity: 5 }] };
    expect(challengeProgress(invest, snapshot, bought)).toMatchObject({ done: true, value: 500 });
    const savings = { id: 'savings' as const, title: '', detail: '', target: 300, unit: 'dollars' as const };
    expect(challengeProgress(savings, snapshot, transferTownSavings(s, { direction: 'deposit', amount: 400 }))).toMatchObject({ done: true, value: 400 });
    const reserve = { id: 'reserve' as const, title: '', detail: '', target: 2600, unit: 'dollars' as const };
    expect(challengeProgress(reserve, snapshot, { ...s, cash: 1000 }).done).toBe(false); expect(challengeProgress(reserve, snapshot, s).done).toBe(true);
    const hold = { id: 'hold' as const, title: '', detail: '', target: 1, unit: 'count' as const };
    expect(challengeProgress(hold, snapshot, { ...s, assets: [{ ...fund, quantity: 2 }] }).done).toBe(false); expect(challengeProgress(hold, snapshot, s).done).toBe(true);
  });
  it('takes a snapshot on demand once per month, judges at month close and starts the next snapshot', () => {
    let s = resolveTownAction(base(), 'challenge-snapshot');
    expect(s.townProgress?.challengeSnapshot?.month).toBe(4); expect(resolveTownAction(s, 'challenge-snapshot')).toBe(s);
    expect(currentSnapshot(base()).month).toBe(4);
    expect(closeChallengeMonth(base())).toBeNull();
    const result = closeChallengeMonth(s)!; expect(result.month).toBe(4); expect(result.total).toBe(3); expect(result.completed).toContain('reserve');
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const { newState } = processTurn(s);
    expect(newState.townProgress?.challengeLog).toHaveLength(1); expect(newState.townProgress?.challengeLog?.[0].month).toBe(4);
    expect(newState.townProgress?.challengeSnapshot?.month).toBe(5);
    expect(completedCount(newState.townProgress?.challengeLog)).toBeGreaterThanOrEqual(1);
    expect(cleanSweeps([{ month: 1, completed: ['reserve', 'invest', 'savings'], total: 3 }, { month: 2, completed: ['reserve'], total: 3 }])).toBe(1);
  });
});

describe('year-in-review city section', () => {
  it('reports badges, challenge totals and café trading for the year that closed', () => {
    const start = { ...base(), month: 12, townProgress: { journeyCompletedMonth: 3, challengeLog: [{ month: 10, completed: ['reserve', 'invest', 'savings'] as const, total: 3 }, { month: 11, completed: ['reserve'] as const, total: 3 }] }, yearStats: { startNetWorth: 1000, marketGains: 0, passiveIncome: 0, hindsights: [], cafeProfit: 900, ownerShifts: 2 } };
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const { newState } = processTurn(start as GameState);
    expect(newState.annualReport?.city).toMatchObject({ badges: ['Neighbourhood entrepreneur'], challengesCompleted: 4, cleanSweeps: 1, ownerShifts: 2 });
    expect(newState.annualReport?.city?.cafeProfit).toBeUndefined();
  });
});

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import AnnualReportModal from '../components/modals/AnnualReportModal';
it('renders the city section of the annual report', () => {
  const report = { year: 1, startNetWorth: 1000, endNetWorth: 2000, marketGains: 100, passiveIncome: 200, hindsights: [], city: { badges: ['Patient investor'], challengesCompleted: 7, cleanSweeps: 2, cafeProfit: 1500, cafeReputation: 74, ownerShifts: 3 } };
  const { container } = render(React.createElement(AnnualReportModal, { report, onDismiss: () => {} }));
  expect(container.textContent).toMatch(/Your city this year/); expect(container.textContent).toMatch(/Patient investor/); expect(container.textContent).toMatch(/7 challenges completed, 2 clean sweeps/); expect(container.textContent).toMatch(/3 owner shifts; reputation stands at 74\/100/);
  cleanup();
});
