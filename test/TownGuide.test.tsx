import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { AssetType, GameState } from '../types';
import { townJourney } from '../services/townJourney';
import { resolveTownAction } from '../services/townProgress';
import { runCartShift } from '../services/townActivities';
import { guideLabel, guideNextHop } from '../components/town/townGuide';
import { routeSpeed, WALK_SPEED, JOG_SPEED } from '../components/town/townControls';
import TellerPanel from '../components/town/TellerPanel';

const base = (): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 8000, month: 1 });
const cart = { id: 'c', marketItemId: 'coffee_cart', name: 'Coffee Cart', type: AssetType.BUSINESS, value: 1500, costBasis: 1500, quantity: 1, cashFlow: 30, volatility: .18, appreciationRate: .01, priceHistory: [] };
const city = { room: 'city' as const, near: null, spot: null, showDetails: false, journal: false, serviceActive: false, hasCafe: false };
afterEach(cleanup);

describe('guide button names the very next tap', () => {
  it('walks the reserve step from the square to the confirmation without a stale label', () => {
    const journey = townJourney(base());
    expect(guideLabel({ ...city, journey })).toBe('Go to the teller');
    expect(guideLabel({ ...city, journey, near: 'bank' })).toBe('Enter the bank');
    expect(guideLabel({ ...city, journey, room: 'bank' })).toBe('Walk to teller');
    expect(guideLabel({ ...city, journey, room: 'bank', spot: 'teller' })).toBe('Talk to teller');
    expect(guideLabel({ ...city, journey, room: 'bank', spot: 'teller', showDetails: true })).toBe('Confirm my cash reserve');
  });
  it('points at the cart offer, the permit cart and the finish button as the mission advances', () => {
    let s = resolveTownAction(base(), 'reserve');
    expect(guideLabel({ ...city, journey: townJourney(s), near: 'business', showDetails: true })).toBe('Buy the coffee cart');
    s = { ...s, assets: [cart] };
    expect(guideLabel({ ...city, journey: townJourney(s), spot: 'cart' })).toBe('Open your cart');
    expect(guideLabel({ ...city, journey: townJourney(s), spot: 'cart', showDetails: true })).toBe('Pay the $60 permit');
    s = resolveTownAction(s, 'permit');
    expect(guideLabel({ ...city, journey: townJourney(s), spot: 'cart', showDetails: true })).toBe('Run your first shift');
    s = runCartShift(s, { price: 5, stock: 12 });
    s = { ...s, month: 2, lastMonthlyReport: { month: 2 } as any };
    expect(guideLabel({ ...city, journey: townJourney(s), journal: true, showDetails: true })).toBe('Complete my opening journey ✦');
  });
  it('describes the café honestly before and after the lease', () => {
    const journey = { ...townJourney(base()), completed: true };
    expect(guideLabel({ ...city, journey })).toBe('View the café space');
    expect(guideLabel({ ...city, journey, near: 'business' })).toBe('Enter the café');
    expect(guideLabel({ ...city, journey, room: 'cafe' })).toBe('Try a practice shift');
    expect(guideLabel({ ...city, journey, room: 'cafe', showDetails: true })).toBe('Start a practice shift');
    expect(guideLabel({ ...city, journey, room: 'cafe', hasCafe: true })).toBe('Manage your café');
    expect(guideLabel({ ...city, journey, room: 'cafe', serviceActive: true })).toBe('Back to serving');
  });
});

describe('guided walks chain through doors', () => {
  it('goes through the bank door and up to the teller after one tap', () => {
    expect(guideNextHop('teller', { room: 'city', near: null, spot: null })).toBeNull();
    expect(guideNextHop('teller', { room: 'city', near: 'bank', spot: null })).toBe('enterBank');
    expect(guideNextHop('teller', { room: 'bank', near: null, spot: null })).toBe('walkToTeller');
    expect(guideNextHop('teller', { room: 'bank', near: 'bank', spot: 'teller' })).toBe('arrived');
  });
  it('enters the café on arrival and stops at the cart, never mistaking the cart for the shopfront', () => {
    expect(guideNextHop('cafe', { room: 'city', near: 'business', spot: null })).toBe('enterCafe');
    expect(guideNextHop('cafe', { room: 'cafe', near: null, spot: null })).toBe('arrived');
    expect(guideNextHop('cart', { room: 'city', near: 'business', spot: null })).toBeNull();
    expect(guideNextHop('cart', { room: 'city', near: 'business', spot: 'cart' })).toBe('arrived');
    expect(guideNextHop('business', { room: 'city', near: 'business', spot: 'cart' })).toBeNull();
  });
});

it('jogs on long routes and scripted service, walks the last stretch', () => {
  expect(routeSpeed(12, false)).toBe(JOG_SPEED);
  expect(routeSpeed(3, false)).toBe(WALK_SPEED);
  expect(routeSpeed(1, true)).toBe(JOG_SPEED);
});

it('shows the reserve step before the transfer tools until it is confirmed', () => {
  const { rerender } = render(<TellerPanel state={base()} disabled={false} onTransfer={vi.fn()} loans={[]} onLoans={vi.fn()} onReserve={vi.fn()} onBusiness={vi.fn()} />);
  const buttons = screen.getAllByRole('button').map(b => b.textContent);
  expect(buttons.indexOf('Confirm my cash reserve')).toBeLessThan(buttons.indexOf('Deposit to savings'));
  rerender(<TellerPanel state={resolveTownAction(base(), 'reserve')} disabled={false} onTransfer={vi.fn()} loans={[]} onLoans={vi.fn()} onReserve={vi.fn()} onBusiness={vi.fn()} />);
  const after = screen.getAllByRole('button').map(b => b.textContent);
  expect(after.indexOf('Next: visit your business →')).toBeGreaterThan(after.indexOf('Deposit to savings'));
});
