import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { I18nProvider } from '../i18n';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import App from '../App';

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

// The v2 mobile shell is the surface with icon-led chrome controls; force it
// by making the mobile media query match BEFORE render (read once on mount).
const useMobileViewport = () => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: /max-width/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
};

it('exposes accessible names for the v2 mobile chrome controls', async () => {
  localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
  useMobileViewport();

  const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
  render(
    <I18nProvider>
      <App initialGameState={initialGameState} onBackToMenu={() => {}} />
    </I18nProvider>
  );

  const moreButton = await screen.findByRole('button', { name: /more options/i });
  fireEvent.click(moreButton);

  expect(await screen.findByRole('button', { name: /save \/ load/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /quests/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^glossary$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /tutorial videos/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /accessibility/i })).toBeInTheDocument();
});
