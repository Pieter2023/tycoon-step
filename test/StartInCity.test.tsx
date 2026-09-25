import React from 'react';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../App';
import { I18nProvider } from '../i18n';
import { CHARACTERS, INITIAL_GAME_STATE } from '../constants';
import { GameState } from '../types';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../components/town/createTownScene', () => ({ createTownScene: () => { throw new Error('No WebGL in this test'); } }));
// Phase 1 slice 4 as an opt-in setting: "Start in the 3D city" (localStorage tycoon_start_in_city).
const CITY = 'Freedom Square 3D neighbourhood';
// A returning player whose first-steps mission is done.
const saved = (extra: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], firstSteps: { repairChoice: 'cash', repairMonth: 0, reviewed: true }, cash: 10000, ...extra });
const load = (state = saved()) => render(<I18nProvider><App initialGameState={state} /></I18nProvider>);
// The city is a lazy chunk: while it loads, Suspense shows the "Loading neighbourhood" modal instead.
const cityShown = () => screen.queryByRole('dialog', { name: CITY }) ?? screen.queryByRole('dialog', { name: 'Loading neighbourhood' });
const repair: GameState['pendingScenario'] = { id: 'waiting-repair', title: 'Repair waiting', description: 'Choose how to pay.', category: 'VEHICLE', options: [{ label: 'Pay for repair', outcome: { cashChange: -150, message: 'Repaired.' } }] };
afterEach(() => { cleanup(); localStorage.clear(); });

it('opens the city by itself when a game loads with the setting on', async () => {
  localStorage.setItem('tycoon_start_in_city', '1');
  load();
  expect(await screen.findByRole('dialog', { name: CITY }, { timeout: 5000 })).toBeVisible();
});

it('keeps the dashboard when the setting is off', () => {
  load();
  expect(screen.getByRole('button', { name: /Enter 3D city/ })).toBeVisible();
  expect(cityShown()).toBeNull();
});

it('applies a mid-game switch from the next load, not at once', async () => {
  const user = userEvent.setup();
  load();
  await user.click(screen.getByRole('button', { name: 'More options' }));
  const toggle = within(screen.getByRole('dialog', { name: 'Quick actions' })).getByRole('button', { name: /Start in the 3D city/ });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(localStorage.getItem('tycoon_start_in_city')).toBe('1');
  expect(cityShown()).toBeNull();
  cleanup();
  load();
  expect(await screen.findByRole('dialog', { name: CITY }, { timeout: 5000 })).toBeVisible();
});

it('leaves a new player on the dashboard for the first-steps mission, even once it is finished', async () => {
  const user = userEvent.setup();
  localStorage.setItem('tycoon_start_in_city', '1');
  load(saved({ firstSteps: { repairChoice: 'cash', repairMonth: 0 } }));
  expect(screen.getByRole('heading', { name: 'You handled your first setback.' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Compare first investments' }));
  expect(screen.queryByRole('heading', { name: 'You handled your first setback.' })).toBeNull();
  expect(cityShown()).toBeNull();
});

it('shows an unread year in review first, then opens the city', async () => {
  const user = userEvent.setup();
  localStorage.setItem('tycoon_start_in_city', '1');
  load(saved({ month: 13, annualReport: { year: 1, startNetWorth: 0, endNetWorth: 1000, marketGains: 100, passiveIncome: 50, hindsights: [] } }));
  const report = screen.getByRole('dialog', { name: 'Year in review' });
  expect(cityShown()).toBeNull();
  await user.click(within(report).getByRole('button', { name: /On to Year 2/ }));
  expect(await screen.findByRole('dialog', { name: CITY }, { timeout: 5000 })).toBeVisible();
});

it('shows a waiting event in the dashboard first, then opens the city', async () => {
  const user = userEvent.setup();
  localStorage.setItem('tycoon_start_in_city', '1');
  load(saved({ pendingScenario: repair }));
  const card = screen.getByRole('dialog', { name: 'Scenario' });
  expect(cityShown()).toBeNull();
  await user.click(within(card).getByRole('button', { name: /Pay for repair/ }));
  expect(await screen.findByRole('dialog', { name: CITY }, { timeout: 5000 })).toBeVisible();
});
