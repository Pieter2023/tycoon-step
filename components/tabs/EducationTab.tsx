import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Check, GraduationCap } from 'lucide-react';
import { CAREER_PATHS, EDUCATION_OPTIONS } from '../../constants';
import { calculateEffectiveMonthlySalary } from '../../services/gameLogic';
import { CareerPath, EducationOption } from '../../types';
import { MOTION_DISABLED, riseIn, stagger } from '../ui/motion';
import { useI18n } from '../../i18n';

type EducationTabProps = {
  gameState: any;
  careerPath: CareerPath;
  formatMoney: (value: number) => string;
  handleEnrollEducation: (education: EducationOption) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
};

const enter = MOTION_DISABLED ? {} : { initial: 'hidden', animate: 'show' };

const Stat: React.FC<{ label: string; children: React.ReactNode; caption?: React.ReactNode; tone?: 'green' | 'muted' | 'plain' }> = ({
  label,
  children,
  caption,
  tone = 'plain'
}) => (
  <div className="rounded-[14px] bg-white/[0.04] px-3 py-2.5">
    <p className="text-[12px] text-slate-500">{label}</p>
    <p className={`num mt-0.5 text-[15px] font-semibold ${tone === 'green' ? 'text-emerald-300' : tone === 'muted' ? 'text-slate-500' : 'text-white'}`}>{children}</p>
    {caption && <p className="num text-[11px] text-slate-500">{caption}</p>}
  </div>
);

const EducationTab: React.FC<EducationTabProps> = (props) => {
  const {
    gameState,
    careerPath,
    formatMoney,
    handleEnrollEducation,
    coachLifestyleGridRef,
    coachHighlight
  } = props;
  const { t } = useI18n();

  const enrolledProgram = EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center gap-3 pr-12">
        <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_20px_-8px_rgb(48_209_88/0.7)]">
          <GraduationCap size={21} strokeWidth={2.3} />
        </span>
        <div className="min-w-0">
          <h2 className="t-title-2 text-white">{t('shell.learnPage.education_library')}</h2>
          <p className="text-[13px] text-slate-400">{CAREER_PATHS[careerPath]?.name}</p>
        </div>
      </header>

      <div className="flex gap-3.5 rounded-[20px] bg-orange-500/[0.1] p-4">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400/20 text-orange-300">
          <AlertTriangle size={18} />
        </span>
        <div>
          <p className="t-headline text-orange-200">Education Relevance Warning</p>
          <p className="mt-1 text-[14px] leading-relaxed text-slate-300">
            Only education relevant to your career path (<strong className="font-semibold text-white">{CAREER_PATHS[careerPath]?.name}</strong>) will boost your salary.
            Irrelevant degrees are a waste of time and money!
          </p>
        </div>
      </div>

      {/* Currently Enrolled */}
      {gameState.education.currentlyEnrolled?.educationId && (
        <div className="surface-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-blue-500/15 text-[26px]">
                {enrolledProgram?.icon ?? <BookOpen size={20} className="text-sky-300" />}
              </span>
              <div className="min-w-0">
                <p className="eyebrow text-sky-300">📚 Currently Enrolled</p>
                <p className="t-headline truncate text-white">
                  {enrolledProgram?.name}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              {/* Show student loan info if exists */}
              {gameState.liabilities.find(l => l.name?.includes('Student Loan') && l.name?.includes(
                EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId)?.name || ''
              )) && (
                  <p className="num text-[13px] font-semibold text-orange-300">
                    Loan: {formatMoney(gameState.liabilities.find(l => l.name?.includes('Student Loan'))?.monthlyPayment || 0)}/mo
                  </p>
                )}
            </div>
          </div>
          <div className="meter mt-4 h-2" aria-hidden>
            <div className="meter-fill bg-gradient-to-r from-blue-500 to-sky-400" style={{
              width: `${100 - (gameState.education.currentlyEnrolled.monthsRemaining / (EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId)?.duration || 1)) * 100}%`
            }} />
          </div>
          <p className="num mt-2 text-[13px] text-slate-400">
            {gameState.education.currentlyEnrolled.monthsRemaining} months remaining
          </p>
        </div>
      )}

      {/* Completed Degrees */}
      {gameState.education.degrees.length > 0 && (
        <div>
          <h4 className="t-headline mb-2.5 text-white">🎓 Completed Degrees</h4>
          <div className="flex flex-wrap gap-2">
            {gameState.education.degrees.map(degId => {
              const deg = EDUCATION_OPTIONS.find(e => e.id === degId);
              const isRelevant = deg?.relevantCareers.includes(careerPath);
              return (
                <span key={degId} className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium ${isRelevant
                    ? 'bg-emerald-500/[0.14] text-emerald-200'
                    : 'bg-white/[0.06] text-slate-400'}`}>
                  <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[13px]">{deg?.icon}</span>
                  {deg?.name}
                  {isRelevant ? <Check size={14} strokeWidth={3} className="text-emerald-300" aria-label="✓" /> : '(not relevant)'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="t-title-3 mb-4 text-white">Available Programs</h3>
        <motion.div
          ref={coachLifestyleGridRef}
          variants={stagger(0.035)}
          {...enter}
          className={`grid grid-cols-1 gap-4 md:grid-cols-2 rounded-[22px] ${coachHighlight('lifestyle-grid')}`}
        >
          {EDUCATION_OPTIONS.map(edu => {
            const isRelevant = edu.relevantCareers.includes(careerPath);
            const alreadyHave = gameState.education.degrees.includes(edu.id);
            const isEnrolled = !!(gameState.education.currentlyEnrolled?.educationId);
            const isExpensive = edu.cost > 20000;
            const deposit = isExpensive ? Math.round(edu.cost * 0.1) : edu.cost;
            const canAfford = gameState.cash >= deposit;
            const currentSalary = calculateEffectiveMonthlySalary(gameState);
            const nextDegrees = alreadyHave ? gameState.education.degrees : [...gameState.education.degrees, edu.id];
            const boostedSalary = isRelevant
              ? calculateEffectiveMonthlySalary({
                  ...gameState,
                  education: {
                    ...gameState.education,
                    degrees: nextDegrees
                  }
                })
              : currentSalary;
            const salaryDelta = isRelevant ? Math.max(0, boostedSalary - currentSalary) : 0;
            const paybackMonths = salaryDelta > 0 ? Math.ceil(edu.cost / salaryDelta) : null;

            // Check prerequisites
            const hasPrerequisites = !edu.requirements || edu.requirements.some(req =>
              gameState.education.degrees.some(d => {
                const degree = EDUCATION_OPTIONS.find(e => e.id === d);
                return degree && degree.level === req;
              })
            );

            const blocked = alreadyHave || isEnrolled || !canAfford || !hasPrerequisites;

            return (
              <motion.div key={edu.id} variants={riseIn} className="flex">
              {/* The entrance animates this wrapper's opacity, so the dimmed states live on the card inside. */}
              <div
                className={`surface-card flex w-full flex-col p-5 transition-opacity ${alreadyHave ? 'opacity-60' :
                  !hasPrerequisites ? 'opacity-60' :
                    isRelevant ? 'border-emerald-400/30 shadow-[0_18px_40px_-26px_rgb(48_209_88/0.6)]' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[26px] ${isRelevant ? 'bg-emerald-500/[0.14]' : 'bg-white/[0.06]'}`}>
                      {edu.icon}
                    </span>
                    <div className="min-w-0">
                      <h4 className="t-headline break-words text-white">{edu.name}</h4>
                      <p className="num mt-0.5 text-[12px] text-slate-400">
                        {edu.category} • {edu.duration} months
                      </p>
                    </div>
                  </div>
                  {alreadyHave ? (
                    <span className="ds-badge ds-badge--low shrink-0">✓ Completed</span>
                  ) : isRelevant ? (
                    <span className="ds-badge ds-badge--low shrink-0">✓ Relevant</span>
                  ) : (
                    <span className="ds-badge ds-badge--high shrink-0">✗ Not Relevant</span>
                  )}
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-slate-300">{edu.description}</p>

                {edu.requirements && (
                  <p className={`mt-2 text-[12px] font-medium ${hasPrerequisites ? 'text-emerald-300' : 'text-rose-300'}`}>
                    Requires: {edu.requirements.join(' or ')} degree {hasPrerequisites ? '✓' : '✗'}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Stat label="Cost" caption={`(${formatMoney(deposit)} down)`}>{formatMoney(edu.cost)}</Stat>
                  <Stat label="Boost" tone={isRelevant ? 'green' : 'muted'}>
                    {isRelevant ? `+${((edu.salaryBoost - 1) * 100).toFixed(0)}%` : 'None'}
                  </Stat>
                  <Stat label="Salary delta" tone={isRelevant ? 'green' : 'muted'}>
                    {isRelevant ? `+${formatMoney(salaryDelta)}/mo` : '—'}
                  </Stat>
                  <Stat label="Est. payback" tone={isRelevant && paybackMonths ? 'green' : 'muted'}>
                    {isRelevant && paybackMonths ? `${paybackMonths} months` : 'N/A'}
                  </Stat>
                </div>

                <div className="mt-auto pt-4">
                  <button onClick={() => handleEnrollEducation(edu)}
                    disabled={alreadyHave || isEnrolled || !canAfford || !hasPrerequisites}
                    className={`w-full ds-button--md ${blocked ? 'btn-secondary' :
                      isRelevant ? 'btn-primary' :
                        'ds-button rounded-full bg-orange-500/[0.14] text-orange-300 hover:bg-orange-500/[0.22]'}`}>
                    {alreadyHave ? '✓ Completed' :
                      !hasPrerequisites ? `Need ${edu.requirements?.join(' or ')} first` :
                        isEnrolled ? 'Already Enrolled' :
                          !canAfford ? `Need ${formatMoney(deposit)} deposit` :
                            isRelevant ? 'Enroll Now' : '⚠️ Enroll (Not Recommended)'}
                  </button>
                </div>
              </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default EducationTab;
