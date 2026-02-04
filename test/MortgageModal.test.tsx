import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, MORTGAGE_OPTIONS } from '../constants';
import { I18nProvider } from '../i18n';
import App from '../App';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

describe('mortgage modal', () => {
  beforeEach(() => {
    localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      configurable: true
    });
  });

  it('shows cashflow impact and confirmation details', async () => {
    const initialGameState = {
      ...INITIAL_GAME_STATE,
      character: CHARACTERS[0],
      cash: 75000
    };

    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^invest$/i }));

    await screen.findByText(/batch buy/i);
    const main = await screen.findByRole('main');
    const financeButtons = within(main).getAllByRole('button', { name: /finance/i });
    const financeButton = financeButtons.find((button) => !button.hasAttribute('disabled'));
    expect(financeButton).toBeTruthy();
    fireEvent.click(financeButton!);

    await screen.findByRole('dialog', { name: /mortgage options/i });

    const option = MORTGAGE_OPTIONS.find((opt) => screen.queryByText(opt.name));
    expect(option).toBeTruthy();
    fireEvent.click(screen.getByText(option!.name));

    expect(await screen.findByText(/cashflow (positive|negative)/i)).toBeInTheDocument();
    expect(screen.getByText(/Buying this will reduce cash to/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rate:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Payment:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cashflow:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Est\. maint:/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /review purchase/i }));
    expect(await screen.findByRole('heading', { name: /confirm mortgage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm purchase/i })).toBeInTheDocument();
  });
});
