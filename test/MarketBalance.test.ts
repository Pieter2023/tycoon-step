import { describe, expect, it } from 'vitest';
import { MARKET_ITEMS } from '../constants';

const getItemTier = (item: { tier?: 'STARTER' | 'MID' | 'ADVANCED'; price: number }) => {
  if (item.tier) return item.tier;
  if (item.price <= 5000) return 'STARTER';
  if (item.price <= 25000) return 'MID';
  return 'ADVANCED';
};

describe('mid-tier balance sanity', () => {
  it('has a healthy set of mid-tier assets', () => {
    const mid = MARKET_ITEMS.filter(item => getItemTier(item) === 'MID');
    expect(mid.length).toBeGreaterThanOrEqual(6);
  });

  it('avoids outlier ROI in mid-tier assets', () => {
    const midYields = MARKET_ITEMS.filter(item => getItemTier(item) === 'MID').map(item => item.expectedYield);
    const maxYield = Math.max(...midYields);
    const minYield = Math.min(...midYields);
    const sorted = [...midYields].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    expect(maxYield).toBeLessThanOrEqual(0.2);
    expect(maxYield / Math.max(0.01, median)).toBeLessThanOrEqual(1.7);
    expect(minYield).toBeGreaterThanOrEqual(0.06);
  });
});
