import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot } from 'lucide-react';
import { CAREER_PATHS, EDUCATION_OPTIONS } from '../../constants';
import { getEducationSalaryMultiplier } from '../../services/gameLogic';
import { Tooltip } from '../ui';

type CareerTabProps = {
  gameState: any;
  careerPath: string;
  cashFlow: any;
  formatMoney: (value: number) => string;
  aiImpact: any;
  isProcessing: boolean;
  onPromote: () => void;
};

const CareerTab: React.FC<CareerTabProps> = (props) => {
  const {
    gameState,
    careerPath,
    cashFlow,
    formatMoney,
    aiImpact,
    isProcessing,
    onPromote
  } = props;

  const careerInfo = CAREER_PATHS[careerPath];
  const levels = careerInfo?.levels || [];
  const currentLevelIndex = Math.max(0, (gameState.career?.level ?? 1) - 1);
  const experience = gameState.career?.experience ?? 0;
  const networking = gameState.stats?.networking ?? 0;
  const degrees = gameState.education?.degrees || [];
  const [showAllLevels, setShowAllLevels] = useState(true);

  const levelOrder = useMemo(
    () => ['HIGH_SCHOOL', 'CERTIFICATE', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'MBA', 'PHD', 'LAW', 'MEDICAL'],
    []
  );

  const hasRequiredEducation = (level: any) => {
    if (!level.educationRequired || !level.educationCategory) return true;
    return degrees.some((degId: string) => {
      const edu = EDUCATION_OPTIONS.find(e => e.id === degId);
      if (!edu) return false;
      const requiredIdx = levelOrder.indexOf(level.educationRequired);
      const hasIdx = levelOrder.indexOf(edu.level);
      return hasIdx >= requiredIdx && edu.category === level.educationCategory;
    });
  };

  const formatEducationRequirement = (level: any) => {
    if (!level.educationRequired || !level.educationCategory) return 'None';
    return `${level.educationRequired.replace('_', ' ')} • ${level.educationCategory}`;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 640px)');
    setShowAllLevels(!media.matches);
    const onChange = (event: MediaQueryListEvent) => setShowAllLevels(!event.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const visibleLevels = useMemo(() => {
    if (showAllLevels) return levels;
    return levels.filter((_, idx) => idx === currentLevelIndex || idx === currentLevelIndex + 1);
  }, [currentLevelIndex, levels, showAllLevels]);

  return (
<div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-4xl`}>
                  {CAREER_PATHS[careerPath]?.icon || '💼'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{gameState.career?.title || 'Unemployed'}</h2>
                  <p className="text-emerald-400">{CAREER_PATHS[careerPath]?.name || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm">Monthly Salary</p>
                  <p className="text-3xl font-bold text-emerald-400">{formatMoney(cashFlow.salary)}</p>
                  {getEducationSalaryMultiplier(gameState) > 1 && (
                    <p className="text-blue-400 text-xs">+{((getEducationSalaryMultiplier(gameState) - 1) * 100).toFixed(0)}% from education</p>
                  )}
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm">Experience</p>
                  <p className="text-3xl font-bold text-white">
                    {gameState.career?.experience || 0}<span className="text-lg text-slate-400"> mo</span>
                  </p>
                </div>
              </div>

              {(gameState.jobLossMonthsRemaining ?? 0) > 0 && (
                <div className="p-4 rounded-xl mb-4 bg-amber-900/20 border border-amber-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span className="font-medium text-amber-300">Job loss shock</span>
                  </div>
                  <p className="text-sm text-slate-200">
                    Your salary is paused for <span className="font-semibold text-white">{gameState.jobLossMonthsRemaining}</span>{' '}
                    more month{gameState.jobLossMonthsRemaining === 1 ? '' : 's'}. Use your emergency fund, reduce expenses, and avoid taking on new debt.
                  </p>
                </div>
              )}
              
              {/* AI Risk Warning */}
              <div className={`p-4 rounded-xl mb-4 ${
                (CAREER_PATHS[careerPath]?.futureProofScore || 50) >= 80 ? 'bg-emerald-900/20 border border-emerald-700/50' : 
                (CAREER_PATHS[careerPath]?.futureProofScore || 50) >= 50 ? 'bg-amber-900/20 border border-amber-700/50' : 
                'bg-red-900/20 border border-red-700/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={16} />
                  <span className="font-medium">AI Future-Proof Score: {CAREER_PATHS[careerPath]?.futureProofScore || 50}%</span>
                </div>
                <p className="text-sm text-slate-300">{CAREER_PATHS[careerPath]?.specialMechanic || 'Work hard and advance!'}</p>
                {aiImpact && aiImpact.salaryImpact !== 1 && (
                  <p className="text-xs text-slate-400 mt-2">
                    AI impact on salary: {aiImpact.salaryImpact > 1 ? '+' : ''}{((aiImpact.salaryImpact - 1) * 100).toFixed(0)}%
                  </p>
                )}
              </div>
              
              {/* Career Timeline */}
              <div className="bg-slate-900/30 rounded-xl p-4">
                <h4 className="text-white font-medium mb-3">📈 Career Timeline</h4>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-700" />
                  {visibleLevels.map((level, idx) => {
                    const isCurrentLevel = currentLevelIndex === idx;
                    const isNextLevel = currentLevelIndex + 1 === idx;
                    const isCompleted = idx < currentLevelIndex;
                    const experienceNeeded = level.experienceRequired || 0;
                    const experienceProgress = experienceNeeded > 0
                      ? Math.min((experience / experienceNeeded) * 100, 100)
                      : 100;
                    const educationMet = hasRequiredEducation(level);
                    const canPromote = isNextLevel && educationMet && experience >= experienceNeeded;
                    const isBlocked = isProcessing || gameState.pendingScenario || gameState.isBankrupt;

                    return (
                      <div key={level.title} className="relative flex items-start gap-3 pb-4">
                        <div
                          className={`mt-1 h-3 w-3 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : isNextLevel
                                ? 'bg-amber-400'
                                : isCurrentLevel
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-600'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <Tooltip
                            content={(
                              <div className="text-xs space-y-1">
                                <p className="font-semibold text-white">{level.title}</p>
                                <p>Salary: {formatMoney(level.baseSalary)}/mo</p>
                                <p>Experience: {level.experienceRequired} months</p>
                                <p>Education: {formatEducationRequirement(level)}</p>
                                <p>Networking: higher boosts promotion odds.</p>
                                <p>Career perk: {careerInfo?.specialMechanic || 'Career growth benefits'}</p>
                              </div>
                            )}
                            className="w-full"
                          >
                            <div
                              className={`rounded-xl border p-3 transition-all ${
                                isCurrentLevel
                                  ? 'border-emerald-500/60 bg-emerald-900/20'
                                  : isNextLevel
                                    ? 'border-amber-500/50 bg-amber-900/10'
                                    : 'border-slate-700 bg-slate-900/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className={`text-sm ${isCurrentLevel ? 'text-white font-semibold' : 'text-slate-300'}`}>
                                    {level.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {formatMoney(level.baseSalary)}/mo • Perk: {careerInfo?.futureProofScore || 0}% future-proof
                                  </p>
                                </div>
                                {isCurrentLevel && (
                                  <span className="text-[10px] uppercase tracking-wide text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full">
                                    Current
                                  </span>
                                )}
                                {isNextLevel && (
                                  <span className="text-[10px] uppercase tracking-wide text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full">
                                    Next
                                  </span>
                                )}
                              </div>

                              {isCurrentLevel || isNextLevel ? (
                                <div className="mt-3 space-y-2 text-xs">
                                  <div>
                                    <div className="flex items-center justify-between text-slate-400">
                                      <span>Experience</span>
                                      <span>{experience}/{experienceNeeded} mo</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${experienceProgress}%` }} />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full border text-[11px] ${
                                      educationMet ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                    }`}>
                                      Education: {formatEducationRequirement(level)}
                                    </span>
                                    <div className="flex-1 min-w-[140px]">
                                      <div className="flex items-center justify-between text-slate-400">
                                        <span>Networking</span>
                                        <span>{Math.round(networking)}/100</span>
                                      </div>
                                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min((networking / 100) * 100, 100)}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 mt-2">
                                  Requires {level.experienceRequired} months experience.
                                </p>
                              )}
                            </div>
                          </Tooltip>
                        </div>
                        {isNextLevel && (
                          <button
                            onClick={onPromote}
                            disabled={!canPromote || isBlocked}
                            className={`ml-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                              !canPromote || isBlocked
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            Promote
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {levels.length > 2 && (
                  <div className="mt-3 sm:hidden">
                    <button
                      type="button"
                      onClick={() => setShowAllLevels((prev) => !prev)}
                      className="text-xs text-emerald-300 hover:text-emerald-200"
                    >
                      {showAllLevels ? 'Show fewer levels' : 'Show full timeline'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
  );
};

export default CareerTab;
