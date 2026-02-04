import React, { useMemo, useState } from 'react';
import { Coffee, Minus, Plus } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { EDUCATION_OPTIONS, SIDE_HUSTLES } from '../../constants';
import { GameState, SideHustle } from '../../types';

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

  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [sortKey, setSortKey] = useState<'name' | 'income' | 'energy' | 'stress' | 'ai' | 'payback'>('income');
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

  return (
    <div className="w-full">
      {/* Active Side Hustles */}
      <div className="glass-panel p-5 mb-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Coffee className="text-amber-400" size={20} />
          Your Active Side Hustles
        </h3>
        {gameState.activeSideHustles.length === 0 ? (
          <p className="text-slate-400 text-sm">No active side hustles. Start one below to earn extra income!</p>
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

              return (
                <div key={hustle.id} className="flex items-center justify-between p-4 glass-tile bg-emerald-900/10 border-emerald-500/20">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{hustle.icon}</span>
                    <div>
                      <p className="text-white font-bold">{hustle.name}</p>
                      <p className="text-emerald-400 text-sm font-medium">
                        {formatMoney(adjustedMin)}-{formatMoney(adjustedMax)}/mo
                        {aiPenalty > 0.1 && <span className="text-amber-400 ml-1">(AI: -{Math.round(aiPenalty * 50)}%)</span>}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Level {upgrades.length + 1} • {monthsActive} months active
                        {nextMilestone && (
                          <span className="text-slate-500"> • Next milestone: {nextMilestone.monthsRequired} mo ({monthsUntilMilestone} mo)</span>
                        )}
                      </p>
                      {upgradeLabels.length > 0 && (
                        <p className="text-slate-500 text-xs mt-1">Upgrades: {upgradeLabels.join(', ')}</p>
                      )}
                      {upgradeReady && (
                        <button
                          onClick={() => setShowSideHustleUpgradeModal(true)}
                          className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all font-medium animate-pulse"
                        >
                          ✨ Upgrade Available
                        </button>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleStopSideHustle(hustle.id)}
                    className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-sm border border-red-600/20 hover:border-red-600/40 transition-all"
                    title="Stop side hustle">
                    <Minus size={18} />
                  </button>
                </div>
              );
            })}

            <div className="mt-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30">
              <p className="text-sm text-slate-400 text-center">
                Total active hustle income: <span className="text-emerald-400 font-bold ml-1">{formatMoney(cashFlow.sideHustleIncome)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        ref={coachSideHustlesRef}
        className={`${coachHighlight('sidehustles-list')}`}
      >
        <div className="my-4 glass-panel p-2 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2">
            <div>
              <h3 className="text-sm font-bold text-white">Available Side Hustles</h3>
              <p className="text-[11px] text-slate-400">Sort and compare options.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${riskFilter === risk
                      ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {risk === 'ALL' ? 'All' : risk}
                </button>
              ))}
              <button
                onClick={() => {
                  setCompareMode((prev) => !prev);
                  if (compareMode) setCompareSelection([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${compareMode
                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200'
                  }`}
              >
                {compareMode ? 'Comparing...' : 'Compare'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:hidden">
          {sortedRows.map((row) => {
            const { hustle, payback, aiRisk, isActive, canAfford, isUnlocked } = row;
            const canSelectMore = compareSelection.length < 2 || compareSelection.includes(hustle.id);
            const paybackLabel = Number.isFinite(payback) ? `${payback.toFixed(1)} mo` : '—';

            return (
              <div key={hustle.id} className="glass-panel p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{hustle.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{hustle.name}</p>
                      <p className="text-[11px] text-slate-500">{hustle.hoursPerWeek} hrs/week</p>
                    </div>
                  </div>
                  {compareMode && (
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                      <input
                        type="checkbox"
                        className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                        checked={compareSelection.includes(hustle.id)}
                        disabled={!canSelectMore}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setCompareSelection((prev) => {
                            if (checked) return [...prev, hustle.id].slice(0, 2);
                            return prev.filter((id) => id !== hustle.id);
                          });
                        }}
                      />
                      Select
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="glass-tile p-2">
                    <p className="text-slate-500 text-[10px] uppercase">Income</p>
                    <p className="text-emerald-300 font-semibold">
                      {formatMoney(hustle.incomeRange.min)}-{formatMoney(hustle.incomeRange.max)}
                    </p>
                  </div>
                  <div className="glass-tile p-2">
                    <p className="text-slate-500 text-[10px] uppercase">Payback</p>
                    <p className="text-white">{paybackLabel}</p>
                  </div>
                  <div className="glass-tile p-2">
                    <p className="text-slate-500 text-[10px] uppercase">Energy</p>
                    <p className="text-amber-300 font-semibold">-{hustle.energyCost}</p>
                  </div>
                  <div className="glass-tile p-2">
                    <p className="text-slate-500 text-[10px] uppercase">Stress</p>
                    <p className="text-red-300 font-semibold">+{hustle.stressIncrease}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide border ${aiRisk === 'LOW' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                      aiRisk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                        'bg-red-500/10 text-red-300 border-red-500/20'
                    }`}>
                    {aiRisk} RISK
                  </span>
                  <button
                    onClick={() => handleStartSideHustle(hustle)}
                    disabled={isActive || !canAfford || !isUnlocked}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                        ? 'bg-emerald-600/20 text-emerald-300 cursor-not-allowed border border-emerald-500/30'
                        : !canAfford || !isUnlocked
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 neon-outline-green'
                      }`}
                  >
                    {isActive ? 'Active' : 'Start Hustle'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block overflow-hidden glass-panel">
          <table className="min-w-full text-sm text-slate-300">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900/40 font-semibold">
              <tr>
                {compareMode && <th className="px-4 py-3 text-left w-10">Comp</th>}
                <th className="px-4 py-3 text-left cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>Hustle Name</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('income')}>Income/mo</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('energy')}>Energy</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('stress')}>Stress</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('ai')}>AI Risk</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('payback')}>Payback</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedRows.map((row) => {
                const { hustle, payback, aiRisk, isActive, canAfford, isUnlocked } = row;
                const canSelectMore = compareSelection.length < 2 || compareSelection.includes(hustle.id);
                const paybackLabel = Number.isFinite(payback) ? `${payback.toFixed(1)} mo` : '—';

                return (
                  <tr key={hustle.id} className="hover:bg-slate-800/30 transition-colors">
                    {compareMode && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                          checked={compareSelection.includes(hustle.id)}
                          disabled={!canSelectMore}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCompareSelection((prev) => {
                              if (checked) return [...prev, hustle.id].slice(0, 2);
                              return prev.filter((id) => id !== hustle.id);
                            });
                          }}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl pt-1">{hustle.icon}</span>
                        <div>
                          <p className="text-white font-bold">{hustle.name}</p>
                          <p className="text-xs text-slate-500">{hustle.hoursPerWeek} hrs/week</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-300 font-medium">
                        {formatMoney(hustle.incomeRange.min)}-{formatMoney(hustle.incomeRange.max)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-amber-300 font-medium">-{hustle.energyCost}</td>
                    <td className="px-4 py-3 text-right text-red-300 font-medium">+{hustle.stressIncrease}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${aiRisk === 'LOW' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                          aiRisk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                            'bg-red-500/10 text-red-300 border border-red-500/20'
                        }`}>
                        {aiRisk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{paybackLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStartSideHustle(hustle)}
                        disabled={isActive || !canAfford || !isUnlocked}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                            ? 'bg-emerald-600/20 text-emerald-300 cursor-not-allowed border border-emerald-500/30'
                            : !canAfford || !isUnlocked
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg'
                          }`}
                      >
                        {isActive ? 'Active' : <><Plus size={14} className="inline mr-1" /> Start</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {compareMode && selectedHustles.length === 2 && (
          <div className="mt-4 glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {selectedHustles[0].hustle.name}
                <span className="text-slate-500 text-xs mx-1">vs</span>
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                {selectedHustles[1].hustle.name}
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name={selectedHustles[0].hustle.name} dataKey={selectedHustles[0].hustle.id} stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
                  <Radar name={selectedHustles[1].hustle.name} dataKey={selectedHustles[1].hustle.id} stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideHustlesTab;
