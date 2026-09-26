import React from 'react';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { I18nProvider } from '../i18n';
import { GameState } from '../types';
import { loadAdultGame } from '../services/storageService';
import { processTurn, applyScenarioOutcome, calculateMonthlyCashFlowEstimate, calculateNetWorth, financialFreedom, clearSimSeed } from '../services/gameLogic';
import { mulberry32 } from '../services/dailyChallenge';
import RAW from './fixtures/save-production-2026-09-13-month7.json?raw';
import { optionLocked } from '../services/townInsurance';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../components/town/createTownScene', () => ({ createTownScene: () => { throw new Error('No WebGL in this test'); } }));

// A real save written by the live site before the 2026-09-26 release (Netlify deploy 6aa6c7fa, September 13
// build): Alex at month 7 with index funds, a REIT, a dividend ETF, a coffee cart, an FHA-financed starter home,
// the first-steps repair loan and an event waiting. Byte-for-byte what the browser stored (SHA-256 8c78e625…).
// Players' saves must keep working on the new economy (builds 44 and 49 changed taxes, shortfalls and property costs).
const seedSave = () => localStorage.setItem('tycoon_saves_v2', RAW);
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); clearSimSeed(); });

const numbersIn = (s: GameState) => [
  s.cash, calculateNetWorth({ ...s, pendingScenario: null }),
  ...s.assets.flatMap(a => [a.value, a.quantity, a.costBasis, a.cashFlow]),
  ...s.liabilities.flatMap(l => [l.balance, l.monthlyPayment]),
  ...s.mortgages.flatMap(m => [m.balance, m.monthlyPayment, m.monthsRemaining]),
];

describe('a save from the September 13 production build', () => {
  it('loads with every holding, the mortgage and the waiting event', () => {
    seedSave();
    const s = loadAdultGame()!;
    expect(s.character?.id).toBe('alex');
    expect(s.month).toBe(7);
    expect(s.assets.map(a => `${a.name} x${a.quantity}`)).toEqual(['S&P 500 Index x4', 'REIT Index Fund x1', 'Dividend ETF x1', 'Coffee Cart x1', 'Starter Home x1']);
    // The REIT and the dividend ETF were bought in the same millisecond and shared an id; selling one would have removed both.
    expect(new Set(s.assets.map(a => a.id)).size).toBe(s.assets.length);
    expect(s.assets.find(a => a.name === 'REIT Index Fund')!.id).toBe('asset-1790381193539');
    expect(s.mortgages).toHaveLength(1);
    expect(s.assets.find(a => a.name === 'Starter Home')!.id).toBe(s.mortgages[0].assetId);
    expect(s.liabilities.map(l => l.type)).toEqual(['PERSONAL_LOAN', 'MORTGAGE']);
    expect(s.pendingScenario?.id).toBe('impulse_purchase');
  });

  it('plays two more years on the new economy without losing holdings or producing NaN', () => {
    seedSave();
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(20260926));
    let s = loadAdultGame()!;
    const startMortgage = s.mortgages[0].balance;
    for (let m = 0; m < 24; m++) {
      if (s.pendingScenario) {
        const open = s.pendingScenario.options.filter(o => !optionLocked(s, s.pendingScenario!.id, o.label));
        const pick = open.reduce((a, b) => (b.outcome.cashChange ?? 0) > (a.outcome.cashChange ?? 0) ? b : a);
        s = applyScenarioOutcome(s, pick.outcome, pick.label);
        if (s.pendingScenario) s = applyScenarioOutcome(s, s.pendingScenario.options[0].outcome, s.pendingScenario.options[0].label);
      }
      const { newState, monthlyReport } = processTurn(s);
      s = newState;
      expect(numbersIn(s).every(Number.isFinite)).toBe(true);
      expect([monthlyReport.income, monthlyReport.expenses].every(Number.isFinite)).toBe(true);
      if (s.isBankrupt) break;
    }
    expect(s.isBankrupt).toBeFalsy();
    expect(s.month).toBe(31);
    // Nothing was sold, so every holding is still there, and the mortgage is being paid down.
    expect(s.assets.find(a => a.name === 'S&P 500 Index')?.quantity).toBe(4);
    expect(s.assets.filter(a => ['REIT Index Fund', 'Dividend ETF', 'Coffee Cart', 'Starter Home'].includes(a.name))).toHaveLength(4);
    expect(s.mortgages[0].balance).toBeLessThan(startMortgage);
    const freedom = financialFreedom(s, calculateMonthlyCashFlowEstimate(s));
    expect(Number.isFinite(freedom.coverage) && freedom.coverage >= 0).toBe(true);
  });

  it('continues in the game: the waiting event, then a normal month', async () => {
    const user = userEvent.setup();
    seedSave();
    localStorage.setItem('tycoon_onboarding_seen_v1', '1');
    render(<I18nProvider><App initialGameState={loadAdultGame()!} /></I18nProvider>);
    const card = screen.getByRole('dialog', { name: 'Scenario' });
    expect(within(card).getByText(/3 AM Shopping Decision/)).toBeVisible();
    await user.click(within(card).getByRole('button', { name: /Return it \(free\)/ }));
    expect(screen.queryByRole('dialog', { name: 'Scenario' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /^Next Month/ }));
    const preview = await screen.findByRole('dialog', { name: 'Next Month preview' });
    await user.click(within(preview).getByRole('button', { name: 'Advance Month' }));
    await vi.waitFor(() => expect(loadAdultGame()!.month).toBe(8), { timeout: 3000 });
    expect(Number.isFinite(loadAdultGame()!.cash)).toBe(true);
  });
});
