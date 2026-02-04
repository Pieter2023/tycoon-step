import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { INITIAL_GAME_STATE } from '../constants';
import { applyMonthlyAction } from '../services/gameLogic';
import { getMonthlyActionsSummary } from '../services/monthlyActions';
import MonthlyActionsPreview from '../components/v2/MonthlyActionsPreview';

const ActionHarness: React.FC = () => {
  const [state, setState] = useState({
    ...INITIAL_GAME_STATE,
    monthlyActionsMax: 1,
    monthlyActionsRemaining: 1,
    isBankrupt: false,
    stats: {
      ...INITIAL_GAME_STATE.stats,
      energy: 35,
      stress: 45,
      health: 55
    }
  });
  const summary = getMonthlyActionsSummary(state, false);

  return (
    <div>
      <div data-testid="energy">{state.stats.energy}</div>
      <MonthlyActionsPreview
        summary={summary}
        onSelectAction={(actionId) => {
          const { newState } = applyMonthlyAction(state, actionId);
          setState(newState);
        }}
        onOpenDrawer={() => {}}
      />
    </div>
  );
};

describe('MonthlyActionsPreview', () => {
  it('triggers action handler and updates state', async () => {
    const user = userEvent.setup();
    render(<ActionHarness />);

    const energyBefore = Number(screen.getByTestId('energy').textContent);
    await user.click(screen.getByRole('button', { name: /work overtime/i }));
    const energyAfter = Number(screen.getByTestId('energy').textContent);

    expect(energyAfter).toBeLessThan(energyBefore);
  });
});
