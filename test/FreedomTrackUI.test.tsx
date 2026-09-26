import React from 'react';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS, INITIAL_GAME_STATE, getInitialQuestState } from '../constants';
import { GameState } from '../types';
import { I18nProvider } from '../i18n';
import { FreedomTrackCard, FreedomTrackLog } from '../components/FreedomTrack';
import App from '../App';
import TownModal from '../components/town/TownModal';
import { activeJourney } from '../services/townJourney';
import { loadAdultGame } from '../services/storageService';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../components/town/createTownScene', () => ({ createTownScene: () => { throw new Error('No WebGL in this test'); } }));
afterEach(() => { cleanup(); localStorage.clear(); });

const alex = CHARACTERS.find(c => c.id === 'alex')!;
const state = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: alex, month: 3, cash: 10000, reserveBaseline: 9500, quests: getInitialQuestState(alex.id), ...o });

describe('the Freedom Track card (dashboard)', () => {
  it('shows the current chapter, its milestones, the count, what comes next and the way into the whole track', async () => {
    const user = userEvent.setup(), onOpenGoals = vi.fn();
    render(<I18nProvider><FreedomTrackCard gameState={state()} isProcessing={false} onClaimQuest={vi.fn()} onOpenGoals={onOpenGoals} /></I18nProvider>);
    expect(screen.getByText('Chapter 1 of 4 · Safety first')).toBeVisible();
    expect(screen.getByText('0 of 12 milestones')).toBeVisible();
    expect(screen.getByText('Build Your Reserve')).toBeVisible();
    expect(screen.getByText('First Investment')).toBeVisible();
    expect(screen.getByText('Next: Build the base')).toBeVisible();
    expect(screen.getByText(/^Your story:/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'See the whole track' }));
    expect(onOpenGoals).toHaveBeenCalled();
  });

  it('claims a milestone that is ready', async () => {
    const user = userEvent.setup(), onClaimQuest = vi.fn();
    const q = getInitialQuestState(alex.id);
    render(<I18nProvider><FreedomTrackCard gameState={state({ quests: { ...q, active: q.active.filter(id => id !== 'Q_BUFFER_2K'), readyToClaim: ['Q_BUFFER_2K'] } })} isProcessing={false} onClaimQuest={onClaimQuest} onOpenGoals={vi.fn()} /></I18nProvider>);
    expect(screen.getByText('1 of 12 milestones')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Claim' }));
    expect(onClaimQuest).toHaveBeenCalledWith('Q_BUFFER_2K');
  });
});

describe('the Freedom Track log', () => {
  it('lays out all four chapters, upcoming ones locked, Freedom Day last, then the story', () => {
    render(<I18nProvider><FreedomTrackLog gameState={state()} isProcessing={false} onClaimQuest={vi.fn()} /></I18nProvider>);
    const chapters = ['Safety first', 'Build the base', 'Money that works', 'Freedom'].map(name => screen.getByRole('region', { name }));
    expect(chapters.map(c => c.getAttribute('data-state'))).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
    expect(within(chapters[1]).getAllByText('Opens in chapter 2')).toHaveLength(3);
    expect(within(chapters[2]).getByText('Coast point')).toBeVisible();
    expect(within(chapters[3]).getByText('Freedom Day')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Your story' })).toBeVisible();
  });
});

describe('the city after its guided journeys', () => {
  it('points the header strip at the Freedom Track: the chapter and the next milestone', () => {
    // The opening, investor and tour journeys finished in months 2, 5 and 6.
    const done = state({ townProgress: { journeyCompletedMonth: 2, investorCompletedMonth: 5, tourCompletedMonth: 6 } });
    expect(activeJourney(done)).toMatchObject({ stage: 3, completed: true });
    render(<I18nProvider><TownModal state={done} disabled={false} reduceMotion onBuy={vi.fn()} onClose={vi.fn()} onOpenMoney={vi.fn()} onNextMonth={vi.fn()} onBackup={vi.fn()} /></I18nProvider>);
    const strip = document.querySelector('.town-journey-summary')!;
    expect(strip.textContent).toMatch(/FREEDOM TRACK · CHAPTER 1\/4/);
    expect(strip.textContent).toMatch(/Build Your Reserve|First Investment/);
  });
});

describe('celebrating milestones in the game', () => {
  it('announces a milestone reached by closing the month, which the old sync missed', async () => {
    const user = userEvent.setup();
    localStorage.setItem('tycoon_onboarding_seen_v1', '1');
    // Month 3, $500 of the $2,000 reserve built: the month's pay finishes it inside processTurn.
    render(<I18nProvider><App initialGameState={state({ firstSteps: { repairChoice: 'cash', repairMonth: 1, reviewed: true } })} /></I18nProvider>);
    expect(screen.queryByText(/Milestone reached/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /^Next Month/ }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Next Month preview' })).getByRole('button', { name: 'Advance Month' }));
    // The notification animates in from opacity 0, which jsdom never runs: presence is the check.
    expect(await screen.findByText('Milestone reached: Build Your Reserve', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(loadAdultGame()!.quests!.readyToClaim).toContain('Q_BUFFER_2K');
  });
});
