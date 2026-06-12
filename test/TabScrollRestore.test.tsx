import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { I18nProvider } from '../i18n';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import App from '../App';

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

describe('invest tab state persistence (v2 shell)', () => {
  beforeEach(() => {
    localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
    localStorage.setItem('tycoon_ui_v2', '1');
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      configurable: true
    });
  });

  it('keeps invest filters and search when navigating away and back', async () => {
    const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^money invest/i }));
    fireEvent.click(await screen.findByRole('button', { name: /bonds/i }));
    const searchInput = await screen.findByPlaceholderText(/search investments/i);
    fireEvent.change(searchInput, { target: { value: 'index' } });

    // Leave the Money page entirely (unmounts InvestTab), then return.
    fireEvent.click(screen.getByRole('button', { name: /^career salary/i }));
    fireEvent.click(screen.getByRole('button', { name: /^money invest/i }));

    const bondsButton = await screen.findByRole('button', { name: /bonds/i });
    expect(bondsButton.className).toMatch(/ds-button--primary/);
    expect(screen.getByPlaceholderText(/search investments/i)).toHaveValue('index');
  });
});
