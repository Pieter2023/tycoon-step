import { describe, it, expect, afterEach, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { CHARACTERS } from '../constants';
import { clearSimSeed } from '../services/gameLogic';
import { playLong, median, LongRun, LongStrategy } from './strategyHarness';

// What the game teaches, checked over whole careers (four characters, two seeds, up to 30 years): a
// diversified index investor should reach financial freedom more often and sooner than a player who
// stacks coffee carts or only saves. Before the 2026-09-25 economy fix the same runs gave index 2/8 (median
// month 244), carts 8/8 (month 76), savings 8/8 (month 292); tables in docs/verification/economy-2026-09-25/.
// Run with STRATEGY_REPORT=<file.json> for the full table.
// Set STRATEGY_REPORT=<file.json> to write the table.
afterEach(() => { vi.restoreAllMocks(); clearSimSeed(); });
const STRATEGIES: LongStrategy[] = ['index', 'carts', 'savings', 'nothing'];
const CAST = CHARACTERS.filter(c => ['alex', 'sarah', 'marcus', 'maria'].includes(c.id)).length >= 3 ? CHARACTERS.filter(c => ['alex', 'sarah', 'marcus', 'maria'].includes(c.id)) : CHARACTERS.slice(0, 4);
const SEEDS = [11, 23];

describe('strategy ranking over 30 years', () => {
  const runs: LongRun[] = [];
  for (const char of CAST) for (const strategy of STRATEGIES) for (const seed of SEEDS) runs.push(playLong(char, strategy, seed * 131 + char.id.length));
  const of = (s: LongStrategy) => runs.filter(r => r.strategy === s);
  const summary = STRATEGIES.map(s => ({ strategy: s, wins: of(s).filter(r => r.won).length, runs: of(s).length, medianWin: median(of(s).filter(r => r.won).map(r => r.winMonth!)), bankrupt: of(s).filter(r => r.bankrupt).length, medianCoverage: Math.round(median(of(s).map(r => r.coverage)) * 100) / 100 }));
  if (process.env.STRATEGY_REPORT) writeFileSync(process.env.STRATEGY_REPORT, JSON.stringify({ summary, runs: runs.map(r => ({ ...r, netWorth: Math.round(r.netWorth), coverage: Math.round(r.coverage * 100) / 100 })) }, null, 1));
  const row = (s: LongStrategy) => summary.find(x => x.strategy === s)!;

  it('a diversified index investor reaches freedom in most careers', () => {
    expect(row('index').wins).toBeGreaterThanOrEqual(Math.ceil(row('index').runs * .75));
    expect(row('index').bankrupt).toBe(0);
  });
  it('beats stacking coffee carts: each extra cart earns less, so a pile of them never frees anyone', () => {
    expect(row('index').wins).toBeGreaterThan(row('carts').wins);
    expect(row('index').medianCoverage).toBeGreaterThan(row('carts').medianCoverage);
  });
  it('beats keeping everything in savings: interest that only matches inflation is not income for life', () => {
    expect(row('index').wins).toBeGreaterThan(row('savings').wins);
    if (row('savings').wins) expect(row('index').medianWin).toBeLessThan(row('savings').medianWin);
  });
  it('doing nothing never gets there', () => { expect(row('nothing').wins).toBe(0); });
});
