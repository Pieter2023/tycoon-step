import { describe, it, expect } from 'vitest';
import {
  buildHindsightText,
  expectedHeldGrowth,
  processTurn,
  updateSoldPositions
} from './gameLogic';
import { createDailyChallengeState } from './dailyChallenge';
import { GameState, SoldPosition, AssetType } from '../types';

const baseState = (): GameState => {
  // Reuse the deterministic challenge factory for a fully-populated state,
  // then strip the challenge marker to get a normal game.
  const s = createDailyChallengeState(new Date(Date.UTC(2026, 5, 11)));
  return { ...s, challenge: undefined, challengeEvents: undefined };
};

const runMonths = (state: GameState, months: number): GameState => {
  let s = state;
  for (let i = 0; i < months; i++) {
    const { newState } = processTurn(s);
    s = { ...newState, pendingScenario: null };
  }
  return s;
};

const ghost = (overrides: Partial<SoldPosition> = {}): SoldPosition => ({
  id: 'sold-test-1',
  name: 'Index Fund',
  assetType: 'STOCK' as AssetType,
  saleMonth: 1,
  saleValue: 10000,
  heldValue: 10000,
  marketPhaseAtSale: 'TROUGH',
  ...overrides
});

describe('expectedHeldGrowth', () => {
  it('follows the market cycle phase with no randomness', () => {
    const s = baseState();
    const expansion = { ...s, marketCycle: { ...s.marketCycle, phase: 'EXPANSION' as const } };
    const contraction = { ...s, marketCycle: { ...s.marketCycle, phase: 'CONTRACTION' as const } };
    expect(expectedHeldGrowth(expansion, ghost())).toBeCloseTo(0.005, 6);
    expect(expectedHeldGrowth(contraction, ghost())).toBeCloseTo(-0.003, 6);
    // Deterministic: same inputs, same output
    expect(expectedHeldGrowth(expansion, ghost())).toBe(expectedHeldGrowth(expansion, ghost()));
  });

  it('applies real-estate damping and drift', () => {
    const s = baseState();
    const expansion = { ...s, marketCycle: { ...s.marketCycle, phase: 'EXPANSION' as const } };
    const re = ghost({ assetType: 'REAL_ESTATE' as AssetType });
    expect(expectedHeldGrowth(expansion, re)).toBeCloseTo(0.005 * 0.3 + 0.003, 6);
  });
});

describe('updateSoldPositions', () => {
  it('grows ghost holdings monthly and keeps them before the horizon', () => {
    const s = { ...baseState(), month: 5, soldPositions: [ghost({ saleMonth: 1 })] };
    s.marketCycle = { ...s.marketCycle, phase: 'EXPANSION' };
    const next = updateSoldPositions(s);
    expect(next.soldPositions).toHaveLength(1);
    expect(next.soldPositions![0].heldValue).toBe(Math.round(10000 * 1.005));
  });

  it('resolves at 12 months: hindsight event lands, position drops', () => {
    const s: GameState = {
      ...baseState(),
      month: 13,
      events: [],
      yearStats: { startNetWorth: 0, marketGains: 0, passiveIncome: 0, hindsights: [] },
      soldPositions: [ghost({ saleMonth: 1, heldValue: 12000 })]
    };
    const next = updateSoldPositions(s);
    expect(next.soldPositions).toHaveLength(0);
    expect(next.events[0].title).toContain('Hindsight');
    expect(next.events[0].type).toBe('NEWS');
    expect(next.yearStats!.hindsights).toHaveLength(1);
  });

  it('is a no-op without ghost holdings', () => {
    const s = baseState();
    expect(updateSoldPositions(s)).toBe(s);
  });
});

describe('buildHindsightText', () => {
  it('teaches the hold lesson when selling cost the player money', () => {
    const text = buildHindsightText(ghost({ saleValue: 10000, heldValue: 13000, marketPhaseAtSale: 'TROUGH' }));
    expect(text).toContain('$13,000');
    expect(text).toContain('+30%');
    expect(text).toContain('downturn');
  });

  it('credits a good sell', () => {
    const text = buildHindsightText(ghost({ saleValue: 10000, heldValue: 8000 }));
    expect(text).toContain('turned out well');
    expect(text).toContain('-20%');
  });

  it('calls a wash a wash', () => {
    const text = buildHindsightText(ghost({ saleValue: 10000, heldValue: 10100 }));
    expect(text).toContain('barely mattered');
  });
});

describe('annual report', () => {
  it('fires when crossing the year boundary in a normal game', () => {
    const afterYear = runMonths(baseState(), 12); // month 1 → 13
    expect(afterYear.month).toBe(13);
    expect(afterYear.annualReport).toBeDefined();
    expect(afterYear.annualReport!.year).toBe(1);
    expect(afterYear.annualReport!.endNetWorth).toBeGreaterThanOrEqual(0);
    expect(afterYear.annualReport!.startNetWorth).toBeDefined();
    expect(afterYear.yearStats!.marketGains).toBe(0); // reset for the new year
  });

  it('is cleared again on the next month', () => {
    const s = runMonths(baseState(), 13);
    expect(s.annualReport).toBeUndefined();
  });

  it('never fires for daily challenge runs', () => {
    const challenge = createDailyChallengeState(new Date(Date.UTC(2026, 5, 11)));
    const after = runMonths(challenge, 12);
    expect(after.annualReport).toBeUndefined();
  });

  it('accumulates passive income and market gains through the year', () => {
    const s = baseState();
    s.assets = [{
      id: 'a1', name: 'Index Fund', type: 'STOCK' as AssetType,
      value: 10000, costBasis: 10000, quantity: 1, cashFlow: 50,
      volatility: 0.2, appreciationRate: 0.08, priceHistory: [], baseYield: 0.06
    }];
    const afterYear = runMonths(s, 12);
    expect(afterYear.annualReport).toBeDefined();
    // The fund pays ~$50/mo — passive income must have accumulated.
    expect(afterYear.annualReport!.passiveIncome).toBeGreaterThan(0);
    // Market gains tracked (sign depends on the cycle, just non-default).
    expect(typeof afterYear.annualReport!.marketGains).toBe('number');
  });
});

describe('daily challenge determinism with ghost holdings', () => {
  it('ghost updates consume no randomness — worlds stay in sync', () => {
    const d = new Date(Date.UTC(2026, 5, 11));
    const plain = createDailyChallengeState(d);
    const withGhost: GameState = {
      ...createDailyChallengeState(d),
      soldPositions: [ghost({ saleMonth: 1 })]
    };
    const a = runMonths(plain, 18);
    const b = runMonths(withGhost, 18);
    expect(a.marketCycle.phase).toBe(b.marketCycle.phase);
    expect(a.economy?.interestRate).toBe(b.economy?.interestRate);
    expect(JSON.stringify(a.netWorthHistory)).toBe(JSON.stringify(b.netWorthHistory));
    expect(JSON.stringify(a.challengeEvents)).toBe(JSON.stringify(b.challengeEvents));
  });
});
