import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../App';
import { I18nProvider, formatCurrencyCompactValue } from '../i18n';
import { INITIAL_GAME_STATE, CHARACTERS, getInitialQuestState } from '../constants';
import {
  calculateMonthlyCashFlowEstimate,
  calculateNetWorth,
  applyMonthlyAction,
  claimQuestReward,
  processTurn,
  calculateEffectiveMonthlySalary
} from '../services/gameLogic';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const ONBOARDING_SEEN_STORAGE_KEY = 'tycoon_onboarding_seen_v1';

const buildInitialState = () => ({
  ...INITIAL_GAME_STATE,
  character: CHARACTERS[0]
});

const renderApp = (initialGameState = buildInitialState()) =>
  render(
    <I18nProvider>
      <App initialGameState={initialGameState} onBackToMenu={() => {}} />
    </I18nProvider>
  );

const setBaseStorage = () => {
  localStorage.clear();
  localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1');
  localStorage.setItem('tycoon_ui_v2', '0');
};

const expectHeaderKpi = (header: HTMLElement, label: string, value: string) => {
  const headerScope = within(header);
  const labelNode = headerScope.getByText(label, { selector: 'p' });
  const card = labelNode.parentElement;
  expect(card).not.toBeNull();
  expect(within(card as HTMLElement).getByText(value)).toBeInTheDocument();
};

it('shows KPI values that match selectors on load', () => {
  setBaseStorage();
  const initialGameState = buildInitialState();
  const cashFlow = calculateMonthlyCashFlowEstimate(initialGameState);
  const netWorth = calculateNetWorth(initialGameState);
  const { container } = renderApp(initialGameState);

  const header = container.querySelector('header') as HTMLElement | null;
  expect(header).not.toBeNull();

  expectHeaderKpi(header as HTMLElement, 'Cash', formatCurrencyCompactValue(initialGameState.cash));
  expectHeaderKpi(header as HTMLElement, 'Net Worth', formatCurrencyCompactValue(netWorth));
  expectHeaderKpi(header as HTMLElement, 'Passive / mo', formatCurrencyCompactValue(cashFlow.passive));
});

it('advances month and refreshes KPI values when Next Month is clicked', async () => {
  setBaseStorage();
  localStorage.setItem('tycoon_skip_turn_preview', '1');

  const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const initialGameState = buildInitialState();
  const expectedState = processTurn(initialGameState).newState;

  const user = userEvent.setup();
  const { container } = renderApp(initialGameState);

  try {
    const button = await screen.findByRole('button', { name: /next month/i });
    await act(async () => {
      await user.click(button);
    });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const header = container.querySelector('header') as HTMLElement | null;
    expect(header).not.toBeNull();

    const expectedMonthOfYear = ((expectedState.month - 1) % 12) + 1;
    expect(await within(header as HTMLElement).findByText(new RegExp(`Month ${expectedMonthOfYear}`))).toBeInTheDocument();

    const expectedCash = formatCurrencyCompactValue(expectedState.cash);
    const expectedNetWorth = formatCurrencyCompactValue(calculateNetWorth(expectedState));
    const expectedPassive = formatCurrencyCompactValue(calculateMonthlyCashFlowEstimate(expectedState).passive);

    expectHeaderKpi(header as HTMLElement, 'Cash', expectedCash);
    expectHeaderKpi(header as HTMLElement, 'Net Worth', expectedNetWorth);
    expectHeaderKpi(header as HTMLElement, 'Passive / mo', expectedPassive);
  } finally {
    randomSpy.mockRestore();
  }
});

it('applies monthly action deltas for overtime', () => {
  const baseState = {
    ...INITIAL_GAME_STATE,
    character: CHARACTERS[0],
    events: [],
    monthlyActionsMax: 2,
    monthlyActionsRemaining: 2,
    tempSalaryBonus: 0,
    stats: {
      ...INITIAL_GAME_STATE.stats,
      energy: 60,
      stress: 20,
      happiness: 50,
      health: 70
    }
  };

  const expectedBonus = Math.max(
    0,
    Math.round(calculateEffectiveMonthlySalary({ ...baseState, tempSalaryBonus: 0 }) * 0.1)
  );

  const { newState } = applyMonthlyAction(baseState, 'OVERTIME');

  expect(newState.tempSalaryBonus).toBe(expectedBonus);
  expect(newState.stats.energy).toBe(baseState.stats.energy - 15);
  expect(newState.stats.stress).toBe(baseState.stats.stress + 12);
  expect(newState.stats.happiness).toBe(baseState.stats.happiness - 3);
  expect(newState.stats.health).toBe(baseState.stats.health - 1);
  expect(newState.monthlyActionsRemaining).toBe(1);
});

it('claims quest rewards and applies deltas', () => {
  const questState = getInitialQuestState(CHARACTERS[0].id);
  const baseState = {
    ...INITIAL_GAME_STATE,
    character: CHARACTERS[0],
    cash: 1000,
    quests: {
      ...questState,
      readyToClaim: ['Q_BUFFER_2K'],
      active: questState.active.filter((id) => id !== 'Q_BUFFER_2K')
    }
  };

  const newState = claimQuestReward(baseState, 'Q_BUFFER_2K');

  expect(newState.cash).toBe(baseState.cash + 200);
  expect(newState.stats.financialIQ).toBe((baseState.stats.financialIQ || 0) + 2);
  expect(newState.quests.readyToClaim).not.toContain('Q_BUFFER_2K');
  expect(newState.quests.completed).toContain('Q_BUFFER_2K');
});
