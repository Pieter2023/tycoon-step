import { describe, it, expect } from 'vitest';
import { CHARACTERS, MARKET_ITEMS } from '../constants';
import { GameState } from '../types';
import { windowDisplays, fountainLevel } from '../services/townWealth';
import { startState, buy } from './strategyHarness';

const item = (id: string) => MARKET_ITEMS.find(i => i.id === id)!;
const alex = (): GameState => ({ ...startState(CHARACTERS.find(c => c.id === 'alex')!), month: 3 });

describe('wealth you can see', () => {
  it('shows dim, encouraging windows before the player owns anything', () => {
    const rows = windowDisplays(alex());
    expect(Object.values(rows).every(r => !r.lit)).toBe(true);
    expect(rows.bank.value).toBe('$0');
  });
  it('lights each window with the player\'s own money there', () => {
    let s = { ...alex(), cash: 60000, townProgress: { permitMonth: 1 } } as GameState;
    s = buy(buy(buy(s, item('hysa'), 10), item('sp500'), 20), item('coffee_cart'), 2);
    const rows = windowDisplays(s);
    expect(rows.bank).toMatchObject({ lit: true, value: '$10,000' });
    expect(rows.bank.note).toContain('$38');                 // 4.5% of $10,000 a month
    expect(rows.exchange.lit).toBe(true);
    expect(rows.exchange.value).toMatch(/^\$10,0\d\d$/);        // 20 units at the month-3 price (catalogue prices rise with inflation)
    expect(rows.business).toMatchObject({ lit: true, value: '2 businesses' });
    expect(rows.property.lit).toBe(false);
  });
  it('runs the fountain from a trickle to full as freedom nears, and full on Freedom Day', () => {
    expect(fountainLevel(alex())).toBe(0);
    const half = buy({ ...alex(), cash: 3_000_000 }, item('sp500'), 1000);
    expect(fountainLevel(half)).toBeGreaterThan(.3);
    expect(fountainLevel(half)).toBeLessThan(1);
    expect(fountainLevel({ ...alex(), hasWon: true })).toBe(1);
  });
});
