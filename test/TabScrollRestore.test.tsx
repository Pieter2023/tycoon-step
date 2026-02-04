import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { I18nProvider } from '../i18n';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import App from '../App';

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

describe('tab navigation state', () => {
  beforeEach(() => {
    localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
  });

  it('restores invest filters and scroll position when returning to a tab', async () => {
    let scrollY = 0;
    const scrollTo = vi.fn((options?: ScrollToOptions | number, y?: number) => {
      if (typeof options === 'number') {
        scrollY = options;
      } else if (typeof y === 'number') {
        scrollY = y;
      } else if (options && typeof options.top === 'number') {
        scrollY = options.top;
      }
    });

    Object.defineProperty(window, 'scrollY', {
      get: () => scrollY,
      configurable: true
    });
    Object.defineProperty(window, 'scrollTo', {
      value: scrollTo,
      configurable: true
    });

    const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^invest$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /bonds/i }));
    const searchInput = await screen.findByPlaceholderText(/search investments/i);
    fireEvent.change(searchInput, { target: { value: 'index' } });

    scrollY = 420;
    fireEvent.click(screen.getByRole('button', { name: /^portfolio$/i }));

    scrollY = 0;
    fireEvent.click(screen.getByRole('button', { name: /^invest$/i }));
    await screen.findByRole('button', { name: /bonds/i });

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalled();
    });

    const bondsButton = screen.getByRole('button', { name: /bonds/i });
    expect(bondsButton.className).toMatch(/ds-button--primary/);
    expect(screen.getByPlaceholderText(/search investments/i)).toHaveValue('index');
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 420, behavior: 'auto' });
  });
});
