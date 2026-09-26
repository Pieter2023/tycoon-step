import { useI18n } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Briefcase, Check, ChevronRight, HeartPulse, Rocket, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import Modal from '../Modal';
import CareerTab from '../tabs/CareerTab';
import { CAREER_PATHS } from '../../constants';
import { GameState } from '../../types';
import AnimatedNumber from '../ui/AnimatedNumber';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';

type CareerPageLayoutProps = {
  gameState: GameState;
  careerPath: string;
  cashFlow: any;
  formatMoney: (value: number) => string;
  aiImpact: any;
  isProcessing: boolean;
  onPromote: () => void;
  onNavigate: (path: '/play' | '/money' | '/career' | '/learn' | '/life', tab?: 'invest' | 'lifestyle' | 'sidehustles') => void;
};

const buildSkillCard = (label: string, course?: { certified?: boolean; bestScore?: number; failedAttempts?: number }) => {
  const certified = !!course?.certified;
  const score = course?.bestScore ?? 0;
  const attempts = course?.failedAttempts ?? 0;
  return { label, certified, score, attempts };
};

// Tinted squircles for the four courses (the same colours Self Learn uses).
const SKILL_STYLE = [
  { icon: <HeartPulse size={17} strokeWidth={2.4} />, tint: 'from-pink-400 to-rose-500' },
  { icon: <Users size={17} strokeWidth={2.4} />, tint: 'from-sky-400 to-blue-500' },
  { icon: <Zap size={17} strokeWidth={2.4} />, tint: 'from-orange-400 to-amber-500' },
  { icon: <Sparkles size={17} strokeWidth={2.4} />, tint: 'from-emerald-400 to-teal-500' }
];

// AI automation risk as Apple's system colours: calm green → orange → red → purple.
const RISK_STYLE: Record<string, { badge: string; fill: string }> = {
  LOW: { badge: 'ds-badge--low', fill: 'bg-gradient-to-r from-emerald-400 to-teal-400' },
  MEDIUM: { badge: 'ds-badge--med', fill: 'bg-gradient-to-r from-amber-400 to-orange-500' },
  HIGH: { badge: 'ds-badge--high', fill: 'bg-gradient-to-r from-orange-500 to-red-500' },
  CRITICAL: { badge: 'ds-badge--extreme', fill: 'bg-gradient-to-r from-red-500 to-purple-500' }
};

const enter = MOTION_DISABLED ? {} : { initial: 'hidden', animate: 'show' };

export const CareerPageLayout: React.FC<CareerPageLayoutProps> = ({
  gameState,
  careerPath,
  cashFlow,
  formatMoney,
  aiImpact,
  isProcessing,
  onPromote,
  onNavigate
}) => {
  const { t } = useI18n();
  const [showDetails, setShowDetails] = useState(false);
  const career = gameState.career;
  const levels = CAREER_PATHS[careerPath]?.levels || [];
  const currentLevel = career?.level || 1;
  const nextLevel = levels[currentLevel] || null;
  const experience = career?.experience || 0;

  const skills = useMemo(() => {
    return [
      buildSkillCard('EQ', gameState.eqCourse),
      buildSkillCard(t('shell.careerPage.negotiation'), gameState.negotiationsCourse),
      buildSkillCard('Sales', gameState.salesAcceleratorCourse),
      buildSkillCard(t('shell.careerPage.compound_interest'), gameState.compoundInterestCourse)
    ];
  }, [gameState.eqCourse, gameState.negotiationsCourse, gameState.salesAcceleratorCourse, gameState.compoundInterestCourse]);

  const disruptionLevel = gameState.aiDisruption?.disruptionLevel || 0;
  const risk = aiImpact?.automationRisk || 'LOW';
  const riskStyle = RISK_STYLE[risk] ?? RISK_STYLE.LOW;
  const expNeeded = nextLevel?.experienceRequired || 0;
  const expProgress = expNeeded > 0 ? Math.min(100, (experience / expNeeded) * 100) : 100;

  return (
    <motion.div className="space-y-6" variants={stagger(0.05, 0.04)} {...enter}>
      {/* Profile hero: who you are at work and what it pays, the way a Wallet card leads with its balance. */}
      <motion.section variants={riseIn} className="surface overflow-hidden p-5 md:p-7">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-emerald-500/[0.12] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-40 h-72 w-72 rounded-full bg-sky-500/[0.08] blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br text-[30px] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_14px_30px_-12px_rgb(0_0_0/0.8)] md:h-[72px] md:w-[72px] md:text-[34px] ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'}`}>
              {CAREER_PATHS[careerPath]?.icon || '💼'}
            </div>
            <div className="min-w-0">
              <p className="eyebrow text-emerald-300">{CAREER_PATHS[careerPath]?.name || t('shell.careerPage.unknown_path')}</p>
              <h2 className="t-title-1 text-white">{career?.title || t('shell.careerPage.unemployed')}</h2>
              <p className="num mt-0.5 text-[13px] text-slate-400">
                {t('ui.career.levelOf', { level: currentLevel, total: levels.length || 1 })} · {t('shell.careerPage.experience_months', { months: experience })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
            <div>
              <p className="eyebrow">{t('ui.career.monthlySalary')}</p>
              <p className="t-large-title text-white">
                <AnimatedNumber value={cashFlow.salary} format={formatMoney} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="btn-secondary ds-button--md"
            >{t('shell.careerPage.view_full_career_details')}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={riseIn} className="surface p-5 md:p-6 lg:col-span-2">
          <h3 className="t-headline flex items-center gap-2 text-white">
            <Briefcase size={18} className="text-emerald-300" />{t('shell.careerPage.career_summary')}
          </h3>

          {/* The next rung: what it pays and how far along you are. */}
          <div className="mt-4 rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <p className="text-[13px] text-slate-400">{t('shell.careerPage.next_growth_option')}</p>
            {nextLevel ? (
              <>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="t-title-3 text-white">{nextLevel.title}</p>
                  <p className="num text-[13px] text-slate-400">
                    {t('shell.careerPage.salary_and_exp', { salary: formatMoney(nextLevel.baseSalary), months: nextLevel.experienceRequired })}
                  </p>
                </div>
                <div className="meter mt-3.5 h-2" aria-hidden>
                  <div className="meter-fill bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${expProgress}%` }} />
                </div>
                <p className="num mt-2 text-[12px] text-slate-500">
                  {t('ui.career.towardNext', { have: Math.min(experience, expNeeded), need: expNeeded })}
                </p>
              </>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-white">
                <Trophy size={17} className="text-amber-300" />{t('shell.careerPage.max_level_reached')}
              </p>
            )}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {/* AI disruption as a tinted gauge. */}
            <div className="rounded-[18px] bg-white/[0.045] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-white">
                  <Bot size={17} className="text-purple-300" />{t('shell.careerPage.ai_disruption_impact')}
                </p>
                <span className={`ds-badge ${riskStyle.badge}`}>{risk}</span>
              </div>
              <div className="meter mt-3.5 h-2" aria-hidden>
                <div className={`meter-fill ${riskStyle.fill}`} style={{ width: `${Math.max(2, Math.min(100, disruptionLevel))}%` }} />
              </div>
              <p className="num mt-2 text-[12px] text-slate-400">
                {t('shell.careerPage.disruption_line', { level: disruptionLevel.toFixed(0), risk })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/life', 'sidehustles')}
              className="group flex items-center gap-3.5 rounded-[18px] bg-white/[0.045] p-4 text-left shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)] transition-[background-color,scale] duration-200 ease-out hover:bg-white/[0.07] active:scale-[0.985] active:duration-75"
            >
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_20px_-8px_rgb(191_90_242/0.7)]">
                <Rocket size={19} strokeWidth={2.3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-slate-400">{t('shell.careerPage.side_hustles')}</span>
                <span className="block text-[15px] font-semibold leading-snug text-white">{t('shell.careerPage.add_a_hustle_income_stream')}</span>
                <span className="mt-1 block text-[12px] font-semibold text-purple-300">{t('shell.careerPage.open_side_hustles')}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-slate-500 transition-transform duration-300 ease-spring group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={riseIn} className="surface p-5 md:p-6">
          <h3 className="t-headline flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-amber-300" />{t('shell.careerPage.skills')}
          </h3>
          <div className="list-group mt-4">
            {skills.map((skill, idx) => (
              <div key={skill.label} className="list-row">
                <span aria-hidden className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] ${skill.certified ? SKILL_STYLE[idx].tint : 'from-slate-600 to-slate-700 text-slate-300'}`}>
                  {SKILL_STYLE[idx].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-[15px] font-semibold leading-tight text-white">{skill.label}</p>
                    {skill.certified ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-emerald-300">
                        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-400 text-black">
                          <Check size={11} strokeWidth={3.4} />
                        </span>
                        {t('shell.careerPage.certified')}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[12px] text-slate-500">{t('shell.careerPage.not_certified')}</span>
                    )}
                  </div>
                  <p className="num mt-0.5 text-[12px] text-slate-400">
                    {t('shell.careerPage.best_score', { score: skill.score })}
                    {!skill.certified && <span className="text-slate-500"> · {t('shell.careerPage.attempts', { count: skill.attempts })}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The ladder: a vertical timeline. The "you are here" highlight glides down on a promotion. */}
      <motion.section variants={riseIn} className="surface p-5 md:p-6">
        <h3 className="t-headline text-white">{t('shell.careerPage.progression')}</h3>
        <ol className="mt-4">
          {levels.map((level, idx) => {
            const isCurrent = currentLevel === idx + 1;
            const isCompleted = currentLevel > idx + 1;
            const isNext = currentLevel + 1 === idx + 1;
            const isLast = idx === levels.length - 1;
            return (
              <li key={level.title} className="relative flex gap-3.5">
                <div className="relative flex w-8 shrink-0 flex-col items-center">
                  <span
                    className={`num relative z-[1] mt-3 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-colors duration-300 ${
                      isCompleted
                        ? 'bg-emerald-400 text-black'
                        : isCurrent
                          ? 'bg-emerald-400 text-black shadow-[0_0_0_5px_rgb(48_209_88/0.18),0_0_22px_rgb(48_209_88/0.45)]'
                          : 'bg-white/[0.07] text-slate-400 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]'
                    }`}
                  >
                    {isCompleted ? <Check size={15} strokeWidth={3.2} /> : idx + 1}
                  </span>
                  {!isLast && (
                    <span aria-hidden className={`-mb-3 mt-1 w-[2px] flex-1 rounded-full ${isCompleted ? 'bg-emerald-400/70' : 'bg-white/[0.08]'}`} />
                  )}
                </div>
                <div className="relative mb-1.5 min-w-0 flex-1 rounded-[16px] px-4 py-3">
                  {isCurrent && (
                    <motion.span
                      layoutId="career-ladder-current"
                      transition={springs.glide}
                      aria-hidden
                      className="absolute inset-0 rounded-[16px] bg-emerald-500/[0.1] shadow-[inset_0_0_0_1px_rgb(48_209_88/0.28)]"
                    />
                  )}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[15px] leading-tight ${isCurrent ? 'font-semibold text-white' : isCompleted ? 'text-slate-300' : 'text-slate-300'}`}>{level.title}</p>
                      <p className="num mt-0.5 text-[12px] text-slate-500">{t('shell.careerPage.salary_and_exp', { salary: formatMoney(level.baseSalary), months: level.experienceRequired })}</p>
                    </div>
                    {isCurrent && <span className="ds-badge ds-badge--low shrink-0">{t('ui.career.current')}</span>}
                    {isNext && <span className="ds-badge ds-badge--neutral shrink-0">{t('ui.career.next')}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </motion.section>

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        ariaLabel={t('shell.careerPage.career_details')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full !max-w-2xl p-5 sm:p-7 overflow-y-auto"
      >
        <CareerTab
          gameState={gameState}
          careerPath={careerPath}
          cashFlow={cashFlow}
          formatMoney={formatMoney}
          aiImpact={aiImpact}
          isProcessing={isProcessing}
          onPromote={onPromote}
          onOpenSideHustles={() => onNavigate('/life', 'sidehustles')}
        />
      </Modal>
    </motion.div>
  );
};

const CareerPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="t-title-2">{t('shell.careerPage.career')}</h2>
        <p className="mt-2 text-sm text-slate-400">{t('shell.careerPage.career_progression_salary_growth_and')}
        </p>
      </section>
    </div>
  );
};

export default CareerPage;
