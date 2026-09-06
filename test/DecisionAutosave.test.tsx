import React from 'react';
import { render, screen, within, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from '../App';
import { I18nProvider } from '../i18n';
import { CHARACTERS, INITIAL_GAME_STATE } from '../constants';
import { loadAdultGame } from '../services/storageService';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const initial = () => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 10000, reserveBaseline: 10000 });
const mount = (state = initial()) => render(<I18nProvider><App initialGameState={state} onBackToMenu={() => {}} /></I18nProvider>);
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
describe('decision autosave', () => {
  it('preserves purchases and borrowing without advancing a month, across remount', async () => {
    localStorage.clear(); const user = userEvent.setup(); const view = mount();
    await user.click(screen.getByRole('button', { name: /Money.*Invest, bank, portfolio/i }));
    await user.click(within(screen.getByRole('main')).getAllByRole('button', { name: /^Buy \$1(?:\.0)?K$/ })[0]);
    await waitFor(() => expect(loadAdultGame()!.assets).toHaveLength(1));
    expect(loadAdultGame()!.cash).toBe(9000);
    await user.click(screen.getByRole('button', { name: 'Bank', exact: true }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await user.click(screen.getAllByRole('button', { name: 'Get This Loan', exact: true })[0]);
    await user.click(screen.getByRole('button', { name: 'Take Loan', exact: true }));
    await waitFor(() => expect(loadAdultGame()!.liabilities).toHaveLength(1));
    expect(loadAdultGame()!.month).toBe(1);
    expect(loadAdultGame()!.cash).toBe(11000);
    const saved = loadAdultGame()!; view.unmount(); mount(saved);
    expect(loadAdultGame()!.assets).toHaveLength(1);
    expect(loadAdultGame()!.liabilities).toHaveLength(1);
  });
  it('warns on a failed write and does not replace a previous valid save', async () => {
    localStorage.clear(); mount();
    const old = loadAdultGame(); cleanup();
    const setItem = vi.mocked(localStorage.setItem).getMockImplementation()!;
    vi.spyOn(localStorage, 'setItem').mockImplementation(function(key, value) {
      if (key === 'tycoon_saves_v2') throw new Error('QuotaExceededError');
      setItem(key, value);
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount({ ...initial(), cash: 12000 });
    expect(await screen.findByRole('alert')).toHaveTextContent('Progress could not be saved');
    expect(loadAdultGame()!.cash).toBe(old!.cash);
  });
});
