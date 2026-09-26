import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import TownModal from '../components/town/TownModal';
import { createTownScene } from '../components/town/createTownScene';
vi.mock('../components/town/createTownScene', () => ({ createTownScene: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

// Phone check 2026-09-26 (build 62): on a portrait phone only three of the twelve destinations fit with no sign of the
// rest, and inside a room the header, the destinations, the room buttons, the help line and the journey strip left the
// 3D view about a third of the screen. The layout itself is CSS (town.css, max-width 767px); these pin the markup it needs.
function mount() {
  let callbacks: any; const calls: Record<string, any> = {};
  const controller = new Proxy({}, { get: (_, key: string) => calls[key] ?? (calls[key] = vi.fn()) });
  vi.mocked(createTownScene).mockImplementation((...args: any[]) => { callbacks = args[6]; args[5]?.(); return controller as any; });
  render(<I18nProvider><TownModal state={{ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 10000 }} disabled={false} reduceMotion onBuy={vi.fn()} onClose={vi.fn()} onOpenMoney={vi.fn()} onNextMonth={vi.fn()} onBackup={vi.fn()} /></I18nProvider>);
  return { callbacks, calls };
}
const fakeScroll = (nav: HTMLElement, sizes: { scrollWidth: number; clientWidth: number; scrollLeft: number }) => {
  for (const [key, value] of Object.entries(sizes)) Object.defineProperty(nav, key, { configurable: true, value });
  fireEvent.scroll(nav);
};

it('shows edge buttons while the destination row overflows, and scrolls it', () => {
  mount();
  const nav = screen.getByRole('navigation', { name: 'Walk to a destination' });
  expect(screen.queryByRole('button', { name: 'More destinations' })).toBeNull();   // nothing hidden, no buttons
  const scrollBy = vi.fn(); (nav as any).scrollBy = scrollBy;
  fakeScroll(nav, { scrollWidth: 1076, clientWidth: 393, scrollLeft: 0 });
  expect(screen.queryByRole('button', { name: 'Earlier destinations' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'More destinations' }));
  expect(scrollBy).toHaveBeenCalledWith({ left: 393 * .7, behavior: 'auto' });       // reduced motion: no smooth scroll
  fakeScroll(nav, { scrollWidth: 1076, clientWidth: 393, scrollLeft: 683 });
  expect(screen.getByRole('button', { name: 'Earlier destinations' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'More destinations' })).toBeNull();     // at the end
});

it('marks rooms so a phone can trade the destinations for the room bar, with a compact help and exit', () => {
  const { callbacks, calls } = mount();
  const modal = screen.getByRole('dialog', { name: 'Freedom Square 3D neighbourhood' });
  expect(modal).not.toHaveClass('town-in-room');
  act(() => callbacks.onRoom('bank'));
  expect(modal).toHaveClass('town-in-room');
  const bar = modal.querySelector('.town-room-bar')!;
  expect(bar).not.toBeNull();
  // The help keeps its full name for screen readers while a phone shows only "?".
  expect(screen.getByRole('button', { name: 'What can I do here? · Actions, costs & rewards' }).querySelector('.town-help-icon')?.textContent).toBe('?');
  // One exit button carries both labels; CSS shows the long one on desktop and "Exit ↗" on a phone.
  const exit = bar.querySelector('.town-exit-short')!.closest('button')!;
  expect(exit.querySelector('.town-exit-long')?.textContent).toBe('Return to square ↗');
  fireEvent.click(exit); expect(calls.leaveBank).toHaveBeenCalled();
  expect(bar.querySelector('.town-walk-exit')?.textContent).toBe('Walk to exit');   // hidden on phones, kept on desktop
});
