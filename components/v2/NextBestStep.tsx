import React from 'react';
import { CheckCircle, Target } from 'lucide-react';
import { GameState, QuestDefinition } from '../../types';
import { useI18n, formatCurrencyValue, formatNumberValue } from '../../i18n';
import { getInitialQuestState, getQuestById } from '../../constants';
import { getQuestProgress } from '../../services/gameLogic';

type NextBestStepProps = {
  gameState: GameState;
  isProcessing: boolean;
  onClaimQuest: (questId: string) => void;
  onOpenGoals: () => void;
};

const formatReward = (
  reward: QuestDefinition['reward'],
  t: (key: string, vars?: Record<string, any>) => string
) => {
  if (!reward) return '';
  const parts: string[] = [];
  if (typeof reward.cash === 'number' && reward.cash !== 0) {
    const cash = formatCurrencyValue(Math.abs(reward.cash), { maximumFractionDigits: 0 });
    parts.push(t('quests.reward.cash', { value: `${reward.cash >= 0 ? '+' : '-'}${cash}` }));
  }
  if (typeof reward.creditRating === 'number' && reward.creditRating !== 0) {
    parts.push(
      t('quests.reward.credit', {
        value: `${reward.creditRating >= 0 ? '+' : '-'}${formatNumberValue(Math.round(Math.abs(reward.creditRating)))}`
      })
    );
  }
  if (reward.stats) {
    Object.entries(reward.stats).forEach(([k, v]) => {
      if (typeof v !== 'number' || v === 0) return;
      parts.push(
        t('quests.reward.stat', {
          value: `${v >= 0 ? '+' : ''}${formatNumberValue(Math.round(v))}`,
          stat: t(`stats.${k}`)
        })
      );
    });
  }
  return parts.join(' • ');
};

const formatQuestValue = (
  info: ReturnType<typeof getQuestProgress> | null,
  t: (key: string, vars?: Record<string, any>) => string
) => {
  if (!info) return '';
  if (info.unit === 'money') {
    return t('quests.progressMoney', {
      current: formatCurrencyValue(info.current, { maximumFractionDigits: 0 }),
      target: formatCurrencyValue(info.target, { maximumFractionDigits: 0 })
    });
  }
  if (info.unit === 'months') {
    return t('quests.progressMonths', {
      current: info.current.toFixed(1),
      target: info.target.toFixed(1)
    });
  }
  return t('quests.progressScore', {
    current: formatNumberValue(Math.round(info.current)),
    target: formatNumberValue(Math.round(info.target))
  });
};

const NextBestStep: React.FC<NextBestStepProps> = ({
  gameState,
  isProcessing,
  onClaimQuest,
  onOpenGoals
}) => {
  const { t } = useI18n();
  const questState = gameState.quests || getInitialQuestState(gameState.character?.id);
  const readyIds = questState.readyToClaim || [];
  const activeIds = questState.active || [];
  const claimable = readyIds.slice(0, 1);
  const recommendedCount = claimable.length > 0 ? 1 : 2;
  const recommended = activeIds.filter((id) => !claimable.includes(id)).slice(0, recommendedCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('quests.sectionTitle')}</h3>
          <p className="text-xs text-slate-400">{t('quests.sectionSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={onOpenGoals}
          className="text-xs font-semibold text-emerald-200 hover:text-emerald-100"
        >
          View all goals
        </button>
      </div>

      {claimable.length > 0 && (
        <div className="rounded-2xl border border-emerald-600/30 bg-emerald-900/20 p-4">
          {claimable.map((id) => {
            const q = getQuestById(id);
            if (!q) return null;
            return (
              <div key={id} className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    {t(q.title)}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">{t(q.description)}</p>
                  <p className="text-xs text-emerald-200 mt-2">{t('quests.rewardLabel')} {formatReward(q.reward, t)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onClaimQuest(id)}
                  disabled={isProcessing}
                  className={`self-start rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    isProcessing
                      ? 'cursor-not-allowed border-slate-700/60 bg-slate-900/30 text-slate-500'
                      : 'border-emerald-500/40 bg-emerald-600/20 text-emerald-100 hover:border-emerald-400/70 hover:bg-emerald-600/30'
                  }`}
                >
                  {t('quests.claim')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {recommended.length === 0 ? (
          <p className="text-sm text-slate-400">No active goals yet. Advance time to unlock new quests.</p>
        ) : (
          recommended.map((qid) => {
            const info = getQuestProgress(gameState, qid);
            if (!info) return null;
            const pct = Math.round(info.progress * 100);
            return (
              <div key={qid} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <Target size={16} className="text-amber-300" />
                      {t(info.quest.title)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{t(info.quest.description)}</p>
                    <p className="text-xs text-amber-200 mt-2">{t('quests.rewardLabel')} {formatReward(info.quest.reward, t)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{t('quests.progress')}</p>
                    <p className="text-sm font-semibold text-white">{pct}%</p>
                    <p className="text-xs text-slate-500">{formatQuestValue(info, t)}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NextBestStep;
