import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CHARACTERS } from '../constants';
import { GameState } from '../types';
import HomePanel from '../components/town/HomePanel';
import { eventPlace } from '../services/townEvents';
import { startState } from './strategyHarness';

// Phase 1, slices 2 and 3: sleep at home to close the month; events open over the city, framed by place.
afterEach(cleanup);
const alex = (): GameState => ({ ...startState(CHARACTERS.find(c => c.id === 'alex')!), month: 4 });

describe('sleeping at home', () => {
  it('offers the bed and closes the month from it', () => {
    const onSleep = vi.fn();
    render(<HomePanel state={alex()} disabled={false} onSleep={onSleep} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to bed' }));
    expect(onSleep).toHaveBeenCalledTimes(1);
  });
  it('keeps the bed shut while a turn is running', () => {
    render(<HomePanel state={alex()} disabled onSleep={() => {}} />);
    expect(screen.getByRole('button', { name: 'Go to bed' })).toBeDisabled();
  });
  it('leaves this morning\'s mail on the desk after a month closes, and only then', () => {
    const report = { month: 4, income: 5775, investmentIncome: 30, expenses: 3234, cashBefore: 8000, cashAfter: 10541, marketChange: -120, assetPayments: [], salaryIncome: 5775, businessMaintenance: 0, netWorthChange: 0, promoted: false } as unknown as GameState['lastMonthlyReport'];
    const { unmount } = render(<HomePanel state={{ ...alex(), lastMonthlyReport: report }} disabled={false} onSleep={() => {}} />);
    const mail = screen.getByLabelText("This morning's mail");
    expect(mail.textContent).toContain('+$5,775');
    expect(mail.textContent).toContain('$10,541');
    unmount();
    render(<HomePanel state={{ ...alex(), month: 5, lastMonthlyReport: report }} disabled={false} />);
    expect(screen.queryByLabelText("This morning's mail")).toBeNull();
  });
});

describe('events happen in the world', () => {
  it('frames each kind of event by where in town it happens', () => {
    expect(eventPlace('VEHICLE').label).toBe('At the garage bay');
    expect(eventPlace('TAX').place).toBe('doormat');
    expect(eventPlace('CAREER').label).toBe('At the office');
    expect(eventPlace('SOMETHING_NEW').place).toBe('square');
  });
});
