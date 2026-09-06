import { describe, it, expect } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { AssetType, GameState } from '../types';
import { adviseFrom, adviceHeadline } from '../services/townAdvisor';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 9000, month: 3 });
const asset = (type: AssetType, value: number, id = 'x') => ({ id, marketItemId: id, name: id, type, value, costBasis: value, quantity: 1, cashFlow: 0, volatility: .2, appreciationRate: .02, priceHistory: [] });

describe('Rosa the neighbour', () => {
  it('warns first about a thin reserve and expensive debt while investing', () => {
    const s = { ...base(), cash: 800, liabilities: [{ id: 'cc', name: 'Card', type: 'CREDIT_CARD' as const, balance: 3000, originalBalance: 3000, interestRate: .22, monthlyPayment: 120 }], assets: [asset(AssetType.INDEX_FUND, 2000)] };
    const advice = adviseFrom(s);
    expect(advice[0].id).toBe('thin'); expect(advice[0].place).toBe('bank');
    expect(advice.some(a => a.id === 'expensive-debt' && a.title.includes('22%'))).toBe(true);
    expect(advice.length).toBeGreaterThanOrEqual(2); expect(advice.length).toBeLessThanOrEqual(3);
  });
  it('flags crypto concentration, idle cash, never investing, and the dip', () => {
    expect(adviseFrom({ ...base(), assets: [asset(AssetType.CRYPTO, 3000, 'btc'), asset(AssetType.INDEX_FUND, 1000, 'sp')] }).some(a => a.id === 'crypto-heavy')).toBe(true);
    expect(adviseFrom({ ...base(), cash: 40000 }).some(a => a.id === 'idle-cash')).toBe(true);
    expect(adviseFrom({ ...base(), month: 7, cash: 9000 }).some(a => a.id === 'never-invested')).toBe(true);
    const dip = { ...base(), assets: [asset(AssetType.INDEX_FUND, 2000)], marketCycle: { ...base().marketCycle, phase: 'CONTRACTION' as const } };
    expect(adviseFrom(dip).some(a => a.id === 'dip' && a.place === 'exchange')).toBe(true);
  });
  it('notices café trouble and celebrates progress, and always says something', () => {
    const cafe = { openedMonth: 1, seats: false, machine: false, plan: { price: 6 as const, stock: 400 as const, helper: false, open: false }, reputation: 30 };
    const ids = adviseFrom({ ...base(), cafe }).map(a => a.id);
    expect(ids).toContain('cafe-rep'); expect(ids).toContain('cafe-closed');
    const rich = { ...base(), assets: [{ ...asset(AssetType.REAL_ESTATE, 400000), cashFlow: 3200, quantity: 1 }] };
    expect(adviseFrom(rich).some(a => a.tone === 'good')).toBe(true);
    expect(adviseFrom(base())[0].id).toBe('steady'); expect(adviceHeadline(base())).toBe('Nothing on fire.');
  });
});
