import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, QUEST_DEFINITIONS, getInitialQuestState } from '../constants';
import { I18nProvider } from '../i18n';
import NextBestStep from '../components/v2/NextBestStep';

describe('NextBestStep', () => {
  it('calls claim handler for a ready quest', () => {
    const readyId = QUEST_DEFINITIONS[0]?.id;
    const activeId = QUEST_DEFINITIONS[1]?.id;
    const questState = getInitialQuestState(CHARACTERS[0].id);
    const handleClaim = vi.fn();

    const gameState = {
      ...INITIAL_GAME_STATE,
      character: CHARACTERS[0],
      quests: {
        ...questState,
        readyToClaim: readyId ? [readyId] : [],
        active: activeId ? [activeId] : questState.active || []
      }
    };

    render(
      <I18nProvider>
        <NextBestStep
          gameState={gameState}
          isProcessing={false}
          onClaimQuest={handleClaim}
          onOpenGoals={() => {}}
        />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /claim/i }));
    expect(handleClaim).toHaveBeenCalledWith(readyId);
  });
});
