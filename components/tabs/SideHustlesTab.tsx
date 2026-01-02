import React from 'react';
import { Coffee, Minus, Plus } from 'lucide-react';
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

  return (
<div className="max-w-4xl mx-auto">
            {/* Active Side Hustles */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
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
                      <div key={hustle.id} className="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{hustle.icon}</span>
                          <div>
                            <p className="text-white font-medium">{hustle.name}</p>
                            <p className="text-emerald-400 text-sm">
                              {formatMoney(adjustedMin)}-{formatMoney(adjustedMax)}/mo
                              {aiPenalty > 0.1 && <span className="text-amber-400 ml-1">(AI impact: -{Math.round(aiPenalty * 50)}%)</span>}
                            </p>
                            <p className="text-slate-400 text-xs">
                              Level {upgrades.length + 1} • {monthsActive} months active
                              {nextMilestone && (
                                <span className="text-slate-500"> • Next milestone: {nextMilestone.monthsRequired} mo ({monthsUntilMilestone} mo)</span>
                              )}
                            </p>
                            {upgradeLabels.length > 0 && (
                              <p className="text-slate-500 text-xs">Upgrades: {upgradeLabels.join(', ')}</p>
                            )}
                            {upgradeReady && (
                              <button
                                onClick={() => setShowSideHustleUpgradeModal(true)}
                                className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
                              >
                                Choose upgrade
                              </button>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleStopSideHustle(hustle.id)} 
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm border border-red-600/30 transition-all">
                          <Minus size={16} />
                        </button>
                      </div>
                    );
                  })}
                  
                  <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400">
                      Estimated active side hustle income: <span className="text-emerald-400 font-bold">{formatMoney(cashFlow.sideHustleIncome)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4">Available Side Hustles</h3>
            <div
              ref={coachSideHustlesRef}
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${coachHighlight('sidehustles-list')}`}
            >
              {SIDE_HUSTLES.map(hustle => {
                const isActive = !!gameState.activeSideHustles.find(h => h.id === hustle.id);
                const aiRisk = hustle.aiVulnerability > 0.6 ? 'HIGH' : hustle.aiVulnerability > 0.3 ? 'MEDIUM' : 'LOW';
                const canAfford = gameState.cash >= hustle.startupCost;
                const milestoneSummary = hustle.milestones?.map(m => `${m.monthsRequired} mo`).join(', ');
                const careerLevel = gameState.career?.level ?? gameState.playerJob?.level ?? 0;
                const hasCareerLevel = !hustle.requiredCareerLevel || careerLevel >= hustle.requiredCareerLevel;
                const hasCareerPath = !hustle.requiredCareerPath || (gameState.career?.path && hustle.requiredCareerPath.includes(gameState.career.path));
                const hasEducation = !hustle.requiredEducation || hustle.requiredEducation.length === 0 || 
                  hustle.requiredEducation.some(reqCat => 
                    gameState.education.degrees.some(d => EDUCATION_OPTIONS.find(e => e.id === d)?.category === reqCat)
                  );
                const isUnlocked = hasEducation && hasCareerLevel && hasCareerPath;
                
                return (
                  <div key={hustle.id} className={`rounded-xl p-4 border transition-all ${
                    isActive ? 'bg-emerald-900/20 border-emerald-700/50' : 
                    'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{hustle.icon}</span>
                        <div>
                          <h4 className="text-white font-bold">{hustle.name}</h4>
                          <p className="text-slate-400 text-xs">{hustle.hoursPerWeek} hrs/week</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        aiRisk === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' : 
                        aiRisk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-red-500/20 text-red-400'}`}>
                        AI Risk: {aiRisk}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 text-xs mb-2">{hustle.description}</p>
                    {milestoneSummary && (
                      <p className="text-slate-500 text-xs mb-2">Milestones: {milestoneSummary}</p>
                    )}
                    
                    {hustle.requiredEducation && hustle.requiredEducation.length > 0 && (
                      <p className={`text-xs mb-2 ${hasEducation ? 'text-emerald-400' : 'text-red-400'}`}>
                        {hasEducation ? '✓' : '✗'} Requires: {hustle.requiredEducation.join(' or ')} education
                      </p>
                    )}
                    {hustle.requiredCareerLevel && (
                      <p className={`text-xs mb-2 ${hasCareerLevel ? 'text-emerald-400' : 'text-red-400'}`}>
                        {hasCareerLevel ? '✓' : '✗'} Requires career level {hustle.requiredCareerLevel}+
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-slate-500">Income:</span>{' '}
                        <span className="text-emerald-400">{formatMoney(hustle.incomeRange.min)}-{formatMoney(hustle.incomeRange.max)}/mo</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Startup:</span>{' '}
                        <span className="text-white">{hustle.startupCost > 0 ? formatMoney(hustle.startupCost) : 'Free'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Energy:</span>{' '}
                        <span className="text-amber-400">-{hustle.energyCost}/mo</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Stress:</span>{' '}
                        <span className="text-red-400">+{hustle.stressIncrease}</span>
                      </div>
                    </div>
                    
                    <button onClick={() => handleStartSideHustle(hustle)} 
                      disabled={isActive || !canAfford || !isUnlocked}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        isActive ? 'bg-emerald-600/20 text-emerald-400 cursor-not-allowed' : 
                        !canAfford ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
                        !isUnlocked ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
                        'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                      {isActive ? '✓ Active' : 
                       !canAfford ? `Need ${formatMoney(hustle.startupCost)}` :
                       !isUnlocked ? 'Unlock Required' :
                       <><Plus size={16} /> Start Hustle</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
  );
};

export default SideHustlesTab;
