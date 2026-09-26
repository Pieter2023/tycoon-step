import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bot, Check, ChevronRight, Rocket, TrendingUp } from 'lucide-react';
import { CAREER_PATHS, EDUCATION_OPTIONS } from '../../constants';
import { getCourseRaiseMultiplier, getEducationSalaryMultiplier } from '../../services/gameLogic';
import { Tooltip } from '../ui';
import ActivityRing from '../ui/ActivityRing';
import AnimatedNumber from '../ui/AnimatedNumber';
import { springs } from '../ui/motion';

type CareerTabProps = {
  gameState: any;
  careerPath: string;
  cashFlow: any;
  formatMoney: (value: number) => string;
  aiImpact: any;
  isProcessing: boolean;
  onPromote: () => void;
  onOpenSideHustles?: () => void;
};

const CareerTab: React.FC<CareerTabProps> = (props) => {
  const {
    gameState,
    careerPath,
    cashFlow,
    formatMoney,
    aiImpact,
    isProcessing,
    onPromote,
    onOpenSideHustles
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

  // Keep each level's real index: on a phone only the current and next levels show, and the
  // current/next/promote logic must still compare against the ladder position, not the filtered one.
  const visibleLevels = useMemo(() => {
    const indexed = levels.map((level, idx) => ({ level, idx }));
    if (showAllLevels) return indexed;
    return indexed.filter(({ idx }) => idx === currentLevelIndex || idx === currentLevelIndex + 1);
  }, [currentLevelIndex, levels, showAllLevels]);


  const futureProof = CAREER_PATHS[careerPath]?.futureProofScore || 50;
  const futureTone = futureProof >= 80 ? 'green' : futureProof >= 50 ? 'orange' : 'red';
  const FUTURE_STYLE = {
    green: { ring: ['#30d158', '#64d2ff'] as [string, string], text: 'text-emerald-300', icon: 'text-emerald-300', bg: 'bg-emerald-500/[0.08]' },
    orange: { ring: ['#ffd60a', '#ff9f0a'] as [string, string], text: 'text-amber-300', icon: 'text-amber-300', bg: 'bg-amber-500/[0.08]' },
    red: { ring: ['#ff9f0a', '#ff453a'] as [string, string], text: 'text-rose-300', icon: 'text-rose-300', bg: 'bg-rose-500/[0.08]' }
  }[futureTone];
  const educationRaise = getEducationSalaryMultiplier(gameState);
  const courseRaise = getCourseRaiseMultiplier(gameState);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <header className="flex items-center gap-4 pr-12">
        <div className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br text-[34px] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_14px_30px_-12px_rgb(0_0_0/0.8)] ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'}`}>
          {CAREER_PATHS[careerPath]?.icon || '💼'}
        </div>
        <div className="min-w-0">
          <p className="eyebrow text-emerald-300">{CAREER_PATHS[careerPath]?.name || 'Unknown'}</p>
          <h2 className="t-title-2 text-white">{gameState.career?.title || 'Unemployed'}</h2>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <p className="text-[13px] text-slate-400">Monthly Salary</p>
          <p className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[30px]">
            <AnimatedNumber value={cashFlow.salary} format={formatMoney} />
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {educationRaise > 1 && (
              <span className="num rounded-full bg-sky-500/[0.14] px-2 py-0.5 text-[11px] font-semibold text-sky-300">+{((educationRaise - 1) * 100).toFixed(0)}% from education</span>
            )}
            {courseRaise > 1 && (
              <span className="num rounded-full bg-sky-500/[0.14] px-2 py-0.5 text-[11px] font-semibold text-sky-300">+{((courseRaise - 1) * 100).toFixed(1).replace(/\.0$/, '')}% from certifications</span>
            )}
          </div>
        </div>
        <div className="rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <p className="text-[13px] text-slate-400">Experience</p>
          <p className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[30px]">
            <AnimatedNumber value={gameState.career?.experience || 0} format={(v) => String(Math.round(v))} />
            <span className="text-[17px] font-semibold text-slate-400"> mo</span>
          </p>
        </div>
      </div>

      {(gameState.jobLossMonthsRemaining ?? 0) > 0 && (
        <div className="flex gap-3.5 rounded-[18px] bg-orange-500/[0.1] p-4">
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400/20 text-orange-300">
            <AlertTriangle size={18} />
          </span>
          <div>
            <p className="t-headline text-orange-200">Job loss shock</p>
            <p className="mt-1 text-[14px] leading-relaxed text-slate-200">
              Your salary is paused for <span className="num font-semibold text-white">{gameState.jobLossMonthsRemaining}</span>{' '}
              more month{gameState.jobLossMonthsRemaining === 1 ? '' : 's'}. Use your emergency fund, reduce expenses, and avoid taking on new debt.
            </p>
          </div>
        </div>
      )}

      {/* AI Risk: the future-proof score as a ring gauge in green / orange / red. */}
      <div className={`flex items-center gap-4 rounded-[18px] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] ${FUTURE_STYLE.bg}`}>
        <ActivityRing progress={futureProof / 100} size={64} stroke={7} colors={FUTURE_STYLE.ring}>
          <Bot size={20} className={FUTURE_STYLE.icon} />
        </ActivityRing>
        <div className="min-w-0 flex-1">
          <p className={`num text-[15px] font-semibold ${FUTURE_STYLE.text}`}>
            AI Future-Proof Score: {CAREER_PATHS[careerPath]?.futureProofScore || 50}%
          </p>
          <p className="mt-0.5 text-[14px] leading-snug text-slate-300">{CAREER_PATHS[careerPath]?.specialMechanic || 'Work hard and advance!'}</p>
          {aiImpact && aiImpact.salaryImpact !== 1 && (
            <p className="num mt-1 text-[12px] text-slate-400">
              AI impact on salary: {aiImpact.salaryImpact > 1 ? '+' : ''}{((aiImpact.salaryImpact - 1) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      {onOpenSideHustles && (
        <button
          type="button"
          onClick={onOpenSideHustles}
          className="group flex w-full items-center gap-3.5 rounded-[18px] bg-white/[0.045] p-4 text-left shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] transition-[background-color,scale] duration-200 ease-out hover:bg-white/[0.07] active:scale-[0.985] active:duration-75"
        >
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_20px_-8px_rgb(191_90_242/0.7)]">
            <Rocket size={19} strokeWidth={2.3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-slate-400">Side Hustles</span>
            <span className="block text-[15px] font-semibold text-white">Add a hustle income stream</span>
            <span className="mt-0.5 block text-[12px] font-semibold text-purple-300">Open side hustles →</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-500 transition-transform duration-300 ease-spring group-hover:translate-x-0.5" />
        </button>
      )}

      {/* Career Timeline */}
      <section className="pt-1">
        <h4 className="t-headline mb-3 flex items-center gap-2 text-white">
          <TrendingUp size={18} className="text-emerald-300" /> Career Timeline
        </h4>
        <ol>
          {visibleLevels.map(({ level, idx }, position) => {
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
            const isLast = position === visibleLevels.length - 1;

            return (
              <li key={level.title} className="relative flex gap-3.5">
                <div className="relative flex w-7 shrink-0 flex-col items-center">
                  <span
                    className={`num relative z-[1] mt-3.5 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${isCompleted
                        ? 'bg-emerald-400 text-black'
                        : isCurrentLevel
                          ? 'bg-emerald-400 text-black shadow-[0_0_0_5px_rgb(48_209_88/0.18),0_0_20px_rgb(48_209_88/0.45)]'
                          : isNextLevel
                            ? 'bg-amber-400 text-black shadow-[0_0_0_5px_rgb(255_159_10/0.16)]'
                            : 'bg-white/[0.07] text-slate-400 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]'
                      }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3.2} /> : idx + 1}
                  </span>
                  {!isLast && (
                    <span aria-hidden className={`-mb-3.5 mt-1 w-[2px] flex-1 rounded-full ${isCompleted ? 'bg-emerald-400/70' : 'bg-white/[0.08]'}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-3">
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
                    className="w-full [&>span:first-child]:w-full"
                  >
                    <div
                      className={`relative w-full rounded-[16px] p-3.5 ${isCurrentLevel
                          ? ''
                          : isNextLevel
                            ? 'bg-amber-500/[0.07] shadow-[inset_0_0_0_1px_rgb(255_159_10/0.22)]'
                            : ''
                        }`}
                    >
                      {isCurrentLevel && (
                        <motion.span
                          layoutId="career-timeline-current"
                          transition={springs.glide}
                          aria-hidden
                          className="absolute inset-0 rounded-[16px] bg-emerald-500/[0.1] shadow-[inset_0_0_0_1px_rgb(48_209_88/0.28)]"
                        />
                      )}
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-[15px] leading-tight ${isCurrentLevel || isNextLevel ? 'font-semibold text-white' : 'text-slate-300'}`}>
                            {level.title}
                          </p>
                          <p className="num mt-0.5 text-[12px] text-slate-400">
                            {formatMoney(level.baseSalary)}/mo • Perk: {careerInfo?.futureProofScore || 0}% future-proof
                          </p>
                        </div>
                        {isCurrentLevel && (
                          <span className="ds-badge ds-badge--low shrink-0">
                            Current
                          </span>
                        )}
                        {isNextLevel && (
                          <span className="ds-badge ds-badge--med shrink-0">
                            Next
                          </span>
                        )}
                      </div>

                      {isCurrentLevel || isNextLevel ? (
                        <div className="relative mt-3.5 space-y-3 text-[12px]">
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-slate-400">
                              <span>Experience</span>
                              <span className="num">{experience}/{experienceNeeded} mo</span>
                            </div>
                            <div className="meter" aria-hidden>
                              <div className="meter-fill bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${experienceProgress}%` }} />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-end gap-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${educationMet ? 'bg-emerald-500/[0.14] text-emerald-300' : 'bg-amber-500/[0.14] text-amber-300'
                              }`}>
                              🎓 Education: {formatEducationRequirement(level)}
                            </span>
                            <div className="min-w-[140px] flex-1">
                              <div className="mb-1.5 flex items-center justify-between text-slate-400">
                                <span>Networking</span>
                                <span className="num">{Math.round(networking)}/100</span>
                              </div>
                              <div className="meter" aria-hidden>
                                <div className="meter-fill bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${Math.min((networking / 100) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="relative mt-1.5 text-[12px] text-slate-500">
                          Requires {level.experienceRequired} months experience.
                        </p>
                      )}
                    </div>
                  </Tooltip>

                  {isNextLevel && (
                    <div className="mt-2.5 flex justify-end">
                      <button
                        onClick={onPromote}
                        disabled={!canPromote || isBlocked}
                        className={`ds-button--md ${!canPromote || isBlocked ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        Promote to {level.title}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {levels.length > 2 && (
          <div className="mt-2 text-center sm:hidden">
            <button
              type="button"
              onClick={() => setShowAllLevels((prev) => !prev)}
              className="ds-button ds-button--ghost ds-button--sm"
            >
              {showAllLevels ? 'Show fewer levels' : 'Show full timeline'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default CareerTab;
