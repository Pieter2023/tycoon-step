import React, { useMemo } from 'react';
import { CheckCircle, Lock, Trophy } from 'lucide-react';
import { QuestDefinition, GameState } from '../types';
import { getInitialQuestState, QUEST_DEFINITIONS, getQuestById } from '../constants';
import { getQuestProgress } from '../services/gameLogic';
import Modal from './Modal';
import { useI18n } from '../i18n';

type QuestLogProps = {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onClaim: (questId: string) => void;
  onClaimAll: () => void;
  isProcessing?: boolean;
};

type QuestStatus = 'ready' | 'active' | 'locked' | 'completed';

const TRACK_LABELS: Record<string, string> = {
  CAREER: 'Career',
  INVESTOR: 'Investor',
  ENTREPRENEUR: 'Entrepreneur',
  DEBT_CRUSHER: 'Debt Crusher'
};

const TRACK_ORDER = ['CAREER', 'INVESTOR', 'ENTREPRENEUR', 'DEBT_CRUSHER'];

const getTrackKey = (quest: QuestDefinition) => {
  if (quest.track) return quest.track;
  if (quest.category === 'INVESTING' || quest.category === 'RISK') return 'INVESTOR';
  if (quest.category === 'CREDIT') return 'DEBT_CRUSHER';
  return 'CAREER';
};

const QuestLog: React.FC<QuestLogProps> = ({
  isOpen,
  onClose,
  gameState,
  onClaim,
  onClaimAll,
  isProcessing
}) => {
  const { t, formatNumber, formatCurrency } = useI18n();
  const characterId = gameState.character?.id;
  const questState = gameState.quests || getInitialQuestState(characterId);
  const readyIds = questState.readyToClaim || [];
  const activeIds = questState.active || [];
  const completedIds = questState.completed || [];

  const grouped = useMemo(() => {
    const readySet = new Set(readyIds);
    const activeSet = new Set(activeIds);
    const completedSet = new Set(completedIds);
    const bucket: Record<string, Array<{ quest: QuestDefinition; status: QuestStatus }>> = {};

    QUEST_DEFINITIONS.forEach((quest) => {
      if (quest.characterId && quest.characterId !== characterId) return;
      const trackKey = getTrackKey(quest);
      if (!bucket[trackKey]) bucket[trackKey] = [];

      let status: QuestStatus = 'locked';
      if (readySet.has(quest.id)) status = 'ready';
      else if (activeSet.has(quest.id)) status = 'active';
      else if (completedSet.has(quest.id)) status = 'completed';

      bucket[trackKey].push({ quest, status });
    });

    return bucket;
  }, [readyIds, activeIds, completedIds]);

  const getUnlockLabels = (quest: QuestDefinition) => {
    if (!quest.unlockAfter || quest.unlockAfter.length === 0) return '';
    return quest.unlockAfter
      .map(id => {
        const titleKey = getQuestById(id)?.title;
        return titleKey ? t(titleKey) : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const formatReward = (reward: QuestDefinition['reward']) => {
    if (!reward) return '';
    const parts: string[] = [];
    if (typeof reward.cash === 'number' && reward.cash !== 0) {
      const cash = formatCurrency(Math.abs(reward.cash), { maximumFractionDigits: 0 });
      parts.push(t('quests.reward.cash', { value: `${reward.cash >= 0 ? '+' : '-'}${cash}` }));
    }
    if (typeof reward.creditRating === 'number' && reward.creditRating !== 0) {
      const credit = formatNumber(Math.round(Math.abs(reward.creditRating)));
      parts.push(t('quests.reward.credit', { value: `${reward.creditRating >= 0 ? '+' : '-'}${credit}` }));
    }
    if (reward.stats) {
      Object.entries(reward.stats).forEach(([k, v]) => {
        if (typeof v !== 'number' || v === 0) return;
        const prettyKey = `stats.${k}`;
        parts.push(
          t('quests.reward.stat', {
            value: `${v >= 0 ? '+' : ''}${formatNumber(Math.round(v))}`,
            stat: t(prettyKey)
          })
        );
      });
    }
    return parts.join(' • ');
  };

  const formatQuestValue = (info: ReturnType<typeof getQuestProgress>) => {
    if (!info) return '';
    if (info.unit === 'money') {
      return t('quests.progressMoney', {
        current: formatCurrency(Math.round(info.current), { maximumFractionDigits: 0 }),
        target: formatCurrency(Math.round(info.target), { maximumFractionDigits: 0 })
      });
    }
    if (info.unit === 'months') {
      return t('quests.progressMonths', {
        current: info.current.toFixed(1),
        target: info.target.toFixed(1)
      });
    }
    if (info.unit === 'score') {
      return t('quests.progressScore', {
        current: formatNumber(Math.round(info.current)),
        target: formatNumber(Math.round(info.target))
      });
    }
    return t('quests.progressScore', {
      current: formatNumber(Math.round(info.current)),
      target: formatNumber(Math.round(info.target))
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('quests.logTitle')}
      overlayClassName="bg-black/70"
      contentClassName="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={20} />
          <div>
            <h2 className="text-white font-bold text-lg">{t('quests.logTitle')}</h2>
            <p className="text-slate-400 text-xs">{t('quests.logSubtitle')}</p>
          </div>
        </div>
        <button
          onClick={onClaimAll}
          disabled={readyIds.length === 0 || !!isProcessing}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
            readyIds.length === 0 || isProcessing
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30'
          }`}
        >
          {t('quests.claimAll')}
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
        {TRACK_ORDER.map(trackKey => {
          const list = grouped[trackKey] || [];
          if (list.length === 0) return null;

          const ready = list.filter(item => item.status === 'ready');
          const active = list.filter(item => item.status === 'active');
          const locked = list.filter(item => item.status === 'locked');
          const completed = list.filter(item => item.status === 'completed');
          const previewLocked = locked.filter(q => (q.quest.unlockAfter || []).length > 0).slice(0, 2);

          return (
            <section key={trackKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{t(`quests.track.${trackKey}`)}</h3>
                <span className="text-xs text-slate-500">
                  {t('quests.trackSummary', {
                    ready: formatNumber(ready.length),
                    active: formatNumber(active.length),
                    claimed: formatNumber(completed.length)
                  })}
                </span>
              </div>

              {ready.length > 0 && (
                <div className="space-y-2">
                  {ready.map(({ quest }) => (
                    <div key={quest.id} className="rounded-xl border border-emerald-700/40 bg-emerald-900/15 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-400" />
                            {t(quest.title)}
                          </p>
                          <p className="text-slate-300 text-sm mt-1">{t(quest.description)}</p>
                          <p className="text-emerald-200 text-xs mt-2">
                            {t('quests.rewardLabel')} {formatReward(quest.reward)}
                          </p>
                        </div>
                        <button
                          onClick={() => onClaim(quest.id)}
                          disabled={!!isProcessing}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${
                            isProcessing
                              ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30 hover:border-emerald-400/60'
                          }`}
                        >
                          {t('quests.claim')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {active.length > 0 && (
                <div className="space-y-2">
                  {active.map(({ quest }) => {
                    const info = getQuestProgress(gameState, quest.id);
                    const pct = info ? Math.min(100, Math.max(0, Math.round(info.progress * 100))) : 0;
                    return (
                      <div key={quest.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{t(quest.title)}</p>
                            <p className="text-slate-400 text-sm mt-1">{t(quest.description)}</p>
                            {quest.hint && <p className="text-slate-300 text-xs mt-2">💡 {t(quest.hint)}</p>}
                            <p className="text-amber-300 text-xs mt-2">
                              {t('quests.rewardLabel')} {formatReward(quest.reward)}
                            </p>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <p className="text-slate-400 text-xs">{t('quests.progress')}</p>
                            <p className="text-white font-bold">{pct}%</p>
                            <p className="text-slate-400 text-xs mt-1">{formatQuestValue(info)}</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
                          <div className="h-full bg-gradient-to-r from-amber-600 to-emerald-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {previewLocked.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">{t('quests.upNext')}</p>
                  {previewLocked.map(({ quest }) => {
                    const info = getQuestProgress(gameState, quest.id);
                    const pct = info ? Math.min(100, Math.max(0, Math.round(info.progress * 100))) : 0;
                    const unlockLabel = getUnlockLabels(quest);
                    return (
                      <div key={quest.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-200 flex items-center gap-2">
                              <Lock size={14} className="text-slate-500" />
                              {t(quest.title)}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">{t(quest.description)}</p>
                            {unlockLabel && (
                              <p className="text-slate-500 text-xs mt-2">
                                {t('quests.unlocksAfter', { title: unlockLabel })}
                              </p>
                            )}
                            <p className="text-slate-500 text-xs mt-2">
                              {t('quests.rewardLabel')} {formatReward(quest.reward)}
                            </p>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <p className="text-slate-500 text-xs">{t('quests.preview')}</p>
                            <p className="text-slate-300 font-semibold">{pct}%</p>
                            <p className="text-slate-500 text-xs mt-1">{formatQuestValue(info)}</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden mt-3">
                          <div className="h-full bg-slate-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Modal>
  );
};

export default QuestLog;
