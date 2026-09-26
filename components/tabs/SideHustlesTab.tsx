import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Coffee, GitCompare, Minus, Plus, Sparkles } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { EDUCATION_OPTIONS, SIDE_HUSTLES } from '../../constants';
import { GameState, SideHustle } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';
import SegmentedControl from '../ui/SegmentedControl';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';

type SideHustlesTabProps = {
  gameState: GameState;
  cashFlow: any;
  formatMoney: (value: number) => string;
  getHustleUpgradeLabel: (hustle: SideHustle, idx: number, upgradeId: string) => string | null;
  getNextHustleMilestone: (hustle: SideHustle) => any;
  handleStartSideHustle: (hustle: SideHustle) => void;
  handleStopSideHustle: (hustleId: string) => void;
  setShowSideHustleUpgradeModal: (open: boolean) => void;
  coachSideHustlesRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
};

type RiskFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';
type SortKey = 'name' | 'income' | 'energy' | 'stress' | 'ai' | 'payback';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;
const RISK_LABEL: Record<RiskFilter, string> = { ALL: 'All', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const riskBadge = (risk: string) => (risk === 'LOW' ? 'ds-badge--low' : risk === 'MEDIUM' ? 'ds-badge--med' : 'ds-badge--high');

/** Rows glide to their new place when the list is sorted or filtered (a transform, so it stays cheap). */
const rowMotion = MOTION_DISABLED
  ? {}
  : { layout: 'position' as const, transition: springs.smooth, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.15 } } };

const HustleGlyph: React.FC<{ icon: string; active?: boolean; size?: 'md' | 'lg' }> = ({ icon, active, size = 'md' }) => (
  <span
    aria-hidden
    className={`flex shrink-0 items-center justify-center shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ${
      size === 'lg' ? 'h-12 w-12 rounded-[14px] text-[26px]' : 'h-10 w-10 rounded-[12px] text-[22px]'
    } ${active ? 'bg-emerald-400/[0.14]' : 'bg-white/[0.07]'}`}
  >
    {icon}
  </span>
);

const SideHustlesTab: React.FC<SideHustlesTabProps> = (props) => {
  const {
    gameState,
    cashFlow,
    formatMoney,
    getHustleUpgradeLabel,
    getNextHustleMilestone,
    handleStartSideHustle,
    handleStopSideHustle,
    setShowSideHustleUpgradeModal,
    coachSideHustlesRef,
    coachHighlight
  } = props;

  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('income');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const hustleRows = useMemo(() => {
    return SIDE_HUSTLES.map((hustle) => {
      const avgIncome = (hustle.incomeRange.min + hustle.incomeRange.max) / 2;
      const payback = avgIncome > 0 ? hustle.startupCost / avgIncome : Infinity;
      const aiRisk = hustle.aiVulnerability > 0.6 ? 'HIGH' : hustle.aiVulnerability > 0.3 ? 'MEDIUM' : 'LOW';
      const isActive = !!gameState.activeSideHustles.find(h => h.id === hustle.id);
      const canAfford = gameState.cash >= hustle.startupCost;
      const careerLevel = gameState.career?.level ?? gameState.playerJob?.level ?? 0;
      const hasCareerLevel = !hustle.requiredCareerLevel || careerLevel >= hustle.requiredCareerLevel;
      const hasCareerPath = !hustle.requiredCareerPath || (gameState.career?.path && hustle.requiredCareerPath.includes(gameState.career.path));
      const hasEducation = !hustle.requiredEducation || hustle.requiredEducation.length === 0 ||
        hustle.requiredEducation.some(reqCat =>
          gameState.education.degrees.some(d => EDUCATION_OPTIONS.find(e => e.id === d)?.category === reqCat)
        );
      const isUnlocked = hasEducation && hasCareerLevel && hasCareerPath;

      return {
        hustle,
        avgIncome,
        payback,
        aiRisk,
        isActive,
        canAfford,
        isUnlocked
      };
    });
  }, [gameState.activeSideHustles, gameState.cash, gameState.career?.level, gameState.career?.path, gameState.education.degrees, gameState.playerJob?.level]);

  const filteredRows = useMemo(() => {
    return hustleRows.filter((row) => riskFilter === 'ALL' || row.aiRisk === riskFilter);
  }, [hustleRows, riskFilter]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name':
          return dir * a.hustle.name.localeCompare(b.hustle.name);
        case 'income':
          return dir * (a.avgIncome - b.avgIncome);
        case 'energy':
          return dir * (a.hustle.energyCost - b.hustle.energyCost);
        case 'stress':
          return dir * (a.hustle.stressIncrease - b.hustle.stressIncrease);
        case 'ai':
          return dir * (a.hustle.aiVulnerability - b.hustle.aiVulnerability);
        case 'payback':
          return dir * (a.payback - b.payback);
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredRows, sortDir, sortKey]);

  const selectedHustles = useMemo(() => {
    return compareSelection
      .map((id) => hustleRows.find((row) => row.hustle.id === id))
      .filter((row): row is typeof hustleRows[number] => !!row);
  }, [compareSelection, hustleRows]);

  const radarData = useMemo(() => {
    if (selectedHustles.length !== 2) return [];
    const [first, second] = selectedHustles;
    const maxIncome = Math.max(first.avgIncome, second.avgIncome, 1);
    const maxEnergy = Math.max(first.hustle.energyCost, second.hustle.energyCost, 1);
    const maxStress = Math.max(first.hustle.stressIncrease, second.hustle.stressIncrease, 1);
    const maxRisk = Math.max(first.hustle.aiVulnerability, second.hustle.aiVulnerability, 0.1);
    const maxPayback = Math.max(first.payback, second.payback, 1);

    const normalizePayback = (value: number) => Math.max(0, 100 - (value / maxPayback) * 100);

    return [
      {
        metric: 'Income',
        [first.hustle.id]: (first.avgIncome / maxIncome) * 100,
        [second.hustle.id]: (second.avgIncome / maxIncome) * 100
      },
      {
        metric: 'Energy Cost',
        [first.hustle.id]: (first.hustle.energyCost / maxEnergy) * 100,
        [second.hustle.id]: (second.hustle.energyCost / maxEnergy) * 100
      },
      {
        metric: 'Stress Cost',
        [first.hustle.id]: (first.hustle.stressIncrease / maxStress) * 100,
        [second.hustle.id]: (second.hustle.stressIncrease / maxStress) * 100
      },
      {
        metric: 'AI Risk',
        [first.hustle.id]: (first.hustle.aiVulnerability / maxRisk) * 100,
        [second.hustle.id]: (second.hustle.aiVulnerability / maxRisk) * 100
      },
      {
        metric: 'Payback',
        [first.hustle.id]: normalizePayback(first.payback),
        [second.hustle.id]: normalizePayback(second.payback)
      }
    ];
  }, [selectedHustles]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'name' ? 'asc' : 'desc');
  };

  const compareCheckbox = (hustleId: string, canSelectMore: boolean) => (
    <input
      type="checkbox"
      className="h-[18px] w-[18px] cursor-pointer rounded-full accent-[#0a84ff] disabled:cursor-not-allowed disabled:opacity-40"
      checked={compareSelection.includes(hustleId)}
      disabled={!canSelectMore}
      onChange={(e) => {
        const checked = e.target.checked;
        setCompareSelection((prev) => {
          if (checked) return [...prev, hustleId].slice(0, 2);
          return prev.filter((id) => id !== hustleId);
        });
      }}
    />
  );

  const startButtonClass = (isActive: boolean, blocked: boolean) =>
    `pressable inline-flex items-center justify-center gap-1 rounded-full text-[13px] font-semibold ${
      isActive
        ? 'cursor-not-allowed bg-emerald-400/[0.14] text-emerald-300'
        : blocked
          ? 'cursor-not-allowed bg-white/[0.06] text-slate-500'
          : 'bg-[#30d158] text-[#03170a] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_8px_20px_-10px_rgb(48_209_88/0.7)] hover:bg-[#34e064]'
    }`;

  const sortHeader = (key: SortKey, label: string, align: 'left' | 'right' | 'center') => {
    const active = sortKey === key;
    const Arrow = sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th
        className={`cursor-pointer select-none px-4 py-3 font-medium transition-colors hover:text-white ${ALIGN[align]} ${active ? 'text-slate-200' : ''}`}
        onClick={() => toggleSort(key)}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
      >
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {label}
          <Arrow size={12} strokeWidth={2.6} aria-hidden className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
        </span>
      </th>
    );
  };

  const enter = MOTION_DISABLED ? { initial: false as const, animate: 'show' } : { initial: 'hidden', animate: 'show' };

  return (
    <motion.div className="w-full" variants={stagger(0.05)} {...enter}>
      {/* Active Side Hustles */}
      <motion.section variants={riseIn} className="surface mb-6 p-5 sm:p-6">
        <h3 className="mb-4 flex items-center gap-3 pr-10 text-[20px] font-semibold leading-[25px] tracking-[-0.017em] text-white">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#ff9f0a]/[0.16] text-[#ff9f0a]">
            <Coffee size={18} strokeWidth={2.2} />
          </span>
          Your Active Side Hustles
        </h3>
        {gameState.activeSideHustles.length === 0 ? (
          <p className="rounded-2xl bg-white/[0.045] p-4 text-[15px] text-slate-400">No active side hustles. Start one below to earn extra income!</p>
        ) : (
          <div className="space-y-3">
            {gameState.activeSideHustles.map(hustle => {
              const aiPenalty = hustle.aiVulnerability * (gameState.aiDisruption?.disruptionLevel || 0) / 100;
              const adjustedMin = Math.round(hustle.incomeRange.min * (1 - aiPenalty * 0.5));
              const adjustedMax = Math.round(hustle.incomeRange.max * (1 - aiPenalty * 0.5));
              const monthsActive = hustle.monthsActive ?? 0;
              const upgrades = hustle.upgrades || [];
              const upgradeLabels = upgrades
                .map((upgradeId, idx) => getHustleUpgradeLabel(hustle, idx, upgradeId))
                .filter((label): label is string => !!label);
              const nextMilestoneInfo = getNextHustleMilestone(hustle);
              const nextMilestone = nextMilestoneInfo?.milestone;
              const monthsUntilMilestone = nextMilestone ? Math.max(0, nextMilestone.monthsRequired - monthsActive) : null;
              const upgradeReady = gameState.pendingSideHustleUpgrade?.hustleId === hustle.id;
              const milestoneProgress = nextMilestone?.monthsRequired ? Math.min(1, monthsActive / nextMilestone.monthsRequired) : 1;

              return (
                <div key={hustle.id} className="rounded-[18px] border border-emerald-400/[0.14] bg-emerald-400/[0.05] p-4">
                  <div className="flex items-start gap-3.5">
                    <HustleGlyph icon={hustle.icon} active size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[17px] font-semibold leading-[22px] tracking-[-0.013em] text-white">{hustle.name}</p>
                          <p className="num mt-0.5 text-[15px] font-semibold text-emerald-300">
                            {formatMoney(adjustedMin)}-{formatMoney(adjustedMax)}/mo
                            {aiPenalty > 0.1 && <span className="ml-1.5 text-[13px] font-medium text-amber-300">(AI: -{Math.round(aiPenalty * 50)}%)</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStopSideHustle(hustle.id)}
                          className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/[0.14] text-rose-300 hover:bg-rose-500/[0.24]"
                          title="Stop side hustle"
                          aria-label="Stop side hustle"
                        >
                          <Minus size={17} strokeWidth={2.6} />
                        </button>
                      </div>
                      <p className="num mt-2 text-[13px] text-slate-400">
                        Level {upgrades.length + 1} • {monthsActive} months active
                        {nextMilestone && (
                          <span className="text-slate-500"> • Next milestone: {nextMilestone.monthsRequired} mo ({monthsUntilMilestone} mo)</span>
                        )}
                      </p>
                      {nextMilestone && (
                        <div className="meter mt-2 max-w-sm" aria-hidden>
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff9f0a] to-[#ffd60a]"
                            initial={MOTION_DISABLED ? false : { width: '0%' }}
                            animate={{ width: `${milestoneProgress * 100}%` }}
                            transition={springs.settle}
                          />
                        </div>
                      )}
                      {upgradeLabels.length > 0 && (
                        <p className="mt-2 text-[13px] text-slate-500">Upgrades: {upgradeLabels.join(', ')}</p>
                      )}
                      {upgradeReady && (
                        <motion.button
                          onClick={() => setShowSideHustleUpgradeModal(true)}
                          initial={MOTION_DISABLED ? false : { opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={springs.bouncy}
                          className="pressable mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff9f0a] px-3.5 py-1.5 text-[13px] font-semibold text-[#1f1300] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_20px_-10px_rgb(255_159_10/0.8)] hover:bg-[#ffab2e]"
                        >
                          ✨ Upgrade Available
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.045] px-4 py-3">
              <p className="text-[15px] text-slate-400">Total active hustle income:</p>
              <AnimatedNumber value={cashFlow.sideHustleIncome} format={formatMoney} className="text-[17px] font-semibold text-emerald-300" />
            </div>
          </div>
        )}
      </motion.section>

      <motion.div
        variants={riseIn}
        ref={coachSideHustlesRef}
        className={`${coachHighlight('sidehustles-list')}`}
      >
        <div className="mat-bar sticky top-0 z-10 my-4 rounded-[20px] border border-white/[0.08] p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="px-1">
              <h3 className="text-[17px] font-semibold tracking-[-0.013em] text-white">Available Side Hustles</h3>
              <p className="text-[13px] text-slate-400">Sort and compare options.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl<RiskFilter>
                role="group"
                size="sm"
                value={riskFilter}
                onChange={setRiskFilter}
                options={(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((risk) => ({ value: risk, label: RISK_LABEL[risk] }))}
              />
              <button
                onClick={() => {
                  setCompareMode((prev) => !prev);
                  if (compareMode) setCompareSelection([]);
                }}
                aria-pressed={compareMode}
                className={`pressable inline-flex min-h-[30px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                  compareMode ? 'bg-[#0a84ff] text-white' : 'bg-[rgb(118_118_128/0.2)] text-slate-300 hover:text-white'
                }`}
              >
                <GitCompare size={14} strokeWidth={2.4} aria-hidden />
                {compareMode ? 'Comparing...' : 'Compare'}
              </button>
            </div>
          </div>
        </div>

        {/* Phones: cards */}
        <div className="relative space-y-3 sm:hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {sortedRows.map((row) => {
              const { hustle, payback, aiRisk, isActive, canAfford, isUnlocked } = row;
              const canSelectMore = compareSelection.length < 2 || compareSelection.includes(hustle.id);
              const paybackLabel = Number.isFinite(payback) ? `${payback.toFixed(1)} mo` : '—';

              return (
                <motion.div key={hustle.id} {...rowMotion} className="surface-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <HustleGlyph icon={hustle.icon} active={isActive} />
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-white">{hustle.name}</p>
                        <p className="num text-[12px] text-slate-500">{hustle.hoursPerWeek} hrs/week</p>
                      </div>
                    </div>
                    {compareMode && (
                      <label className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-slate-300">
                        {compareCheckbox(hustle.id, canSelectMore)}
                        Select
                      </label>
                    )}
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-white/[0.045] px-3 py-2">
                      <p className="text-[11px] text-slate-500">Income</p>
                      <p className="num text-[13px] font-semibold text-emerald-300">
                        {formatMoney(hustle.incomeRange.min)}-{formatMoney(hustle.incomeRange.max)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/[0.045] px-3 py-2">
                      <p className="text-[11px] text-slate-500">Payback</p>
                      <p className="num text-[13px] font-semibold text-white">{paybackLabel}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.045] px-3 py-2">
                      <p className="text-[11px] text-slate-500">Energy</p>
                      <p className="num text-[13px] font-semibold text-amber-300">-{hustle.energyCost}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.045] px-3 py-2">
                      <p className="text-[11px] text-slate-500">Stress</p>
                      <p className="num text-[13px] font-semibold text-rose-300">+{hustle.stressIncrease}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`ds-badge ${riskBadge(aiRisk)}`}>{RISK_LABEL[aiRisk as RiskFilter]} risk</span>
                    <button
                      onClick={() => handleStartSideHustle(hustle)}
                      disabled={isActive || !canAfford || !isUnlocked}
                      className={`${startButtonClass(isActive, !canAfford || !isUnlocked)} min-h-[34px] px-4`}
                    >
                      {isActive ? 'Active' : 'Start Hustle'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Wider screens: a sortable table */}
        <div className="surface hidden overflow-x-auto sm:block">
          <table className="min-w-full text-sm text-slate-300">
            <thead className="text-[12px] text-slate-500">
              <tr className="border-b border-white/[0.06]">
                {compareMode && <th className="w-10 px-4 py-3 text-left font-medium">Comp</th>}
                {sortHeader('name', 'Hustle Name', 'left')}
                {sortHeader('income', 'Income/mo', 'right')}
                {sortHeader('energy', 'Energy', 'right')}
                {sortHeader('stress', 'Stress', 'right')}
                {sortHeader('ai', 'AI Risk', 'center')}
                {sortHeader('payback', 'Payback', 'right')}
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {sortedRows.map((row) => {
                  const { hustle, payback, aiRisk, isActive, canAfford, isUnlocked } = row;
                  const canSelectMore = compareSelection.length < 2 || compareSelection.includes(hustle.id);
                  const paybackLabel = Number.isFinite(payback) ? `${payback.toFixed(1)} mo` : '—';

                  return (
                    <motion.tr key={hustle.id} {...rowMotion} className="border-t border-white/[0.05] transition-colors first:border-t-0 hover:bg-white/[0.03]">
                      {compareMode && (
                        <td className="px-4 py-3">{compareCheckbox(hustle.id, canSelectMore)}</td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <HustleGlyph icon={hustle.icon} active={isActive} />
                          <div>
                            <p className="text-[15px] font-semibold text-white">{hustle.name}</p>
                            <p className="num text-xs text-slate-500">{hustle.hoursPerWeek} hrs/week</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="num font-semibold text-emerald-300">
                          {formatMoney(hustle.incomeRange.min)}-{formatMoney(hustle.incomeRange.max)}
                        </span>
                      </td>
                      <td className="num px-4 py-3 text-right font-medium text-amber-300">-{hustle.energyCost}</td>
                      <td className="num px-4 py-3 text-right font-medium text-rose-300">+{hustle.stressIncrease}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`ds-badge ${riskBadge(aiRisk)}`}>{RISK_LABEL[aiRisk as RiskFilter]}</span>
                      </td>
                      <td className="num px-4 py-3 text-right text-slate-300">{paybackLabel}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleStartSideHustle(hustle)}
                          disabled={isActive || !canAfford || !isUnlocked}
                          className={`${startButtonClass(isActive, !canAfford || !isUnlocked)} min-h-[32px] px-3.5`}
                        >
                          {isActive ? 'Active' : <><Plus size={14} strokeWidth={2.6} className="-ml-0.5" /> Start</>}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {compareMode && selectedHustles.length === 2 && (
            <motion.div
              key="compare"
              initial={MOTION_DISABLED ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={MOTION_DISABLED ? undefined : { opacity: 0, y: 6 }}
              transition={springs.smooth}
              className="surface mt-4 p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#30d158]"></span>
                  {selectedHustles[0].hustle.name}
                  <span className="mx-1 text-xs text-slate-500">vs</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0a84ff]"></span>
                  {selectedHustles[1].hustle.name}
                </p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#aeaeb2', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={selectedHustles[0].hustle.name} dataKey={selectedHustles[0].hustle.id} stroke="#30d158" fill="#30d158" fillOpacity={0.28} />
                    <Radar name={selectedHustles[1].hustle.name} dataKey={selectedHustles[1].hustle.id} stroke="#0a84ff" fill="#0a84ff" fillOpacity={0.28} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--mat-regular)', borderColor: 'var(--hairline-strong)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(24px) saturate(180%)' }}
                      itemStyle={{ color: '#e5e5ea' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SideHustlesTab;
