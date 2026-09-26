import { useI18n } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Check, Clock, GraduationCap, HeartPulse, Sparkles, Users, Zap } from 'lucide-react';
import Modal from '../Modal';
import SelfLearnTab from '../tabs/SelfLearnTab';
import EducationTab from '../tabs/EducationTab';
import { CAREER_PATHS, EDUCATION_OPTIONS } from '../../constants';
import { CareerPath, GameState } from '../../types';
import ActivityRing from '../ui/ActivityRing';
import { MOTION_DISABLED, riseIn, stagger } from '../ui/motion';

type LearnPageLayoutProps = {
  gameState: GameState;
  careerPath: CareerPath;
  formatMoney: (value: number) => string;
  handleEnrollEducation: (education: any) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
};

// Cover art for the featured course card (the same illustrations the courses use inside).
const COURSE_ART: Record<'sales' | 'eq' | 'negotiations', string> = {
  sales: '/images/sales-accelerator/cover.webp',
  eq: '/eq-images/4_sparkly_kitchen_appreciation.webp',
  negotiations: '/event-images/salary_negotiation.webp'
};

type MedalTone = 'orange' | 'green' | 'pink' | 'blue';

const MEDAL_FILL: Record<MedalTone, string> = {
  orange: 'from-orange-400 to-amber-500 shadow-[0_10px_24px_-10px_rgb(255_159_10/0.8)]',
  green: 'from-emerald-400 to-teal-500 shadow-[0_10px_24px_-10px_rgb(48_209_88/0.8)]',
  pink: 'from-pink-400 to-rose-500 shadow-[0_10px_24px_-10px_rgb(255_55_95/0.8)]',
  blue: 'from-sky-400 to-blue-500 shadow-[0_10px_24px_-10px_rgb(10_132_255/0.8)]'
};

const enter = MOTION_DISABLED ? {} : { initial: 'hidden', animate: 'show' };

export const LearnPageLayout: React.FC<LearnPageLayoutProps> = ({
  gameState,
  careerPath,
  formatMoney,
  handleEnrollEducation,
  coachLifestyleGridRef,
  coachHighlight,
  setGameState
}) => {
  const { t } = useI18n();
  const [openDetail, setOpenDetail] = useState<'selflearn' | 'library' | null>(null);

  const featuredCourse = useMemo(() => {
    const courses = [
      { label: t('shell.learnPage.sales_training'), certified: !!gameState.salesAcceleratorCourse?.certified, art: COURSE_ART.sales },
      { label: t('shell.learnPage.upgrade_eq'), certified: !!gameState.eqCourse?.certified, art: COURSE_ART.eq },
      { label: t('shell.learnPage.master_negotiations'), certified: !!gameState.negotiationsCourse?.certified, art: COURSE_ART.negotiations }
    ];
    return courses.find((c) => !c.certified) || courses[0];
  }, [gameState.eqCourse?.certified, gameState.negotiationsCourse?.certified, gameState.salesAcceleratorCourse?.certified]);

  const featuredEducation = useMemo(() => {
    return EDUCATION_OPTIONS.find((edu) => edu.relevantCareers.includes(careerPath)) || EDUCATION_OPTIONS[0];
  }, [careerPath]);

  const rewards: Array<{ label: string; certified: boolean; tone: MedalTone; icon: React.ReactNode }> = [
    { label: t('shell.learnPage.sales_training'), certified: !!gameState.salesAcceleratorCourse?.certified, tone: 'orange', icon: <Zap size={24} strokeWidth={2.3} /> },
    { label: t('shell.learnPage.compound_interest'), certified: !!gameState.compoundInterestCourse?.certified, tone: 'green', icon: <Sparkles size={24} strokeWidth={2.3} /> },
    { label: t('shell.learnPage.upgrade_eq'), certified: !!gameState.eqCourse?.certified, tone: 'pink', icon: <HeartPulse size={24} strokeWidth={2.3} /> },
    { label: t('shell.learnPage.master_negotiations'), certified: !!gameState.negotiationsCourse?.certified, tone: 'blue', icon: <Users size={24} strokeWidth={2.3} /> }
  ];
  const certifiedCount = rewards.filter((r) => r.certified).length;

  return (
    <motion.div className="space-y-6" variants={stagger(0.05, 0.04)} {...enter}>
      <motion.header variants={riseIn}>
        <h2 className="sr-only">{t('shell.learnPage.learn')}</h2>
        <p className="max-w-2xl text-[15px] leading-relaxed text-slate-400">{t('shell.learnPage.build_certifications_and_education_perks')}</p>
      </motion.header>

      <section className="grid gap-4 md:grid-cols-2">
        <motion.button
          variants={riseIn}
          type="button"
          onClick={() => setOpenDetail('selflearn')}
          className="surface surface-interactive group flex flex-col overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
          aria-label={t('shell.learnPage.open_self_learn')}
        >
          <div className="relative aspect-[2.3/1] w-full overflow-hidden">
            <img
              src={featuredCourse.art}
              alt=""
              aria-hidden
              className="h-full w-full object-cover transition-transform duration-700 ease-spring group-hover:scale-[1.03]"
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000 40%, transparent)', maskImage: 'linear-gradient(to bottom, #000 40%, transparent)' }}
            />
            <span className="mat-popover absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white">
              <Sparkles size={13} className="text-amber-300" />{t('shell.learnPage.featured_course')}
            </span>
          </div>
          <div className="relative -mt-6 flex flex-1 flex-col p-5 pt-0">
            <p className="t-title-3 text-white">{featuredCourse.label}</p>
            <p className={`mt-1 inline-flex items-center gap-1.5 text-[13px] ${featuredCourse.certified ? 'text-emerald-300' : 'text-slate-400'}`}>
              {featuredCourse.certified && <Check size={14} strokeWidth={3} />}
              {featuredCourse.certified ? t('shell.learnPage.certified') : t('shell.learnPage.certification_available')}
            </p>
            <div className="mt-auto pt-4 text-[13px] font-semibold text-amber-300">{t('shell.learnPage.tap_to_open_self_learn')}</div>
          </div>
        </motion.button>

        <motion.button
          variants={riseIn}
          type="button"
          onClick={() => setOpenDetail('library')}
          className="surface surface-interactive group flex flex-col overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
          aria-label={t('shell.learnPage.open_library_programs')}
        >
          {/* No illustration for degrees: a lit field in the program's green with its emblem. */}
          <div
            className="relative flex aspect-[2.3/1] w-full items-center justify-center overflow-hidden"
            style={{
              background:
                'radial-gradient(90% 130% at 18% 0%, rgb(48 209 88 / 0.34), transparent 60%), radial-gradient(80% 120% at 100% 100%, rgb(100 210 255 / 0.24), transparent 62%), rgb(20 24 22)'
            }}
          >
            <span
              aria-hidden
              className="mt-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/[0.08] text-[34px] sm:h-20 sm:w-20 sm:rounded-[24px] sm:text-[44px] shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_18px_40px_-16px_rgb(0_0_0/0.9)] backdrop-blur-md transition-transform duration-700 ease-spring group-hover:scale-[1.05]"
            >
              {featuredEducation?.icon}
            </span>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgb(22_22_24)] via-transparent to-transparent" />
            <span className="mat-popover absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white">
              <GraduationCap size={13} className="text-emerald-300" />{t('shell.learnPage.featured_program')}
            </span>
          </div>
          <div className="relative -mt-6 flex flex-1 flex-col p-5 pt-0">
            <p className="t-title-3 text-white">{featuredEducation?.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip num !min-h-[24px] !px-2.5 !py-0.5 !text-[12px]">{formatMoney(featuredEducation?.cost || 0)}</span>
              {featuredEducation?.duration ? (
                <span className="chip num !min-h-[24px] !px-2.5 !py-0.5 !text-[12px]">
                  <Clock size={12} className="text-slate-400" />
                  {t('ui.career.monthsShort', { months: featuredEducation.duration })}
                </span>
              ) : null}
              <span className="chip !min-h-[24px] !px-2.5 !py-0.5 !text-[12px]">{CAREER_PATHS[careerPath]?.name}</span>
            </div>
            <div className="mt-auto pt-4 text-[13px] font-semibold text-emerald-300">{t('shell.learnPage.tap_to_view_programs')}</div>
          </div>
        </motion.button>
      </section>

      <motion.section variants={riseIn} className="surface p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="t-headline flex items-center gap-2 text-white">
            <Award size={18} className="text-emerald-300" />{t('shell.learnPage.rewards')}
          </h3>
          <span className="num text-[13px] text-slate-400">{t('ui.learn.certifiedCount', { count: certifiedCount, total: rewards.length })}</span>
        </div>
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ActivityRing
            progress={certifiedCount / rewards.length}
            size={112}
            stroke={12}
            colors={['#30d158', '#64d2ff']}
            ariaLabel={t('ui.learn.certifiedCount', { count: certifiedCount, total: rewards.length })}
          >
            <span className="num text-[28px] font-bold leading-none text-white">{certifiedCount}</span>
            <span className="num mt-0.5 text-[11px] text-slate-400">/ {rewards.length}</span>
          </ActivityRing>
          <div className="grid w-full flex-1 grid-cols-2 gap-2.5 md:grid-cols-4">
            {rewards.map((item) => (
              <div key={item.label} className="surface-inset flex flex-col items-center px-2 py-4 text-center">
                <span className="relative">
                  <span
                    aria-hidden
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                      item.certified
                        ? `bg-gradient-to-br text-white ${MEDAL_FILL[item.tone]} shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]`
                        : 'bg-white/[0.05] text-slate-500 shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.08)]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.certified && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-black ring-[2.5px] ring-[#202022]">
                      <Check size={11} strokeWidth={3.4} />
                    </span>
                  )}
                </span>
                <p className="mt-3 text-[13px] font-semibold leading-tight text-slate-100">{item.label}</p>
                <p className={`mt-1 text-[12px] ${item.certified ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {item.certified ? t('shell.learnPage.certified') : t('shell.learnPage.not_certified')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <Modal
        isOpen={openDetail === 'selflearn'}
        onClose={() => setOpenDetail(null)}
        ariaLabel={t('shell.learnPage.self_learn')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full !max-w-4xl p-5 sm:p-7 overflow-y-auto"
      >
        <SelfLearnTab
          gameState={gameState}
          setGameState={setGameState}
          formatMoney={formatMoney}
        />
      </Modal>

      <Modal
        isOpen={openDetail === 'library'}
        onClose={() => setOpenDetail(null)}
        ariaLabel={t('shell.learnPage.education_library')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full !max-w-4xl p-5 sm:p-7 overflow-y-auto"
      >
        <EducationTab
          gameState={gameState}
          careerPath={careerPath}
          formatMoney={formatMoney}
          handleEnrollEducation={handleEnrollEducation}
          coachLifestyleGridRef={coachLifestyleGridRef}
          coachHighlight={coachHighlight}
        />
      </Modal>
    </motion.div>
  );
};

const LearnPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <h2 className="t-title-2">{t('shell.learnPage.learn')}</h2>
        <p className="mt-2 text-sm text-slate-400">{t('shell.learnPage.certifications_quizzes_and_coaching_content')}
        </p>
      </section>
    </div>
  );
};

export default LearnPage;
