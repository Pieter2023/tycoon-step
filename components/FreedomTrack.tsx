import React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { CheckCircle, ChevronRight, Flag, Lightbulb, Lock, Target } from 'lucide-react';
import { GameState, QuestDefinition } from '../types';
import { useI18n, formatCurrencyValue, formatNumberValue, type Translate } from '../i18n';
import { FREEDOM_TRACK } from '../constants';
import { freedomTrack, type TrackChapter, type TrackMilestone } from '../services/freedomTrack';
import type { QuestProgressInfo } from '../services/gameLogic';
import ActivityRing from './ui/ActivityRing';
import { MOTION_DISABLED, riseIn, springs, stagger } from './ui/motion';

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
      className="pressable shrink-0 rounded-full bg-[#30d158]/[0.18] px-3.5 py-1.5 text-[13px] font-semibold leading-[18px] text-[#30d158] hover:bg-[#30d158]/[0.28] disabled:cursor-not-allowed disabled:opacity-40">
      {t('quests.claim')}
    </button>
  );
};

/** A thin progress meter whose fill springs to its value; static in tests and under reduced motion it cross-fades. */
const TrackMeter: React.FC<{ pct: number; muted?: boolean }> = ({ pct, muted }) => {
  const reduce = useReducedMotionConfig();
  const width = `${Math.max(0, Math.min(100, pct))}%`;
  const fill = muted ? 'bg-[#5b5b60]' : 'bg-gradient-to-r from-[#ff9f0a] to-[#30d158]';
  return (
    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[rgb(118_118_128/0.24)]">
      {MOTION_DISABLED
        ? <div className={`h-full rounded-full ${fill}`} style={{ width }} />
        : <motion.div className={`h-full rounded-full ${fill}`} initial={reduce ? false : { width: '0%' }} animate={{ width }} transition={reduce ? { duration: 0 } : { ...springs.settle, delay: 0.1 }} />}
    </div>
  );
};

const Glyph: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <span aria-hidden className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}>{children}</span>
);

/** Set by the dashboard card: its rows rise in with the list's stagger. The goals log renders them still. */
const RowMotion = React.createContext(false);

const Row: React.FC<{ className: string; status: string; children: React.ReactNode }> = ({ className, status, children }) => {
  const animated = React.useContext(RowMotion);
  return animated
    ? <motion.li variants={riseIn} className={className} data-status={status}>{children}</motion.li>
    : <li className={className} data-status={status}>{children}</li>;
};

/** One milestone: done, ready to claim, in progress (bar), or waiting for its chapter. */
export const MilestoneRow: React.FC<ClaimProps & { m: TrackMilestone; detail?: boolean; opensIn?: number }> = ({ m, detail, opensIn, isProcessing, onClaimQuest }) => {
  const { t } = useI18n();
  const pct = m.status === 'ready' || m.status === 'claimed' ? 100 : Math.round((m.info?.progress ?? 0) * 100);
  if (m.status === 'claimed') return (
    <Row className="list-row min-h-[44px] justify-between gap-3 py-2.5" status="claimed">
      <span className="flex min-w-0 items-center gap-3 text-sm text-slate-400">
        <Glyph tone="bg-[#30d158]/[0.16] text-[#30d158]"><CheckCircle size={14} /></Glyph>
        <span className="truncate">{t(m.quest.title)}</span>
      </span>
      <span className="shrink-0 text-xs text-slate-500">{t('track.done')}</span>
    </Row>
  );
  if (m.status === 'ready') return (
    <Row className="list-row items-start bg-[#30d158]/[0.08] py-3" status="ready">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Glyph tone="bg-[#30d158] text-[#03170a]"><CheckCircle size={14} /></Glyph>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-white">{t(m.quest.title)}</p>
            <p className="mt-0.5 text-xs leading-4 text-[#30d158]">{t('quests.rewardLabel')} {rewardText(m.quest.reward, t)}</p>
          </div>
        </div>
        <ClaimButton id={m.id} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />
      </div>
    </Row>
  );
  const upcoming = m.status === 'upcoming';
  return (
    <Row className="list-row block py-3" status={m.status}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {upcoming
            ? <Glyph tone="bg-white/[0.07] text-slate-500"><Lock size={12} /></Glyph>
            : <Glyph tone="bg-[#ff9f0a]/[0.16] text-[#ff9f0a]"><Target size={14} /></Glyph>}
          <div className="min-w-0">
            <p className={`text-sm font-semibold leading-5 ${upcoming ? 'text-slate-400' : 'text-white'}`}>{t(m.quest.title)}</p>
            {(detail || !upcoming) && <p className={`mt-0.5 text-xs leading-[17px] ${upcoming ? 'text-slate-500' : 'text-slate-400'}`}>{t(m.quest.description)}</p>}
            {detail && !upcoming && m.quest.hint && <p className="mt-1 flex items-start gap-1.5 text-xs leading-[17px] text-slate-300"><Lightbulb size={12} aria-hidden className="mt-0.5 shrink-0 text-[#ffd60a]" />{t(m.quest.hint)}</p>}
            {upcoming && opensIn ? <p className="mt-1 text-xs text-slate-500">{t('track.upcoming', { n: opensIn })}</p>
              : <p className="mt-1 text-xs leading-[17px] text-[#ffb340]">{t('quests.rewardLabel')} {rewardText(m.quest.reward, t)}</p>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`num text-sm font-semibold ${upcoming ? 'text-slate-500' : 'text-white'}`}>{pct}%</p>
          <p className="num text-[11px] leading-4 text-slate-500">{progressValue(m.info, t)}</p>
        </div>
      </div>
      <div className="pl-9"><TrackMeter pct={pct} muted={upcoming} /></div>
    </Row>
  );
};

const FreedomDayRow: React.FC<{ done: boolean }> = ({ done }) => {
  const { t } = useI18n();
  return (
    <Row className={`list-row justify-between gap-3 py-3 ${done ? 'bg-[#ffd60a]/[0.08]' : ''}`} status={done ? 'claimed' : 'upcoming'}>
      <span className="flex min-w-0 items-start gap-3">
        <Glyph tone="bg-[#ffd60a]/[0.16] text-[#ffd60a]"><Flag size={13} /></Glyph>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-5 text-white">{t('track.freedomDay')}</span>
          <span className="mt-0.5 block text-xs leading-4 text-slate-400">{t('track.freedomDayBody')}</span>
        </span>
      </span>
      {done && <span className="shrink-0 text-xs font-semibold text-[#ffd60a]">{t('track.done')}</span>}
    </Row>
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
    <div className="space-y-3.5" aria-label={t('track.title')}>
      <div className="flex items-center gap-3">
        <ActivityRing progress={view.total > 0 ? view.done / view.total : 0} size={40} stroke={5} colors={['#30d158', '#66d4cf']} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-[18px] text-[#30d158]">
            {chapter ? `${t('track.chapterLabel', { n: chapter.number, total: FREEDOM_TRACK.length })} · ${chapterTitle(chapter, t)}` : t('track.freedomDay')}
          </p>
          <p className="num text-xs text-slate-400">{t('track.progress', { done: view.done, total: view.total })}</p>
        </div>
      </div>
      {chapter && <p className="text-[13px] leading-[19px] text-slate-400">{t(`track.chapter.${chapter.id}.why`)}</p>}
      <RowMotion.Provider value={true}>
        <motion.ul
          className="list-group"
          variants={stagger(0.04)}
          initial={MOTION_DISABLED ? false : 'hidden'}
          animate="show"
        >
          {chapter?.milestones.map(m => <MilestoneRow key={m.id} m={m} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}
          {chapter?.id === 'freedom' && <FreedomDayRow done={view.freedomDay} />}
          {!chapter && <FreedomDayRow done={view.freedomDay} />}
          {readyOthers.map(m => <MilestoneRow key={m.id} m={m} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}
        </motion.ul>
      </RowMotion.Provider>
      {story && <p className="text-xs text-slate-400">{t('track.story')}: <span className="font-medium text-slate-200">{t(story.quest.title)}</span> · {Math.round((story.info?.progress ?? 0) * 100)}%</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {nextChapter ? <p className="text-xs text-slate-500">{t('track.nextChapter', { title: chapterTitle(nextChapter, t) })}</p> : <span />}
        <button type="button" onClick={onOpenGoals} className="ds-button ds-button--ghost ds-button--sm -mr-2 gap-0.5">{t('track.seeAll')}<ChevronRight size={15} aria-hidden /></button>
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
        <section key={c.id} className="space-y-2.5" aria-label={chapterTitle(c, t)} data-chapter={c.id} data-state={c.state}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`flex items-center gap-2 text-[15px] font-semibold ${c.state === 'upcoming' ? 'text-slate-400' : 'text-white'}`}>
              {c.state === 'upcoming'
                ? <Lock size={13} aria-hidden className="text-slate-500" />
                : <ActivityRing progress={c.total > 0 ? c.done / c.total : 0} size={18} stroke={3} colors={['#30d158', '#66d4cf']} />}
              {t('track.chapterLabel', { n: c.number, total: FREEDOM_TRACK.length })} · {chapterTitle(c, t)}
            </h3>
            <span className="num text-xs text-slate-500">{c.done} / {c.total}</span>
          </div>
          <p className="text-xs leading-[17px] text-slate-400">{t(`track.chapter.${c.id}.why`)}</p>
          <ul className="list-group">
            {c.milestones.map(m => <MilestoneRow key={m.id} m={m} detail opensIn={c.state === 'upcoming' ? c.number : undefined} isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}
            {c.id === 'freedom' && <FreedomDayRow done={view.freedomDay} />}
          </ul>
        </section>
      ))}
      {[['story', view.story], ['side', view.side]].map(([key, list]) => (list as TrackMilestone[]).length > 0 && (
        <section key={key as string} className="space-y-2.5" aria-label={t(`track.${key}`)}>
          <h3 className="text-[15px] font-semibold text-white">{t(`track.${key}`)}</h3>
          <ul className="list-group">{(list as TrackMilestone[]).map(m => <MilestoneRow key={m.id} m={m} detail isProcessing={isProcessing} onClaimQuest={onClaimQuest} />)}</ul>
        </section>
      ))}
    </div>
  );
};
