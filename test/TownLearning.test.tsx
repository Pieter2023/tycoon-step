import React from 'react';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { I18nProvider } from '../i18n';
import { CHARACTERS, INITIAL_GAME_STATE, MARKET_ITEMS } from '../constants';
import TownModal from '../components/town/TownModal';
import { createTownScene } from '../components/town/createTownScene';
import { TOWN_PLACES, clampTownPoint, nearbyPlace, routeToPlace, townPrice } from '../components/town/townWorld';
vi.mock('../components/town/createTownScene', () => ({ createTownScene: vi.fn() }));
const initial = () => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 1200 });
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('3D town learning and transactions', () => {
  it('makes every entrance reachable without walking through buildings or off the map', () => {
    for (const place of TOWN_PLACES) {
      const route = routeToPlace({ x: 0, z: 6 }, place.id);
      expect(route.map(clampTownPoint)).toEqual(route);
      expect(nearbyPlace(route[route.length - 1])).toBe(place.id);
    }
    expect(clampTownPoint({ x: 999, z: -999 })).toEqual({ x: 16, z: -1.4 });
  });
  it('keeps town quotes aligned with nominal deposits and negotiated property prices', () => {
    const state = { ...initial(), month: 36, negotiationsPerks: { dealDiscountPct: .1 } };
    expect(townPrice(MARKET_ITEMS.find(i => i.id === 'hysa')!, state as any)).toBe(1000);
    const property = MARKET_ITEMS.find(i => i.id === 'starter_home')!;
    expect(townPrice(property, state as any)).toBe(Math.round(Math.round(property.price * (1 + state.economy.inflationRate) ** 3) * .9));
  });
  it('supports the no-WebGL fallback, shows cash remaining and prevents unaffordable purchases', async () => {
    vi.mocked(createTownScene).mockImplementation(() => { throw new Error('No WebGL'); });
    const onBuy = vi.fn(); const user = userEvent.setup();
    render(<I18nProvider><TownModal state={initial()} disabled={false} reduceMotion onBuy={onBuy} onClose={vi.fn()} onOpenMoney={vi.fn()} onNextMonth={vi.fn()} onBackup={vi.fn()} /></I18nProvider>);
    expect(screen.getByText('Explore with the destination buttons')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Walk to Community Bank' }));
    const savings = screen.getByRole('heading', { name: 'High-Yield Savings' }).closest('article')!;
    expect(within(savings).getByText('$200')).toBeVisible();
    await user.click(within(savings).getByRole('button', { name: 'Deposit $1,000' }));
    expect(onBuy).toHaveBeenCalledWith(MARKET_ITEMS.find(i => i.id === 'hysa'));
    await user.click(screen.getByRole('button', { name: 'Walk to Main Street Businesses' }));
    expect(screen.getAllByRole('button', { name: /Need .* more/ }).every(button => button.hasAttribute('disabled'))).toBe(true);
    expect(onBuy).toHaveBeenCalledTimes(1);
  });
});
