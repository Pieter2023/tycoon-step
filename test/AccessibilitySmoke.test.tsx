import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS } from '../constants';
import { I18nProvider } from '../i18n';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import App from '../App';

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

it('exposes aria labels for icon-only HUD buttons', async () => {
  localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
  const initialGameState = { ...INITIAL_GAME_STATE, character: CHARACTERS[0] };
  render(
    <I18nProvider>
      <App initialGameState={initialGameState} onBackToMenu={() => {}} />
    </I18nProvider>
  );

  const menuButton = await screen.findByRole('button', { name: /open dashboard menu/i });
  fireEvent.click(menuButton);

  expect(await screen.findByRole('button', { name: /back to menu/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save \/ load/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /quests/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /mute sound|unmute sound/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /accessibility/i })).toBeInTheDocument();
});
