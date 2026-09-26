import React from 'react';
import { CheckCircle, Flag, Lock, Target } from 'lucide-react';
import { GameState, QuestDefinition } from '../types';
import { useI18n, formatCurrencyValue, formatNumberValue, type Translate } from '../i18n';
import { FREEDOM_TRACK } from '../constants';
import { freedomTrack, type TrackChapter, type TrackMilestone } from '../services/freedomTrack';
import type { QuestProgressInfo } from '../services/gameLogic';

// Phase 1 slice 5: the one milestone track. The dashboard card shows the current chapter; the log (QuestLog)
// shows all four chapters, the character's story and the side goals. Claiming goes through App's handler.

export const rewardText = (reward: QuestDefinition['reward'] | undefined, t: Translate) => {
  if (!reward) return '';
  const parts: string[] = [];
  if (typeof reward.cash === 'number' && reward.cash !== 0) parts.push(t('quests.reward.cash', { value: `${reward.cash >= 0 ? '+' : '-'}${formatCurrencyValue(Math.abs(reward.cash), { maximumFractionDigits: 0 })}` }));
  if (typeof reward.creditRating === 'number' && reward.creditRating !== 0) parts.push(t('quests.reward.credit', { value: `${reward.creditRating >= 0 ? '+' : '-'}${formatNumberValue(Math.round(Math.abs(reward.creditRating)))}` }));
  for (const [k, v] of Object.entries(reward.stats ?? {})) if (typeof v === 'number' && v !== 0) parts.push(t('quests.reward.stat', { value: `${v >= 0 ? '+' : ''}${formatNumberValue(Math.round(v))}`, stat: t(`stats.${k}`) }));
  return parts.join(' • ');
};

export const progressValue = (info: QuestProgressInfo | null, t: Translate) => {
  if (!info) return '';
  if (info.unit === 'money') return t('quests.progressMoney', { current: formatCurrencyValue(Math.round(info.current), { maximumFractionDigits: 0 }), target: formatCurrencyValue(info.target, { maximumFractionDigits: 0 }) });
  if (info.unit === 'months') return t('quests.progressMonths', { current: info.current.toFixed(1), target: info.target.toFixed(1) });
  if (info.unit === 'percent') return t('quests.progressPercent', { current: Math.floor(info.current), target: info.target });
  return t('quests.progressScore', { current: formatNumberValue(Math.round(info.current)), target: formatNumberValue(Math.round(info.target)) });
};

const chapterTitle = (c: Pick<TrackChapter, 'id'>, t: Translate) => t(`track.chapter.${c.id}`);

type ClaimProps = { isProcessing: boolean; onClaimQuest: (questId: string) => void };

const ClaimButton: React.FC<ClaimProps & { id: string }> = ({ id, isProcessing, onClaimQuest }) => {
  const { t } = useI18n();
  return (
    <button type="button" onClick={() => onClaimQuest(id)} disabled={isProcessing}
      className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:border-emerald-400/70 hover:bg-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-40">
      {t('quests.claim')}
    </button>
  );
};

/** One milestone: done, ready to claim, in progress (bar), or waiting for its chapter. */
export const MilestoneRow: React.FC<ClaimProps & { m: TrackMilestone; detail?: boolean; opensIn?: number }> = ({ m, detail, opensIn, isProcessing, onClaimQuest }) => {
  const { t } = useI18n();
  const pct = m.status === 'ready' || m.status === 'claimed' ? 100 : Math.round((m.info?.progress ?? 0) * 100);
  if (m.status === 'claimed') return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2" data-status="claimed">
      <span className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle size={15} className="text-emerald-400" />{t(m.quest.title)}</span>
      <span className="text-xs text-slate-500">{t('track.done')}</span>
    </li>
  );
  if (m.status === 'ready') return (
    <li className="rounded-xl border border-emerald-600/40 bg-emerald-900/20 px-3 py-2.5" data-status="ready">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle size={15} className="text-emerald-400" />{t(m.quest.title)}</p>
          <p className="mt-1 text-xs text-emerald-200">{t('quests.rewardLabel')} {rewardText(m.quest.reward, t)}</p>
        </div>
        <ClaimButton id={m.id} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />
      </div>
    </li>
  );
  const upcoming = m.status === 'upcoming';
  return (
    <li className={`rounded-xl border px-3 py-2.5 ${upcoming ? 'border-slate-800 bg-slate-950/40' : 'border-slate-700 bg-slate-900/40'}`} data-status={m.status}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`flex items-center gap-2 text-sm font-semibold ${upcoming ? 'text-slate-300' : 'text-white'}`}>
            {upcoming ? <Lock size={13} className="text-slate-500" /> : <Target size={15} className="text-amber-300" />}{t(m.quest.title)}
          </p>
          {(detail || !upcoming) && <p className={`mt-1 text-xs ${upcoming ? 'text-slate-500' : 'text-slate-400'}`}>{t(m.quest.description)}</p>}
          {detail && !upcoming && m.quest.hint && <p className="mt-1 text-xs text-slate-300">💡 {t(m.quest.hint)}</p>}
          {upcoming && opensIn ? <p className="mt-1 text-xs text-slate-500">{t('track.upcoming', { n: opensIn })}</p>
            : <p className="mt-1 text-xs text-amber-200/90">{t('quests.rewardLabel')} {rewardText(m.quest.reward, t)}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-semibold ${upcoming ? 'text-slate-400' : 'text-white'}`}>{pct}%</p>
          <p className="text-[11px] text-slate-500">{progressValue(m.info, t)}</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-800">
        <div className={`h-1.5 rounded-full ${upcoming ? 'bg-slate-600' : 'bg-gradient-to-r from-amber-500 to-emerald-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
};

const FreedomDayRow: React.FC<{ done: boolean }> = ({ done }) => {
  const { t } = useI18n();
  return (
    <li className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${done ? 'border-amber-400/50 bg-amber-500/10' : 'border-slate-800 bg-slate-950/40'}`} data-status={done ? 'claimed' : 'upcoming'}>
      <span>
        <span className="flex items-center gap-2 text-sm font-semibold text-white"><Flag size={15} className="text-amber-300" />{t('track.freedomDay')}</span>
        <span className="mt-1 block text-xs text-slate-400">{t('track.freedomDayBody')}</span>
      </span>
      {done && <span className="text-xs text-amber-200">{t('track.done')}</span>}
    </li>
  );
};

type CardProps = ClaimProps & { gameState: GameState; onOpenGoals: () => void };

/** The dashboard card: the current chapter, its milestones, and anything ready to claim beside it. */
export const FreedomTrackCard: React.FC<CardProps> = ({ gameState, isProcessing, onClaimQuest, onOpenGoals }) => {
  const { t } = useI18n();
  const view = freedomTrack(gameState);
  const chapter = view.current;
  const nextChapter = chapter ? view.chapters[chapter.number] : undefined;
  // Rewards never hide: ready milestones from other chapters (an older save's, or one met early) and ready story or
  // side goals are listed under the chapter.
  const readyOthers = [...view.chapters.filter(c => c !== chapter).flatMap(c => c.milestones), ...view.story, ...view.side].filter(m => m.status === 'ready');
  const story = view.story.find(m => m.status === 'active');
  return (
    <div className="space-y-3" aria-label={t('track.title')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
          {chapter ? `${t('track.chapterLabel', { n: chapter.number, total: FREEDOM_TRACK.length })} · ${chapterTitle(chapter, t)}` : t('track.freedomDay')}
        </p>
        <p className="text-xs text-slate-400">{t('track.progress', { done: view.done, total: view.total })}</p>
      </div>
      {chapter && <p className="text-xs leading-5 text-slate-400">{t(`track.chapter.${chapter.id}.why`)}</p>}
      <ul className="space-y-2">
        {chapter?.milestones.map(m => <MilestoneRow key={m.id} m={m} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}
        {chapter?.id === 'freedom' && <FreedomDayRow done={view.freedomDay} />}
        {!chapter && <FreedomDayRow done={view.freedomDay} />}
        {readyOthers.map(m => <MilestoneRow key={m.id} m={m} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}
      </ul>
      {story && <p className="text-xs text-slate-400">{t('track.story')}: <span className="text-slate-200">{t(story.quest.title)}</span> · {Math.round((story.info?.progress ?? 0) * 100)}%</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {nextChapter ? <p className="text-xs text-slate-500">{t('track.nextChapter', { title: chapterTitle(nextChapter, t) })}</p> : <span />}
        <button type="button" onClick={onOpenGoals} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-400/50">{t('track.seeAll')}</button>
      </div>
    </div>
  );
};

/** The whole track for the goals log: every chapter, then the character's story and the side goals. */
export const FreedomTrackLog: React.FC<ClaimProps & { gameState: GameState }> = ({ gameState, isProcessing, onClaimQuest }) => {
  const { t } = useI18n();
  const view = freedomTrack(gameState);
  return (
    <div className="space-y-6">
      {view.chapters.map(c => (
        <section key={c.id} className="space-y-2" aria-label={chapterTitle(c, t)} data-chapter={c.id} data-state={c.state}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className={`text-sm font-semibold ${c.state === 'upcoming' ? 'text-slate-400' : 'text-white'}`}>{t('track.chapterLabel', { n: c.number, total: FREEDOM_TRACK.length })} · {chapterTitle(c, t)}</h3>
            <span className="text-xs text-slate-500">{c.done} / {c.total}</span>
          </div>
          <p className="text-xs text-slate-400">{t(`track.chapter.${c.id}.why`)}</p>
          <ul className="space-y-2">
            {c.milestones.map(m => <MilestoneRow key={m.id} m={m} detail opensIn={c.state === 'upcoming' ? c.number : undefined} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}
            {c.id === 'freedom' && <FreedomDayRow done={view.freedomDay} />}
          </ul>
        </section>
      ))}
      {[['story', view.story], ['side', view.side]].map(([key, list]) => (list as TrackMilestone[]).length > 0 && (
        <section key={key as string} className="space-y-2" aria-label={t(`track.${key}`)}>
          <h3 className="text-sm font-semibold text-white">{t(`track.${key}`)}</h3>
          <ul className="space-y-2">{(list as TrackMilestone[]).map(m => <MilestoneRow key={m.id} m={m} detail isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}</ul>
        </section>
      ))}
    </div>
  );
};
