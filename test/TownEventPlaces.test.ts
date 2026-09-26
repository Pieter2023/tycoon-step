import { describe, it, expect } from 'vitest';
import { eventPlace, EVENT_PLACES } from '../services/townEvents';
import { EVENT_STAGE } from '../components/town/townEventStage';
import { isWalkable } from '../components/town/townNavigation';
import { ALL_LIFE_EVENTS } from '../constants';

// Phone check 2026-09-26: an office birthday collection was framed as "Rosa knocks on your door", because every
// SOCIAL event went to Rosa. Events now take their place from their id first, then from their category.
describe('where each life event happens in town', () => {
  it('places social life where it happens', () => {
    expect(eventPlace('SOCIAL', 'coworker_birthday').label).toBe('At the office');
    expect(eventPlace('SOCIAL', 'splitting_bill').label).toBe('On Main Street');
    expect(eventPlace('SOCIAL', 'impulse_purchase').place).toBe('home');
    expect(eventPlace('SOCIAL', 'viral_moment').place).toBe('square');
    expect(eventPlace('SOCIAL', 'reunion').label).toBe('A letter on your doormat');
    expect(eventPlace('SOCIAL', 'a_future_social_event').place).toBe('rosa');   // unknown ids follow the category
  });

  it('sends the player’s rentals to Property & Co. and a work bonus to the office', () => {
    expect(eventPlace('HOUSING', 'rental_tenant_nonpayment').label).toBe('At Property & Co.');
    expect(eventPlace('HOUSING', 'landlord_dispute').place).toBe('home');       // the player's own landlord: still home
    expect(eventPlace('WINDFALL', 'work_bonus').place).toBe('work');
    expect(eventPlace('WINDFALL', 'inheritance').place).toBe('bank');
  });

  it('only names real events, and every place has a stage on walkable pavement', () => {
    const ids = new Set(ALL_LIFE_EVENTS.map(e => e.id));
    for (const id of Object.keys(EVENT_PLACES)) expect(ids.has(id), id).toBe(true);
    for (const place of new Set(Object.values(EVENT_PLACES))) {
      const spot = EVENT_STAGE[place];
      expect(spot, place).toBeDefined();
      expect(isWalkable({ x: spot.ring[0], z: spot.ring[1] }) || place === 'garage', place).toBe(true);
    }
  });
});
