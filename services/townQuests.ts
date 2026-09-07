import type { GameState, QuestDefinition, QuestReward, QuestTrack } from '../types';
import { QUEST_DEFINITIONS, getQuestById, getInitialQuestState } from '../constants';
import { getQuestProgress } from './gameLogic';
import { monthlyChallenges, challengeProgress, currentSnapshot } from './townChallenges';
import { tl } from '../i18n/town';

// The quest log pinned to the square's notice board. Quests are the dashboard's goal system
// (active, ready to claim, completed, a playstyle track); this module reads that state and lays
// it out for the board and for the paper sheet in the 3D scene. Claiming goes through App's
// existing claim handler; nothing here changes state. Quest titles are translation keys, so the
// callers translate them with the app's `t`.
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export type QuestStatus = 'ready' | 'active' | 'locked' | 'completed';
export type QuestCard = { id: string; titleKey: string; descriptionKey: string; hintKey?: string; status: QuestStatus; progress: number; current: number; target: number; unit: 'money' | 'count' | 'months' | 'score'; expenseBasis?: number; reward: QuestReward; unlockAfter: string[]; difficulty: QuestDefinition['difficulty'] };
export type QuestBoard = { track?: QuestTrack; trackKey?: string; ready: QuestCard[]; active: QuestCard[]; upNext: QuestCard[]; completed: number; total: number };

export const trackKey = (track?: QuestTrack) => track ? `quests.track.${track}` : undefined;
export const progressText = (card: Pick<QuestCard, 'current' | 'target' | 'unit'>) => card.unit === 'money' ? `${money(card.current)} ${tl('of','de')} ${money(card.target)}` : card.unit === 'months' ? `${card.current.toFixed(1)} ${tl('of','de')} ${card.target.toFixed(1)} ${tl('months','meses')}` : `${Math.round(card.current)} ${tl('of','de')} ${Math.round(card.target)}`;
const STAT_NAMES: Record<string, [string, string]> = { financialIQ: ['financial IQ', 'IQ financiero'], happiness: ['happiness', 'felicidad'], health: ['health', 'salud'], energy: ['energy', 'energía'], stress: ['stress', 'estrés'], networking: ['networking', 'contactos'], fulfillment: ['fulfillment', 'realización'] };
export function rewardText(reward: QuestReward): string {
  const parts: string[] = [];
  if (reward.cash) parts.push(`${reward.cash > 0 ? '+' : '-'}${money(Math.abs(reward.cash))}`);
  if (reward.creditRating) parts.push(`${reward.creditRating > 0 ? '+' : ''}${reward.creditRating} ${tl('credit score','puntaje de crédito')}`);
  for (const [k, v] of Object.entries(reward.stats ?? {})) if (typeof v === 'number' && v !== 0) parts.push(`${v > 0 ? '+' : ''}${v} ${STAT_NAMES[k] ? tl(STAT_NAMES[k][0], STAT_NAMES[k][1]) : k}`);
  return parts.join(' · ');
}

const card = (state: GameState, quest: QuestDefinition, status: QuestStatus): QuestCard => {
  const info = getQuestProgress(state, quest.id);
  return { id: quest.id, titleKey: quest.title, descriptionKey: quest.description, hintKey: quest.hint, status, progress: status === 'completed' || status === 'ready' ? 1 : info?.progress ?? 0, current: info?.current ?? 0, target: info?.target ?? quest.target, unit: info?.unit ?? 'count', expenseBasis: info?.expenseBasis, reward: quest.reward, unlockAfter: (quest.unlockAfter ?? []).map(id => getQuestById(id)?.title ?? id), difficulty: quest.difficulty };
};
export function questBoard(state: GameState): QuestBoard {
  const characterId = state.character?.id, quests = state.quests ?? getInitialQuestState(characterId);
  const mine = QUEST_DEFINITIONS.filter(q => !q.characterId || q.characterId === characterId);
  const ready = new Set(quests.readyToClaim ?? []), active = new Set(quests.active ?? []), completed = new Set(quests.completed ?? []);
  const done = new Set([...completed, ...ready]);
  const status = (q: QuestDefinition): QuestStatus => ready.has(q.id) ? 'ready' : active.has(q.id) ? 'active' : completed.has(q.id) ? 'completed' : 'locked';
  // Up next: locked quests whose prerequisites are met (or that have none), on the player's track when one is known.
  const upNext = mine.filter(q => status(q) === 'locked' && (!q.track || !quests.track || q.track === quests.track) && (q.unlockAfter ?? []).every(id => done.has(id))).slice(0, 3);
  return {
    track: quests.track, trackKey: trackKey(quests.track),
    ready: mine.filter(q => ready.has(q.id)).map(q => card(state, q, 'ready')),
    active: mine.filter(q => active.has(q.id)).map(q => card(state, q, 'active')),
    upNext: upNext.map(q => card(state, q, 'locked')),
    completed: mine.filter(q => completed.has(q.id)).length, total: mine.length,
  };
}

export type NoticeSheet = { title: string; subtitle: string; lines: { text: string; done: boolean; ready?: boolean }[] };
// What the paper on the 3D board says: this month's three challenges, then the live quests.
export function noticeSheet(state: GameState, translate: (key: string) => string): NoticeSheet {
  const snapshot = currentSnapshot(state), challenges = monthlyChallenges(state);
  const board = questBoard(state);
  const lines = [
    ...challenges.map(c => ({ text: c.title, done: challengeProgress(c, snapshot, state).done })),
    ...board.ready.map(q => ({ text: translate(q.titleKey), done: true, ready: true })),
    ...board.active.map(q => ({ text: translate(q.titleKey), done: false })),
  ].slice(0, 6);
  return { title: tl('NOTICE BOARD','TABLÓN DE ANUNCIOS'), subtitle: `${tl('Month','Mes')} ${state.month} · ${board.ready.length ? `${board.ready.length} ${tl(board.ready.length === 1 ? 'reward to claim' : 'rewards to claim', board.ready.length === 1 ? 'recompensa por reclamar' : 'recompensas por reclamar')}` : `${board.completed} ${tl('of','de')} ${board.total} ${tl('quests done','misiones logradas')}`}`, lines };
}
