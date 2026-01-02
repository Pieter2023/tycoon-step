import React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Bot, BookOpen, CheckCircle, Clock, CreditCard, DollarSign, Heart, HeartPulse, LineChart, Sparkles, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import { ALL_LIFE_EVENTS, CAREER_PATHS, getInitialQuestState, getQuestById } from '../../constants';
import { getQuestProgress } from '../../services/gameLogic';
import { GameState, MonthlyActionId, PlayerStats } from '../../types';

type OverviewTabProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number, digits?: number) => string;
  formatMoney: (value: number) => string;
  formatMoneyFull: (value: number) => string;
  gameState: GameState;
  isProcessing: boolean;
  coachMonthlyActionsRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  handleUseMonthlyAction: (action: MonthlyActionId) => void;
  InfoTip: React.FC<{ id: string; text: string }>;
  creditTier: string;
  creditScore: number;
  getCreditTierColor: (tier: string) => string;
  handleClaimQuest: (questId: string) => void;
  showEventLab: boolean;
  setShowEventLab: React.Dispatch<React.SetStateAction<boolean>>;
  eventLabEvent: any;
  eventLabOptionIdx: number;
  setEventLabEventId: (id: string) => void;
  setEventLabOptionIdx: (idx: number) => void;
  eventLabSimulation: {
    cashDelta: number;
    assetsDelta: number;
    liabilitiesDelta: number;
    message?: string;
    statsDelta: Partial<PlayerStats>;
  } | null;
  setEventLabSimulation: React.Dispatch<React.SetStateAction<{
    cashDelta: number;
    assetsDelta: number;
    liabilitiesDelta: number;
    message?: string;
    statsDelta: Partial<PlayerStats>;
  } | null>>;
  runEventLabSimulation: () => void;
  injectEventLab: () => void;
  aiImpact: any;
  careerPath: any;
  getAIRiskColor: (risk: string) => string;
  netWorth: number;
  monthlyReport: any;
  cashFlow: any;
};

const OverviewTab: React.FC<OverviewTabProps> = (props) => {
  const {
    t,
    formatNumber,
    formatPercent,
    formatMoney,
    formatMoneyFull,
    gameState,
    isProcessing,
    coachMonthlyActionsRef,
    coachHighlight,
    handleUseMonthlyAction,
    InfoTip,
    creditTier,
    creditScore,
    getCreditTierColor,
    handleClaimQuest,
    showEventLab,
    setShowEventLab,
    eventLabEvent,
    eventLabOptionIdx,
    setEventLabEventId,
    setEventLabOptionIdx,
    eventLabSimulation,
    setEventLabSimulation,
    runEventLabSimulation,
    injectEventLab,
    aiImpact,
    careerPath,
    getAIRiskColor,
    netWorth,
    monthlyReport,
    cashFlow
  } = props;

  return (<>

          {/* Monthly Actions */}
          <div
            ref={coachMonthlyActionsRef}
            className={`bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-4 ${coachHighlight('monthly-actions')}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={20} />Monthly Actions
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Spend actions to trade time & energy for income boosts, skill growth, or recovery.
                </p>
              </div>

              {(() => {
                const max = gameState.monthlyActionsMax ?? 2;
                const remaining = (typeof gameState.monthlyActionsRemaining === 'number') ? gameState.monthlyActionsRemaining : max;
                const energy = gameState.stats?.energy ?? 0;
                const stress = gameState.stats?.stress ?? 0;
                const health = gameState.stats?.health ?? 0;
                const hasBonus = energy >= 70 && stress <= 60;
                const hasCareerBonus = (gameState.career?.level ?? gameState.playerJob?.level ?? 0) >= 3;
                const hasPenalty = energy < 35 || stress >= 85 || health < 30;
                const reason = hasBonus
                  ? 'Bonus: +1 action (high energy, manageable stress)'
                  : hasPenalty
                    ? 'Penalty: -1 action (low energy / high stress / low health)'
                    : hasCareerBonus
                      ? 'Bonus: +1 action (career momentum)'
                      : 'Tip: keep energy high and stress low for more actions';
                const tooltip =
                  `Monthly Actions start at 2. +1 if Energy ≥ 70 AND Stress ≤ 60. +1 if Career level ≥ 3. -1 if Energy < 35 OR Stress ≥ 85 OR Health < 30. Range: 1–4. This month: Energy ${Math.round(energy)}, Stress ${Math.round(stress)}, Health ${Math.round(health)} → Max ${max}.`;

                return (
                  <div className="text-right">
                    <p className="text-slate-400 text-xs flex items-center justify-end">
                      Actions Remaining
                      <InfoTip id="actions-remaining-tip" text={tooltip} />
                    </p>
                    <p className="text-white font-bold text-xl">{remaining} / {max}</p>
                    <p className="text-slate-400 text-xs mt-1 max-w-[220px] sm:max-w-none">{reason}</p>
                  </div>
                );
              })()}
            </div>

            {/* Pending one-turn buffs */}
            <div className="flex flex-wrap gap-2 mt-3">
              {(gameState.tempSalaryBonus || 0) > 0 && (
                <span className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs border border-emerald-500/30">
                  Overtime bonus pending: +{formatMoneyFull(gameState.tempSalaryBonus || 0)} salary
                </span>
              )}
              {(gameState.tempSideHustleMultiplier || 1) > 1.01 && (
                <span className="px-2 py-1 rounded-lg bg-amber-600/20 text-amber-300 text-xs border border-amber-500/30">
                  Hustle sprint active: +{Math.round(((gameState.tempSideHustleMultiplier || 1) - 1) * 100)}% side hustle income
                </span>
              )}
              <span className="px-2 py-1 rounded-lg bg-slate-700/40 text-slate-300 text-xs border border-slate-600/40">
                Financial IQ boosts passive income up to ~5%
              </span>
            </div>

            {(() => {
              const max = gameState.monthlyActionsMax ?? 2;
              const remaining = (typeof gameState.monthlyActionsRemaining === 'number') ? gameState.monthlyActionsRemaining : max;
              const locked = isProcessing || !!gameState.pendingScenario || !!gameState.hasWon || !!gameState.isBankrupt;
              const energy = gameState.stats?.energy ?? 0;
              const tooDrained = energy < 20;
              const hasHustle = (gameState.activeSideHustles || []).length > 0;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                  <motion.button
                    whileHover={{ scale: locked || remaining <= 0 || tooDrained ? 1 : 1.02 }}
                    whileTap={{ scale: locked || remaining <= 0 || tooDrained ? 1 : 0.99 }}
                    onClick={() => handleUseMonthlyAction('OVERTIME')}
                    disabled={locked || remaining <= 0 || tooDrained}
                    className={`rounded-xl p-4 border text-left transition-all ${
                      locked || remaining <= 0 || tooDrained
                        ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900/40 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-emerald-400" />
                      <div>
                        <p className="font-semibold">Work Overtime</p>
                        <p className="text-xs text-slate-400">+10% salary bonus (next month)</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2">-15 energy • +12 stress</p>
                    {tooDrained && <p className="text-xs mt-1 text-red-400">Too drained (need 20+ energy)</p>}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: locked || remaining <= 0 || gameState.cash < 100 ? 1 : 1.02 }}
                    whileTap={{ scale: locked || remaining <= 0 || gameState.cash < 100 ? 1 : 0.99 }}
                    onClick={() => handleUseMonthlyAction('NETWORK')}
                    disabled={locked || remaining <= 0 || gameState.cash < 100}
                    className={`rounded-xl p-4 border text-left transition-all ${
                      locked || remaining <= 0 || gameState.cash < 100
                        ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900/40 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-blue-400" />
                      <div>
                        <p className="font-semibold">Networking</p>
                        <p className="text-xs text-slate-400">+$0–$500 chance • +networking</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2">Cost: $100 • +12 networking</p>
                    {gameState.cash < 100 && <p className="text-xs mt-1 text-red-400">Need $100 cash</p>}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: locked || remaining <= 0 || tooDrained || gameState.cash < 300 ? 1 : 1.02 }}
                    whileTap={{ scale: locked || remaining <= 0 || tooDrained || gameState.cash < 300 ? 1 : 0.99 }}
                    onClick={() => handleUseMonthlyAction('TRAINING')}
                    disabled={locked || remaining <= 0 || tooDrained || gameState.cash < 300}
                    className={`rounded-xl p-4 border text-left transition-all ${
                      locked || remaining <= 0 || tooDrained || gameState.cash < 300
                        ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900/40 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-amber-400" />
                      <div>
                        <p className="font-semibold">Skill Training</p>
                        <p className="text-xs text-slate-400">+12 Financial IQ (stronger investing)</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2">Cost: $300 • -8 energy • +4 stress</p>
                    {gameState.cash < 300 && <p className="text-xs mt-1 text-red-400">Need $300 cash</p>}
                    {tooDrained && <p className="text-xs mt-1 text-red-400">Too drained</p>}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: locked || remaining <= 0 || tooDrained || !hasHustle ? 1 : 1.02 }}
                    whileTap={{ scale: locked || remaining <= 0 || tooDrained || !hasHustle ? 1 : 0.99 }}
                    onClick={() => handleUseMonthlyAction('HUSTLE_SPRINT')}
                    disabled={locked || remaining <= 0 || tooDrained || !hasHustle}
                    className={`rounded-xl p-4 border text-left transition-all ${
                      locked || remaining <= 0 || tooDrained || !hasHustle
                        ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900/40 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={18} className="text-purple-400" />
                      <div>
                        <p className="font-semibold">Hustle Sprint</p>
                        <p className="text-xs text-slate-400">+25% side hustle income (next month)</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2">Requires active hustle • -12 energy • +10 stress</p>
                    {!hasHustle && <p className="text-xs mt-1 text-red-400">Start a hustle first</p>}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: locked || remaining <= 0 ? 1 : 1.02 }}
                    whileTap={{ scale: locked || remaining <= 0 ? 1 : 0.99 }}
                    onClick={() => handleUseMonthlyAction('RECOVER')}
                    disabled={locked || remaining <= 0}
                    className={`rounded-xl p-4 border text-left transition-all ${
                      locked || remaining <= 0
                        ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900/40 border-slate-700 hover:border-pink-500/50 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <HeartPulse size={18} className="text-pink-400" />
                      <div>
                        <p className="font-semibold">Recover</p>
                        <p className="text-xs text-slate-400">Restore energy & reduce stress</p>
                      </div>
                    </div>
                    <p className="text-xs mt-2">+18 energy • -15 stress • +4 health</p>
                  </motion.button>
                </div>
              );
            })()}
          </div>

          {/* Credit Overview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-4">
            {(() => {
              const history = gameState.creditHistory || [];
              const recent = history.slice(-12);
              const latest = recent[recent.length - 1];
              const previous = recent[recent.length - 2];
              const delta = latest && previous ? latest.score - previous.score : 0;
              const reasons = gameState.creditLastChangeReasons || latest?.reasons || [];

              return (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-emerald-300" size={20} />Credit Score
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Drivers: on-time payments, utilization, debt-to-income, delinquencies.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Current score</p>
                      <p className={`text-2xl font-bold ${getCreditTierColor(creditTier)}`}>
                        {creditScore} <span className="text-sm font-semibold">{creditTier}</span>
                      </p>
                      <p className={`text-xs ${delta >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                        {delta >= 0 ? '+' : ''}{delta} this month
                      </p>
                    </div>
                  </div>

                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={recent.map(entry => ({ month: entry.month, score: entry.score }))}>
                        <defs>
                          <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" hide />
                        <YAxis domain={[300, 850]} hide />
                        <Tooltip formatter={(value: number) => [value, 'Score']} />
                        <Area type="monotone" dataKey="score" stroke="#34d399" fill="url(#creditGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4">
                    <p className="text-slate-300 text-sm font-semibold mb-2">{t('credit.whyChanged')}</p>
                    {reasons.length === 0 ? (
                      <p className="text-slate-500 text-sm">{t('credit.noChange')}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {reasons.map((reason, idx) => (
                          <span key={`${reason}-${idx}`} className="px-2 py-1 rounded-lg bg-slate-900/40 text-slate-300 text-xs border border-slate-700/60">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Goals & Quests */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-4">
            {(() => {
              const questState = gameState.quests || getInitialQuestState(gameState.character?.id);
              const activeIds = (questState.active || []).slice(0, 3);
              const readyIds = questState.readyToClaim || [];
              const readyCount = readyIds.length;
              const completedIds = questState.completed || [];
              const completedCount = completedIds.length;

              const trackLabel = questState.track
                ? t(`quests.track.${questState.track}`)
                : null;

              const formatQuestValue = (info: any) => {
                if (!info) return '';
                if (info.unit === 'money') {
                  return t('quests.progressMoney', {
                    current: formatMoneyFull(info.current),
                    target: formatMoneyFull(info.target)
                  });
                }
                if (info.unit === 'months') {
                  return t('quests.progressMonths', {
                    current: info.current.toFixed(1),
                    target: info.target.toFixed(1)
                  });
                }
                return t('quests.progressScore', {
                  current: formatNumber(Math.round(info.current)),
                  target: formatNumber(Math.round(info.target))
                });
              };

              const formatReward = (reward: any) => {
                if (!reward) return '';
                const parts: string[] = [];
                if (typeof reward.cash === 'number' && reward.cash !== 0) {
                  const cash = formatMoneyFull(Math.abs(reward.cash));
                  parts.push(t('quests.reward.cash', { value: `${reward.cash >= 0 ? '+' : '-'}${cash}` }));
                }
                if (typeof reward.creditRating === 'number' && reward.creditRating !== 0) {
                  parts.push(
                    t('quests.reward.credit', {
                      value: `${reward.creditRating >= 0 ? '+' : '-'}${formatNumber(Math.round(Math.abs(reward.creditRating)))}`
                    })
                  );
                }
                if (reward.stats) {
                  Object.entries(reward.stats).forEach(([k, v]) => {
                    if (typeof v !== 'number' || v === 0) return;
                    parts.push(
                      t('quests.reward.stat', {
                        value: `${v >= 0 ? '+' : ''}${formatNumber(Math.round(v))}`,
                        stat: t(`stats.${k}`)
                      })
                    );
                  });
                }
                return parts.join(' • ');
              };

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Trophy className="text-amber-400" size={20} />{t('quests.sectionTitle')}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {t('quests.sectionSubtitle')}
                      </p>
                    </div>
                    <div className="flex items-start gap-4">
                      {trackLabel && (
                        <div className="text-right">
                          <p className="text-slate-400 text-xs">{t('quests.trackLabel')}</p>
                          <p className="text-white font-bold">{trackLabel}</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">{t('quests.readyLabel')}</p>
                        <p className="text-white font-bold text-xl">{readyCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">{t('quests.claimedLabel')}</p>
                        <p className="text-white font-bold text-xl">{completedCount}</p>
                      </div>
                    </div>
                  </div>

                  {readyIds.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-300 text-sm font-semibold">{t('quests.readyToClaim')}</p>
                        <p className="text-slate-400 text-xs">{t('quests.tapClaimHint')}</p>
                      </div>
                      <div className="space-y-2 mt-2">
                        {readyIds.map((id: string) => {
                          const q = getQuestById(id);
                          if (!q) return null;

                          return (
                            <div key={id} className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white flex items-center gap-2">
                                  <CheckCircle size={16} className="text-emerald-400" />
                                  {t(q.title)}
                                </p>
                                <p className="text-slate-300 text-sm mt-1">{t(q.description)}</p>
                                <p className="text-emerald-200 text-xs mt-2">{t('quests.rewardLabel')} {formatReward(q.reward)}</p>
                              </div>
                              <button
                                onClick={() => handleClaimQuest(id)}
                                disabled={isProcessing}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${
                                  isProcessing
                                    ? 'bg-slate-900/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30 hover:border-emerald-400/60'
                                  }`}
                              >
                                {t('quests.claim')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  <div className="space-y-3 mt-4">
                    {activeIds.length === 0 && (
                      <div className="text-slate-400 text-sm">{t('quests.noActive')}</div>
                    )}

                    {activeIds.map(qid => {
                      const info = getQuestProgress(gameState, qid);
                      if (!info) return null;
                      const pct = Math.round(info.progress * 100);

                      const difficultyColor = info.quest.difficulty === 'EASY'
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                        : info.quest.difficulty === 'MEDIUM'
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                          : 'bg-red-600/20 text-red-300 border-red-500/30';

                      return (
                        <div key={qid} className="bg-slate-900/40 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white">{t(info.quest.title)}</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[11px] border ${difficultyColor}`}>
                                  {t(`quests.difficulty.${info.quest.difficulty}`)}
                                </span>
                              </div>
                              <p className="text-slate-400 text-sm mt-1">{t(info.quest.description)}</p>
                              {info.quest.hint && (
                                <p className="text-slate-300 text-xs mt-2">💡 {t(info.quest.hint)}</p>
                              )}
                              <p className="text-amber-300 text-xs mt-2">{t('quests.rewardLabel')} {formatReward(info.quest.reward)}</p>
                            </div>
                            <div className="text-right min-w-[110px]">
                              <p className="text-slate-400 text-xs">{t('quests.progress')}</p>
                              <p className="text-white font-bold">{pct}%</p>
                              <p className="text-slate-400 text-xs mt-1">{formatQuestValue(info)}</p>
                            </div>
                          </div>

                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
                            <motion.div
                              className="h-full bg-gradient-to-r from-amber-600 to-emerald-400"
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {completedIds.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-slate-300 text-sm hover:text-white transition-all">
                        {t('quests.viewCompleted', { count: completedIds.length })}
                      </summary>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {completedIds.slice(-6).reverse().map(id => {
                          const q = getQuestById(id);
                          if (!q) return null;
                          return (
                            <div key={id} className="px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-700 text-sm">
                              <span className="text-emerald-400">✔</span>{' '}
                              <span className="text-white font-medium">{t(q.title)}</span>
                              <p className="text-slate-400 text-xs mt-1">{t(q.description)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/30 rounded-2xl p-5">
              <h3 className="text-sm text-emerald-400 mb-1">Net Worth</h3>
              <p className="text-3xl font-bold text-white mb-2">{formatMoney(netWorth)}</p>
              {monthlyReport && (
                <span className={`flex items-center gap-1 ${monthlyReport.netWorthChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monthlyReport.netWorthChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {formatMoney(Math.abs(monthlyReport.netWorthChange))}/mo
                </span>
              )}
            </div>

            {/* Cash Flow Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <DollarSign className="text-emerald-400" size={20} />Monthly Cash Flow
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Salary</span>
                  <span className="text-emerald-400">+{formatMoney(cashFlow.salary)}</span>
                </div>
                {(gameState.jobLossMonthsRemaining ?? 0) > 0 && (
                  <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg p-2">
                    Job loss shock: salary is paused for <span className="font-semibold">{gameState.jobLossMonthsRemaining}</span> more month{gameState.jobLossMonthsRemaining === 1 ? '' : 's'}. Emergency fund matters.
                  </div>
                )}
                {cashFlow.spouseIncome > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Spouse Income</span>
                    <span className="text-emerald-400">+{formatMoney(cashFlow.spouseIncome)}</span>
                  </div>
                )}
                {cashFlow.sideHustleIncome > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Side Hustles</span>
                    <span className="text-emerald-400">+{formatMoney(cashFlow.sideHustleIncome)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Investments</span>
                  <span className="text-emerald-400">+{formatMoney(cashFlow.passive)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lifestyle</span>
                  <span className="text-red-400">-{formatMoney(cashFlow.lifestyleCost)}</span>
                </div>
                {cashFlow.childrenExpenses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Children</span>
                    <span className="text-red-400">-{formatMoney(cashFlow.childrenExpenses)}</span>
                  </div>
                )}
                {cashFlow.vehicleCosts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle</span>
                    <span className="text-red-400">-{formatMoney(cashFlow.vehicleCosts)}</span>
                  </div>
                )}
                {cashFlow.debtPayments > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Debt Payments</span>
                    <span className="text-red-400">-{formatMoney(cashFlow.debtPayments)}</span>
                  </div>
                )}
                {cashFlow.educationPayment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Education</span>
                    <span className="text-red-400">-{formatMoney(cashFlow.educationPayment)}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                  <span>Net Cash Flow</span>
                  <span className={cashFlow.income - cashFlow.expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {cashFlow.income - cashFlow.expenses >= 0 ? '+' : ''}{formatMoney(cashFlow.income - cashFlow.expenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Disruption Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Bot className="text-purple-400" size={20} />AI Disruption
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Disruption Level</span>
                    <span className="text-white">{(gameState.aiDisruption?.disruptionLevel || 0).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${gameState.aiDisruption?.disruptionLevel || 0}%` }} />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Your Career Risk</span>
                  <span className={getAIRiskColor(aiImpact?.automationRisk || 'LOW')}>{aiImpact?.automationRisk || 'LOW'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Future-Proof Score</span>
                  <span className="text-white">{CAREER_PATHS[careerPath]?.futureProofScore || 50}%</span>
                </div>
              </div>
            </div>

            {/* Family Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Heart className="text-pink-400" size={20} />Family
              </h3>
              {!gameState.family?.spouse && !gameState.family?.isEngaged && !gameState.family?.inRelationship ? (
                <p className="text-slate-400 text-sm">Single - romance may come your way! 💕</p>
              ) : (
                <div className="space-y-3">
                  {gameState.family?.inRelationship && !gameState.family?.isEngaged && !gameState.family?.spouse && (
                    <div className="bg-pink-500/20 rounded-lg p-2 text-center">
                      <span className="text-pink-400 font-medium">💕 In a Relationship</span>
                    </div>
                  )}
                  {gameState.family?.isEngaged && !gameState.family?.spouse && (
                    <div className="bg-pink-500/20 rounded-lg p-2 text-center">
                      <span className="text-pink-400 font-medium">💍 Engaged!</span>
                    </div>
                  )}
                  {gameState.family?.spouse && (
                    <div>
                      <p className="text-white font-medium">👫 Married to {gameState.family.spouse.name}</p>
                      <p className="text-slate-400 text-xs">
                        {CAREER_PATHS[gameState.family.spouse.careerPath]?.icon} {CAREER_PATHS[gameState.family.spouse.careerPath]?.name} • {formatMoney(gameState.family.spouse.income)}/mo
                      </p>
                    </div>
                  )}
                  {gameState.family?.children && gameState.family.children.length > 0 && (
                    <div className="border-t border-slate-700 pt-2">
                      <p className="text-slate-400 text-xs mb-2">Children ({gameState.family.children.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {gameState.family.children.map(child => {
                          const ageMonths = gameState.month - child.birthMonth;
                          const isPreBorn = ageMonths < 0;
                          return (
                            <span key={child.id} className="px-2 py-1 bg-slate-700 rounded-full text-xs text-white">
                              {isPreBorn ? '🤰 Due soon' : `👶 ${child.name}, ${child.age}y`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Fulfillment</span>
                  <span className="text-pink-400">{gameState.stats.fulfillment || 40}%</span>
                </div>
              </div>
            </div>

            {/* Economy Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className={gameState.economy?.recession ? "text-red-400" : "text-blue-400"} size={20} />Economy
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Market</span>
                  <span className={gameState.economy?.marketTrend === 'BULL' || gameState.economy?.marketTrend === 'BOOM' ? 'text-emerald-400' : 
                    gameState.economy?.marketTrend === 'BEAR' || gameState.economy?.marketTrend === 'CRASH' ? 'text-red-400' : 'text-slate-300'}>
                    {gameState.economy?.marketTrend || 'STABLE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Interest Rate</span>
                  <span className="text-white">{formatPercent(gameState.economy?.interestRate || 0.065)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inflation</span>
                  <span className="text-amber-400">{formatPercent(gameState.economy?.inflationRate || 0.03)}</span>
                </div>
                {gameState.economy?.recession && (
                  <div className="bg-red-500/20 rounded-lg p-2 text-center mt-2">
                    <span className="text-red-400 font-medium">⚠️ RECESSION</span>
                    <p className="text-xs text-slate-400">{gameState.economy.recessionMonths} months remaining</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-bold text-white mb-3">{t('events.recentTitle')}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gameState.events.length === 0 ? (
                  <p className="text-slate-500 text-sm">{t('events.none')}</p>
                ) : (
                  gameState.events.slice(0, 10).map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-700/30">
                      <span className="text-slate-500 text-xs font-mono whitespace-nowrap">M{event.month}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{t(event.title)}</p>
                        <p className="text-slate-400 text-xs truncate">{t(event.description)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 md:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{t('events.labTitle')}</h3>
                  <button
                    onClick={() => setShowEventLab(prev => !prev)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/60"
                  >
                    {showEventLab ? t('actions.hide') : t('actions.show')}
                  </button>
                </div>
                {showEventLab && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400">{t('events.labEventLabel')}</label>
                        <select
                          className="w-full mt-1 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                          value={eventLabEvent?.id || ''}
                          onChange={(e) => {
                            setEventLabEventId(e.target.value);
                            setEventLabOptionIdx(0);
                            setEventLabSimulation(null);
                          }}
                        >
                          {ALL_LIFE_EVENTS.map(evt => (
                            <option key={evt.id} value={evt.id}>
                              {evt.id} • {t(evt.title)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">{t('events.labOptionLabel')}</label>
                        <select
                          className="w-full mt-1 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                          value={eventLabOptionIdx}
                          onChange={(e) => {
                            setEventLabOptionIdx(Number(e.target.value));
                            setEventLabSimulation(null);
                          }}
                        >
                          {(eventLabEvent?.options || []).map((opt, idx) => (
                            <option key={`${eventLabEvent?.id}-${idx}`} value={idx}>
                              {t(opt.label)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={runEventLabSimulation}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                      >
                        {t('events.labSimulate')}
                      </button>
                      <button
                        onClick={injectEventLab}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm"
                      >
                        {t('events.labInject')}
                      </button>
                    </div>

                    {eventLabSimulation && (
                      <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3 text-sm text-slate-300">
                        <p className="font-semibold text-white mb-2">{t('events.labSummary')}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>{t('events.labCash', { value: `${eventLabSimulation.cashDelta >= 0 ? '+' : ''}${formatMoney(eventLabSimulation.cashDelta)}` })}</div>
                          <div>{t('events.labAssets', { value: `${eventLabSimulation.assetsDelta >= 0 ? '+' : ''}${eventLabSimulation.assetsDelta}` })}</div>
                          <div>{t('events.labLiabilities', { value: `${eventLabSimulation.liabilitiesDelta >= 0 ? '+' : ''}${eventLabSimulation.liabilitiesDelta}` })}</div>
                          <div>{t('events.labMessage', { value: eventLabSimulation.message || t('general.emptyDash') })}</div>
                        </div>
                        {Object.keys(eventLabSimulation.statsDelta).length > 0 && (
                          <div className="mt-2 text-xs">
                            {Object.entries(eventLabSimulation.statsDelta).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {t(`stats.${key}`)}: {value >= 0 ? '+' : ''}{value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Net Worth Chart - Full Width */}
          {gameState.netWorthHistory && gameState.netWorthHistory.length > 1 && (
            <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <LineChart className="text-emerald-400" size={20} />Net Worth History
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gameState.netWorthHistory}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(m) => `Y${Math.ceil(m/12)}`}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value: number) => [formatMoneyFull(value), 'Net Worth']}
                      labelFormatter={(m) => `Month ${m} (Year ${Math.ceil(m/12)})`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#netWorthGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
  </>);
};

export default OverviewTab;
