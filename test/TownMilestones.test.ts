import { describe, it, expect } from 'vitest';
import { CHARACTERS, MARKET_ITEMS } from '../constants';
import { GameState } from '../types';
import { reachedMilestones, newMilestones, recordMilestones } from '../services/townMilestones';
import { startState, buy } from './strategyHarness';

const item = (id: string) => MARKET_ITEMS.find(i => i.id === id)!;
const alex = (): GameState => ({ ...startState(CHARACTERS.find(c => c.id === 'alex')!), month: 5 });

describe('milestone moments', () => {
  it('starts with nothing to celebrate', () => {
    expect(reachedMilestones(alex())).toEqual([]);
    expect(newMilestones(alex())).toBeNull();
  });
  it('celebrates a first business once, then remembers it', () => {
    let s = buy({ ...alex(), cash: 5000, townProgress: { permitMonth: 1 } }, item('coffee_cart'), 1);
    const fresh = newMilestones(s)!;
    expect(fresh.celebrate.id).toBe('first-income');           // a licensed cart pays, so both are new; the bigger one is shown
    expect(fresh.record).toEqual(['first-business', 'first-income']);
    s = recordMilestones(s, fresh.record);
    expect(s.townProgress!.milestones).toEqual({ 'first-business': 5, 'first-income': 5 });
    expect(newMilestones(s)).toBeNull();
  });
  it('marks freedom at a quarter, half and three quarters, and only shows the biggest new one', () => {
    let s = buy({ ...alex(), cash: 3_000_000 }, item('sp500'), 1200);   // about 60% of the way
    const fresh = newMilestones(s)!;
    expect(fresh.record).toEqual(expect.arrayContaining(['first-income', 'freedom-25', 'freedom-50']));
    expect(fresh.record).not.toContain('freedom-75');
    expect(fresh.celebrate.id).toBe('freedom-50');
    expect(fresh.celebrate.moment).toBe('fireworks');
  });
});
