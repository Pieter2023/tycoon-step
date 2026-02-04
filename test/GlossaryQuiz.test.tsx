import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { I18nProvider } from '../i18n';
import App from '../App';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

describe('glossary and quiz', () => {
  beforeEach(() => {
    localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
    localStorage.removeItem('tycoon_quiz_seen_v1');
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      configurable: true
    });
  });

  it('opens the glossary from the HUD menu', async () => {
    const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open dashboard menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /glossary/i }));

    expect(await screen.findByRole('dialog', { name: /glossary/i })).toBeInTheDocument();
    expect(screen.getByText(/yield/i)).toBeInTheDocument();
  });

  it('shows and allows skipping the invest quiz', async () => {
    const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^invest$/i }));
    await screen.findByText(/batch buy/i);

    fireEvent.click(screen.getByRole('button', { name: /bonds/i }));
    expect(await screen.findByText(/risk & diversification quiz/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.queryByText(/risk & diversification quiz/i)).toBeNull();
  });
});
