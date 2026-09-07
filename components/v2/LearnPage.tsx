import { useI18n } from '../../i18n';
import React, { useMemo, useState } from 'react';
import { Award, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import Modal from '../Modal';
import SelfLearnTab from '../tabs/SelfLearnTab';
import EducationTab from '../tabs/EducationTab';
import { CAREER_PATHS, EDUCATION_OPTIONS } from '../../constants';
import { CareerPath, GameState } from '../../types';

type LearnPageLayoutProps = {
  gameState: GameState;
  careerPath: CareerPath;
  formatMoney: (value: number) => string;
  handleEnrollEducation: (education: any) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
};

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
      { label: t('shell.learnPage.sales_training'), certified: !!gameState.salesAcceleratorCourse?.certified },
      { label: t('shell.learnPage.upgrade_eq'), certified: !!gameState.eqCourse?.certified },
      { label: t('shell.learnPage.master_negotiations'), certified: !!gameState.negotiationsCourse?.certified }
    ];
    return courses.find((c) => !c.certified) || courses[0];
  }, [gameState.eqCourse?.certified, gameState.negotiationsCourse?.certified, gameState.salesAcceleratorCourse?.certified]);

  const featuredEducation = useMemo(() => {
    return EDUCATION_OPTIONS.find((edu) => edu.relevantCareers.includes(careerPath)) || EDUCATION_OPTIONS[0];
  }, [careerPath]);

  return (
    <div className="space-y-8">
      <section className="glass-panel p-6">
        <h2 className="text-2xl font-bold">{t('shell.learnPage.learn')}</h2>
        <p className="mt-2 text-sm text-slate-400">{t('shell.learnPage.build_certifications_and_education_perks')}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setOpenDetail('selflearn')}
          className="glass-panel p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/60 hover:shadow-[0_16px_40px_rgba(251,191,36,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
          aria-label={t('shell.learnPage.open_self_learn')}
        >
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles size={16} className="text-amber-300" />{t('shell.learnPage.featured_course')}
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{featuredCourse.label}</p>
          <p className="text-xs text-slate-400 mt-1">
            {featuredCourse.certified ? t('shell.learnPage.certified') : t('shell.learnPage.certification_available')}
          </p>
          <div className="mt-4 text-xs font-semibold text-amber-200/80">{t('shell.learnPage.tap_to_open_self_learn')}</div>
        </button>
        <button
          type="button"
          onClick={() => setOpenDetail('library')}
          className="glass-panel p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
          aria-label={t('shell.learnPage.open_library_programs')}
        >
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <GraduationCap size={16} className="text-emerald-300" />{t('shell.learnPage.featured_program')}
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{featuredEducation?.name}</p>
          <p className="text-xs text-slate-400 mt-1">
            {formatMoney(featuredEducation?.cost || 0)} • {CAREER_PATHS[careerPath]?.name}
          </p>
          <div className="mt-4 text-xs font-semibold text-emerald-200/80">{t('shell.learnPage.tap_to_view_programs')}</div>
        </button>
      </section>

      <section className="glass-panel p-6">
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
          <Award size={16} className="text-emerald-300" />{t('shell.learnPage.rewards')}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: t('shell.learnPage.sales_training'), certified: !!gameState.salesAcceleratorCourse?.certified },
            { label: t('shell.learnPage.compound_interest'), certified: !!gameState.compoundInterestCourse?.certified },
            { label: t('shell.learnPage.upgrade_eq'), certified: !!gameState.eqCourse?.certified },
            { label: t('shell.learnPage.master_negotiations'), certified: !!gameState.negotiationsCourse?.certified }
          ].map((item) => (
            <div key={item.label} className="glass-tile p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Award size={14} className="text-emerald-300" />
                {item.label}
              </div>
              <p className={`mt-2 text-xs ${item.certified ? 'text-emerald-300' : 'text-slate-500'}`}>
                {item.certified ? t('shell.learnPage.certified') : t('shell.learnPage.not_certified')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Modal
        isOpen={openDetail === 'selflearn'}
        onClose={() => setOpenDetail(null)}
        ariaLabel={t('shell.learnPage.self_learn')}
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-4xl rounded-none rounded-l-3xl p-6 overflow-y-auto"
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
        contentClassName="h-full max-w-4xl rounded-none rounded-l-3xl p-6 overflow-y-auto"
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
    </div>
  );
};

const LearnPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-bold">{t('shell.learnPage.learn')}</h2>
        <p className="mt-2 text-sm text-slate-400">{t('shell.learnPage.certifications_quizzes_and_coaching_content')}
        </p>
      </section>
    </div>
  );
};

export default LearnPage;
