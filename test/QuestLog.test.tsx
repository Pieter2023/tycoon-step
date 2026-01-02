import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import QuestLog from '../components/QuestLog';
import { INITIAL_GAME_STATE } from '../constants';
import { I18nProvider } from '../i18n';

const buildState = (readyIds: string[]) => ({
  ...INITIAL_GAME_STATE,
  quests: {
    active: [],
    readyToClaim: readyIds,
    completed: [],
    track: undefined
  }
});

it('allows claiming a single quest from the log', async () => {
  const user = userEvent.setup();
  const onClaim = vi.fn();

  render(
    <I18nProvider>
      <QuestLog
        isOpen
        onClose={() => undefined}
        gameState={buildState(['Q_BUFFER_2K'])}
        onClaim={onClaim}
        onClaimAll={() => undefined}
        isProcessing={false}
      />
    </I18nProvider>
  );

  const claimButton = screen.getByRole('button', { name: 'Claim' });
  await user.click(claimButton);

  expect(onClaim).toHaveBeenCalledWith('Q_BUFFER_2K');
});

it('fires claim all when available', async () => {
  const user = userEvent.setup();
  const onClaimAll = vi.fn();

  render(
    <I18nProvider>
      <QuestLog
        isOpen
        onClose={() => undefined}
        gameState={buildState(['Q_BUFFER_2K', 'Q_FIRST_INVESTMENT'])}
        onClaim={() => undefined}
        onClaimAll={onClaimAll}
        isProcessing={false}
      />
    </I18nProvider>
  );

  const claimAllButton = screen.getByRole('button', { name: 'Claim all available' });
  await user.click(claimAllButton);

  expect(onClaimAll).toHaveBeenCalledTimes(1);
});
