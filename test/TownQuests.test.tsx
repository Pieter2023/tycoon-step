import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { INITIAL_GAME_STATE, CHARACTERS, QUEST_DEFINITIONS, getInitialQuestState } from '../constants';
import { AssetType, GameState } from '../types';
import { questBoard, noticeSheet, progressText, rewardText } from '../services/townQuests';
import { updateQuests, claimQuestReward } from '../services/gameLogic';
import NoticeBoardPanel from '../components/town/NoticeBoardPanel';
import { I18nProvider } from '../i18n';

// The reserve quest measures liquid money minus debt above the month-one baseline, so the fixture pins both.
const base = (o: Partial<GameState> = {}): GameState => ({ ...structuredClone(INITIAL_GAME_STATE), character: CHARACTERS[0], cash: 1200, month: 4, liabilities: [], reserveBaseline: 0, quests: getInitialQuestState(CHARACTERS[0].id), ...o });
const translate = (key: string) => key.replace(/^quests\./, '').replace(/\.title$/, '');
afterEach(cleanup);

describe('the quest log on the notice board', () => {
  it('reads the dashboard quest state: active with live progress, ready to claim, completed, up next', () => {
    const s = base();
    const board = questBoard(s);
    expect(board.active.length).toBeGreaterThan(0); expect(board.active.length).toBeLessThanOrEqual(3); expect(board.ready).toEqual([]); expect(board.completed).toBe(0);
    expect(board.total).toBe(QUEST_DEFINITIONS.filter(q => !q.characterId || q.characterId === CHARACTERS[0].id).length);
    const buffer = board.active.find(q => q.id === 'Q_BUFFER_2K')!;
    expect(buffer.unit).toBe('money'); expect(buffer.target).toBe(2000); expect(buffer.progress).toBeGreaterThan(0); expect(buffer.progress).toBeLessThan(1);
    expect(progressText(buffer)).toMatch(/^\$[\d,]+ of \$2,000$/);
    expect(rewardText(buffer.reward)).toBe('+$200 · +2 financial IQ');
    const synced = updateQuests(base({ cash: 9000 }));
    const readyBoard = questBoard(synced);
    expect(readyBoard.ready.some(q => q.id === 'Q_BUFFER_2K')).toBe(true); expect(readyBoard.ready[0].progress).toBe(1);
    const claimed = claimQuestReward(synced, 'Q_BUFFER_2K');
    const after = questBoard(claimed);
    expect(after.completed).toBe(1); expect(after.ready.some(q => q.id === 'Q_BUFFER_2K')).toBe(false);
    expect(after.upNext.every(q => q.status === 'locked')).toBe(true);
  });
  it('writes the paper sheet for the 3D board from the same state', () => {
    const sheet = noticeSheet(updateQuests(base({ cash: 9000 })), translate);
    expect(sheet.title).toBe('NOTICE BOARD'); expect(sheet.subtitle).toMatch(/Month 4 · 1 reward to claim/);
    expect(sheet.lines.length).toBeGreaterThanOrEqual(4); expect(sheet.lines.length).toBeLessThanOrEqual(6);
    expect(sheet.lines.slice(0, 3).every(l => typeof l.text === 'string' && !l.ready)).toBe(true);
    expect(sheet.lines.some(l => l.ready && l.text === 'Q_BUFFER_2K')).toBe(true);
    const plain = noticeSheet(base(), translate); expect(plain.subtitle).toMatch(/0 of \d+ quests done/);
  });
  it('claims a reward from the board and opens the full log', () => {
    const onClaimQuest = vi.fn(), onOpenQuests = vi.fn();
    const s = updateQuests(base({ cash: 9000, assets: [{ id: 'a', marketItemId: 'hysa', name: 'High-Yield Savings', type: AssetType.SAVINGS, value: 1000, costBasis: 1000, quantity: 1, cashFlow: 3, volatility: 0, appreciationRate: 0, priceHistory: [] }] }));
    render(<I18nProvider><NoticeBoardPanel state={s} disabled={false} onNextMonth={() => {}} onClaimQuest={onClaimQuest} onOpenQuests={onOpenQuests} /></I18nProvider>);
    const log = screen.getByLabelText('Quest log');
    expect(log.textContent).toMatch(/Quest log · 0\//); expect(log.textContent).toMatch(/Reward ready/);
    fireEvent.click(log.querySelector('.town-quest-ready button.town-primary')!);
    expect(onClaimQuest).toHaveBeenCalledWith(expect.stringMatching(/^Q_/));
    fireEvent.click(screen.getByText('Open the full quest log →'));
    expect(onOpenQuests).toHaveBeenCalled();
    expect(log.querySelectorAll('.town-reputation-bar').length).toBeGreaterThan(0);
  });
});
