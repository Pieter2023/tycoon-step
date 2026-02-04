import { describe, it, expect } from 'vitest';
import { clampScrollY, DEFAULT_TAB_UI_STATE, hydrateTabUiState } from './tabState';

describe('tabState', () => {
  it('clamps scroll positions to non-negative integers', () => {
    expect(clampScrollY(120.4)).toBe(120);
    expect(clampScrollY(-5)).toBe(0);
    expect(clampScrollY(Number.NaN)).toBe(0);
  });

  it('hydrates tab UI state with defaults', () => {
    const state = hydrateTabUiState({ investmentFilter: 'BOND', scrollY: 88.8 });
    expect(state.investmentFilter).toBe('BOND');
    expect(state.investmentTierFilter).toBe(DEFAULT_TAB_UI_STATE.investmentTierFilter);
    expect(state.investmentSearch).toBe(DEFAULT_TAB_UI_STATE.investmentSearch);
    expect(state.scrollY).toBe(89);
  });
});
