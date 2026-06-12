import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { I18nProvider } from '../i18n';
import App from '../App';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

describe('glossary and quiz (v2 shell)', () => {
  beforeEach(() => {
    localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
    localStorage.removeItem('tycoon_quiz_seen_v1');
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      configurable: true
    });
  });

  it('opens the glossary from the invest tab link', async () => {
    const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^money invest/i }));
    await screen.findByText(/batch buy/i);

    const glossaryLinks = screen.getAllByRole('button', { name: /glossary: apy/i });
    fireEvent.click(glossaryLinks[0]);

    const dialog = await screen.findByRole('dialog', { name: /glossary/i });
    expect(within(dialog).getAllByText(/yield/i).length).toBeGreaterThan(0);
  });

  it('shows and allows skipping the invest quiz', async () => {
    const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
    render(
      <I18nProvider>
        <App initialGameState={initialGameState} onBackToMenu={() => {}} />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^money invest/i }));
    await screen.findByText(/batch buy/i);

    fireEvent.click(screen.getByRole('button', { name: /bonds/i }));
    expect(await screen.findByText(/risk & diversification quiz/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.queryByText(/risk & diversification quiz/i)).toBeNull();
  });
});
