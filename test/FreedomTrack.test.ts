import { describe, expect, it } from 'vitest';
import { CHARACTERS, FREEDOM_TRACK, FREEDOM_TRACK_IDS, INITIAL_GAME_STATE, MAX_ACTIVE_QUESTS, MARKET_ITEMS, getInitialQuestState } from '../constants';
import { AssetType, GameState } from '../types';
import { claimQuestReward, getQuestProgress, updateQuests, financialFreedom } from '../services/gameLogic';
import { freedomTrack } from '../services/freedomTrack';
import { loadAdultGame } from '../services/storageService';
import { buy, startState } from './strategyHarness';
import RAW from './fixtures/save-production-2026-09-13-month7.json?raw';

// Phase 1 slice 5: one Freedom Track replaces the separate goal lists. Four chapters in the order personal finance
// takes them; a chapter's milestones are active together; story and side quests share two more slots.
const alex = CHARACTERS.find(c => c.id === 'alex')!;
const sp500 = MARKET_ITEMS.find(i => i.id === 'sp500')!;
const hysa = MARKET_ITEMS.find(i => i.id === 'hysa')!;
const fresh = (): GameState => ({ ...startState(alex), month: 2 });

describe('the Freedom Track in the quest engine', () => {
  it('starts every character on chapter one, their own story and one side goal, with nothing given away', () => {
    for (const c of CHARACTERS) {
      const q = getInitialQuestState(c.id);
      expect(q.active.slice(0, 2)).toEqual(FREEDOM_TRACK[0].milestones);
      expect(q.active.length).toBeLessThanOrEqual(MAX_ACTIVE_QUESTS);
      expect(q.active.filter(id => !FREEDOM_TRACK_IDS.has(id)).length).toBeLessThanOrEqual(2);
      const synced = updateQuests({ ...structuredClone(INITIAL_GAME_STATE), character: c, cash: 10000, reserveBaseline: 10000, quests: q });
      expect(synced.quests!.readyToClaim).toEqual([]);
    }
  });

  it('opens the next chapter as soon as one is done, and moves milestones already met straight to ready', () => {
    // A reserve built from pay (baseline 0), then over $10k in one index fund with six months of cash kept.
    let s = buy({ ...fresh(), cash: 30000, reserveBaseline: 0 }, sp500, 21);
    expect(s.assets).toHaveLength(1);
    s = updateQuests(s);
    const q = s.quests!;
    // Chapter one is done (both ready), chapter two opened, and "$10k invested" and the emergency fund were already met.
    expect(q.readyToClaim).toEqual(expect.arrayContaining(['Q_BUFFER_2K', 'Q_FIRST_INVESTMENT', 'Q_INVESTED_10K', 'Q_EMERGENCY_3MO']));
    expect(q.active).toContain('Q_DIVERSIFY_3');
    expect(q.active.some(id => FREEDOM_TRACK[2].milestones.includes(id))).toBe(false);
    expect(freedomTrack(s).current?.id).toBe('base');
    // Claiming changes nothing about the order.
    const claimed = claimQuestReward(s, 'Q_BUFFER_2K');
    expect(freedomTrack(claimed).chapters[0].milestones[0].status).toBe('claimed');
  });

  it('counts savings deposits toward the emergency fund', () => {
    const s = buy({ ...fresh(), cash: 3000 }, hysa, 10);
    const info = getQuestProgress(s, 'Q_EMERGENCY_3MO')!;
    const expenses = info.expenseBasis!;
    expect(info.current).toBeCloseTo((s.cash + s.assets.filter(a => a.type === AssetType.SAVINGS).reduce((n, a) => n + a.value * a.quantity, 0)) / expenses, 5);
  });

  it('measures the coast point and 25/50/75% on the win check’s own freedom figure', () => {
    const s = buy(fresh(), sp500, 18);
    const coverage = financialFreedom(s).coverage * 100;
    for (const id of ['Q_COAST', 'Q_FREEDOM_25', 'Q_FREEDOM_50', 'Q_FREEDOM_75']) {
      const info = getQuestProgress(s, id)!;
      expect(info.unit).toBe('percent');
      expect(info.current).toBeCloseTo(coverage, 0);
      expect(info.complete).toBe(coverage >= info.target);
    }
  });

  it('keeps a pre-release production save working: its ready rewards stay claimable and its chapter is two', () => {
    localStorage.setItem('tycoon_saves_v2', RAW);
    const loaded = loadAdultGame()!;
    const s = updateQuests(loaded);
    expect(s.quests!.readyToClaim).toEqual(expect.arrayContaining(['Q_FIRST_INVESTMENT', 'Q_BUFFER_2K', 'Q_INVESTED_10K', 'Q_DIVERSIFY_3', 'Q_PASSIVE_500']));
    const view = freedomTrack(s);
    expect(view.current?.id).toBe('base');
    expect(view.current?.milestones.find(m => m.id === 'Q_EMERGENCY_3MO')?.status).toBe('active');
    expect(view.story.map(m => m.id)).toContain('Q_ALEX_AUTOMATION');
    expect(s.quests!.active.length).toBeLessThanOrEqual(MAX_ACTIVE_QUESTS);
    localStorage.clear();
  });
});

describe('freedomTrack (the view every goals screen reads)', () => {
  it('lays out four chapters, the current one, counts and Freedom Day', () => {
    const view = freedomTrack(updateQuests(fresh()));
    expect(view.chapters.map(c => c.id)).toEqual(['safety', 'base', 'working', 'freedom']);
    expect(view.chapters.map(c => c.state)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
    expect(view.total).toBe(FREEDOM_TRACK.reduce((n, c) => n + c.milestones.length, 0) + 1);
    expect(view.done).toBe(0);
    expect(view.freedomDay).toBe(false);
    expect(view.chapters[0].milestones.every(m => m.status === 'active' && m.info)).toBe(true);
    const won = freedomTrack({ ...fresh(), hasWon: true });
    expect(won.freedomDay).toBe(true);
    expect(won.chapters[3].done).toBe(1);
  });
});
