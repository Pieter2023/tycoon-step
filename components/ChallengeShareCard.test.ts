import { describe, it, expect } from 'vitest';
import { pickDefiningEvents, pickRunEvents } from './ChallengeShareCard';
import { GameState, LifeEvent } from '../types';

const ev = (month: number, title: string, type: LifeEvent['type'] = 'EXPENSE'): LifeEvent => ({
  id: `${type}-${month}`,
  month,
  title,
  description: '',
  type
});

describe('pickDefiningEvents', () => {
  it('returns everything when 3 or fewer', () => {
    const list = [{ month: 1, title: 'a' }, { month: 5, title: 'b' }];
    expect(pickDefiningEvents(list)).toEqual(list);
    expect(pickDefiningEvents(undefined)).toEqual([]);
  });

  it('spreads picks across a long run (first / middle / last)', () => {
    const list = Array.from({ length: 9 }, (_, i) => ({ month: i + 1, title: `e${i + 1}` }));
    expect(pickDefiningEvents(list).map(e => e.title)).toEqual(['e1', 'e5', 'e9']);
  });
});

describe('pickRunEvents', () => {
  it('uses challengeEvents verbatim for challenge runs', () => {
    const challengeEvents = [{ month: 3, title: 'Market crash' }];
    const state = {
      challenge: { id: '2026-06-11', seed: 1, targetMonths: 120 },
      challengeEvents,
      events: [ev(1, 'should be ignored')]
    } as unknown as GameState;
    expect(pickRunEvents(state)).toEqual(challengeEvents);
  });

  it('falls back to the event feed for normal games, chronological and minus noise', () => {
    const state = {
      events: [
        ev(9, 'Promotion', 'ACHIEVEMENT'), // feed is newest-first
        ev(7, 'Bought index funds', 'DECISION'),
        ev(6, 'Rate hike news', 'NEWS'),
        ev(5, 'Low cash warning', 'WARNING'),
        ev(2, 'Car broke down', 'EXPENSE')
      ]
    } as unknown as GameState;
    expect(pickRunEvents(state)).toEqual([
      { month: 2, title: 'Car broke down' },
      { month: 9, title: 'Promotion' }
    ]);
  });

  it('handles empty feeds', () => {
    expect(pickRunEvents({ events: [] } as unknown as GameState)).toEqual([]);
    expect(pickRunEvents({} as unknown as GameState)).toEqual([]);
  });
});
