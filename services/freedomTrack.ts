import type { GameState, QuestDefinition } from '../types';
import { FREEDOM_TRACK, FREEDOM_TRACK_IDS, QUEST_DEFINITIONS, getInitialQuestState, getQuestById } from '../constants';
import { getQuestProgress, type QuestProgressInfo } from './gameLogic';

// The Freedom Track (Phase 1 slice 5), laid out for every screen that shows goals: the dashboard card, the goals
// log and the city's notice board. One ordered track replaces the separate lists (quests by category, the
// board's quest list). The quest engine (updateQuests) decides what is active, ready and claimed; this module only
// reads that state. Freedom Day, the win itself, closes the last chapter.

export type MilestoneStatus = 'claimed' | 'ready' | 'active' | 'upcoming';
export type TrackMilestone = { id: string; quest: QuestDefinition; status: MilestoneStatus; info: QuestProgressInfo | null };
export type ChapterId = typeof FREEDOM_TRACK[number]['id'];
export type TrackChapter = { id: ChapterId; number: number; milestones: TrackMilestone[]; done: number; total: number; state: 'done' | 'current' | 'upcoming' };
export type TrackView = {
  chapters: TrackChapter[];
  /** The first chapter with something left to do; null once every milestone and Freedom Day are done. */
  current: TrackChapter | null;
  /** Milestones done (ready or claimed) out of all of them, Freedom Day included. */
  done: number;
  total: number;
  freedomDay: boolean;
  /** The character's own quests, and the other side goals: ready first, then active. */
  story: TrackMilestone[];
  side: TrackMilestone[];
  /** Every claimable quest id, track milestones first. */
  ready: string[];
};

export const freedomTrack = (state: GameState): TrackView => {
  const characterId = state.character?.id;
  const quests = state.quests ?? getInitialQuestState(characterId);
  const ready = new Set(quests.readyToClaim ?? []), active = new Set(quests.active ?? []), claimed = new Set(quests.completed ?? []);
  const status = (id: string): MilestoneStatus => ready.has(id) ? 'ready' : claimed.has(id) ? 'claimed' : active.has(id) ? 'active' : 'upcoming';
  const milestone = (quest: QuestDefinition): TrackMilestone => {
    const s = status(quest.id);
    return { id: quest.id, quest, status: s, info: s === 'active' || s === 'upcoming' ? getQuestProgress(state, quest.id) : null };
  };
  const freedomDay = !!state.hasWon;

  let foundCurrent = false;
  const chapters: TrackChapter[] = FREEDOM_TRACK.map((c, i) => {
    const milestones = c.milestones.map(id => getQuestById(id)).filter((q): q is QuestDefinition => !!q).map(milestone);
    const isLast = i === FREEDOM_TRACK.length - 1;
    const done = milestones.filter(m => m.status === 'ready' || m.status === 'claimed').length + (isLast && freedomDay ? 1 : 0);
    const total = milestones.length + (isLast ? 1 : 0);
    const complete = done >= total;
    const state: TrackChapter['state'] = complete ? 'done' : foundCurrent ? 'upcoming' : 'current';
    if (state === 'current') foundCurrent = true;
    return { id: c.id, number: i + 1, milestones, done, total, state };
  });

  const others = QUEST_DEFINITIONS.filter(q => !FREEDOM_TRACK_IDS.has(q.id) && (!q.characterId || q.characterId === characterId) && (ready.has(q.id) || active.has(q.id)))
    .map(milestone).sort((a, b) => (a.status === 'ready' ? 0 : 1) - (b.status === 'ready' ? 0 : 1));

  return {
    chapters,
    current: chapters.find(c => c.state === 'current') ?? null,
    done: chapters.reduce((n, c) => n + c.done, 0),
    total: chapters.reduce((n, c) => n + c.total, 0),
    freedomDay,
    story: others.filter(m => m.quest.characterId),
    side: others.filter(m => !m.quest.characterId),
    ready: [...chapters.flatMap(c => c.milestones.filter(m => m.status === 'ready').map(m => m.id)), ...others.filter(m => m.status === 'ready').map(m => m.id)],
  };
};
