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
  const [activeTab, setActiveTab] = useState<'selflearn' | 'library' | 'rewards'>('selflearn');
  const [openDetail, setOpenDetail] = useState<'selflearn' | 'library' | null>(null);

  const featuredCourse = useMemo(() => {
    const courses = [
      { label: 'Sales Training', certified: !!gameState.salesAcceleratorCourse?.certified },
      { label: 'Upgrade EQ', certified: !!gameState.eqCourse?.certified },
      { label: 'Master Negotiations', certified: !!gameState.negotiationsCourse?.certified }
    ];
    return courses.find((c) => !c.certified) || courses[0];
  }, [gameState.eqCourse?.certified, gameState.negotiationsCourse?.certified, gameState.salesAcceleratorCourse?.certified]);

  const featuredEducation = useMemo(() => {
    return EDUCATION_OPTIONS.find((edu) => edu.relevantCareers.includes(careerPath)) || EDUCATION_OPTIONS[0];
  }, [careerPath]);

  const tabButtonClass = (tab: string) =>
    `rounded-full px-4 py-2 text-xs font-semibold border transition ${
      activeTab === tab
        ? 'border-white bg-white text-slate-900'
        : 'border-slate-800 text-slate-200 hover:border-slate-600 hover:text-white'
    }`;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-2xl font-bold">Learn</h2>
        <p className="mt-2 text-sm text-slate-400">
          Build certifications and education perks to accelerate your career path.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles size={16} className="text-amber-300" />
            Featured Course
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{featuredCourse.label}</p>
          <p className="text-xs text-slate-400 mt-1">
            {featuredCourse.certified ? 'Certified' : 'Certification available'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('selflearn');
              setOpenDetail('selflearn');
            }}
            className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            Open self learn
          </button>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <GraduationCap size={16} className="text-emerald-300" />
            Featured Program
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{featuredEducation?.name}</p>
          <p className="text-xs text-slate-400 mt-1">
            {formatMoney(featuredEducation?.cost || 0)} • {CAREER_PATHS[careerPath]?.name}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('library');
              setOpenDetail('library');
            }}
            className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            View programs
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button type="button" className={tabButtonClass('selflearn')} onClick={() => setActiveTab('selflearn')}>
            Self Learn
          </button>
          <button type="button" className={tabButtonClass('library')} onClick={() => setActiveTab('library')}>
            Library
          </button>
          <button type="button" className={tabButtonClass('rewards')} onClick={() => setActiveTab('rewards')}>
            Rewards
          </button>
        </div>

        {activeTab === 'selflearn' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300 flex items-center justify-between">
            <span>Certifications, quizzes, and course progression.</span>
            <button
              type="button"
              onClick={() => setOpenDetail('selflearn')}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Open
            </button>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300 flex items-center justify-between">
            <span>Formal education programs and degrees.</span>
            <button
              type="button"
              onClick={() => setOpenDetail('library')}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Open library
            </button>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: 'Sales Training', certified: !!gameState.salesAcceleratorCourse?.certified },
              { label: 'Upgrade EQ', certified: !!gameState.eqCourse?.certified },
              { label: 'Master Negotiations', certified: !!gameState.negotiationsCourse?.certified }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Award size={14} className="text-emerald-300" />
                  {item.label}
                </div>
                <p className={`mt-2 text-xs ${item.certified ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {item.certified ? 'Certified' : 'Not certified'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={openDetail === 'selflearn'}
        onClose={() => setOpenDetail(null)}
        ariaLabel="Self Learn"
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
        ariaLabel="Education library"
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
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-bold">Learn</h2>
        <p className="mt-2 text-sm text-slate-400">
          Certifications, quizzes, and coaching content live under Self Learn.
        </p>
      </section>
    </div>
  );
};

export default LearnPage;
