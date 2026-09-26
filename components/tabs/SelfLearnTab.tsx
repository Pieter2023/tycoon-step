import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, HeartPulse, Sparkles, Users, Zap } from 'lucide-react';
import { GameState } from '../../types';
import SalesCertificationPanel, { CourseMedallion, MedallionTone } from '../SalesCertificationPanel';
import CompoundInterestCoursePanel from '../CompoundInterestCoursePanel';
import UpgradeEQTab from '../UpgradeEQTab';
import MasterNegotiationsTab from '../MasterNegotiationsTab';
import { useI18n } from '../../i18n';
import { MOTION_DISABLED, springs } from '../ui/motion';

type SelfLearnTabProps = {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  formatMoney: (value: number) => string;
};

type SectionId = 'sales' | 'compound' | 'eq' | 'negotiations';

type CourseProgress = { certified?: boolean; bestScore?: number } | undefined;

const SelfLearnTab: React.FC<SelfLearnTabProps> = ({ gameState, setGameState, formatMoney }) => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<SectionId>('sales');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const sections: Array<{ id: SectionId; label: string; icon: React.ReactNode; tone: MedallionTone; course: CourseProgress }> = [
    { id: 'sales', label: t('selfLearn.salesTraining'), icon: <Zap size={19} strokeWidth={2.4} />, tone: 'orange', course: gameState.salesAcceleratorCourse },
    { id: 'compound', label: 'Compound Interest', icon: <Sparkles size={19} strokeWidth={2.4} />, tone: 'green', course: gameState.compoundInterestCourse },
    { id: 'eq', label: t('tabs.upgradeEq'), icon: <HeartPulse size={19} strokeWidth={2.4} />, tone: 'pink', course: gameState.eqCourse },
    { id: 'negotiations', label: t('tabs.negotiations'), icon: <Users size={19} strokeWidth={2.4} />, tone: 'blue', course: gameState.negotiationsCourse },
  ];

  // Arrow keys move between the course tiles, as in any tab list.
  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + sections.length) % sections.length;
    setActiveSection(sections[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center gap-3 pr-12">
        <CourseMedallion tone="purple">
          <BookOpen size={20} strokeWidth={2.3} />
        </CourseMedallion>
        <h2 className="t-title-2 text-white">{t('tabs.selfLearn')}</h2>
      </header>

      {/* The four courses as rich tiles; the selection glides between them. */}
      <div role="tablist" aria-label={t('tabs.selfLearn')} className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {sections.map((section, index) => {
          const selected = activeSection === section.id;
          const certified = !!section.course?.certified;
          return (
            <button
              key={section.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveSection(section.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`relative flex flex-col items-start rounded-[20px] p-3.5 text-left transition-[background-color,scale] duration-200 ease-out active:scale-[0.975] active:duration-75 ${
                selected ? '' : 'bg-white/[0.035] hover:bg-white/[0.06]'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="self-learn-selection"
                  transition={springs.glide}
                  aria-hidden
                  className="absolute inset-0 rounded-[20px] bg-white/[0.09] shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.16),0_14px_30px_-18px_rgb(0_0_0/0.9)]"
                />
              )}
              <span className="relative">
                <CourseMedallion tone={section.tone}>{section.icon}</CourseMedallion>
                {certified && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-black ring-[2.5px] ring-[#1d1d1f]">
                    <Check size={11} strokeWidth={3.4} />
                  </span>
                )}
              </span>
              <span className={`relative mt-3 text-[15px] font-semibold leading-tight ${selected ? 'text-white' : 'text-slate-200'}`}>{section.label}</span>
              <span className={`num relative mt-1 text-[12px] ${certified ? 'text-emerald-300' : 'text-slate-400'}`}>
                {certified ? t('shell.learnPage.certified') : t('shell.careerPage.best_score', { score: section.course?.bestScore ?? 0 })}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeSection}
        role="tabpanel"
        initial={MOTION_DISABLED ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="mt-6"
      >
        {activeSection === 'sales' && (
          <SalesCertificationPanel
            gameState={gameState}
            setGameState={setGameState}
            formatMoney={formatMoney}
          />
        )}

        {activeSection === 'compound' && (
          <CompoundInterestCoursePanel
            gameState={gameState}
            setGameState={setGameState}
            formatMoney={formatMoney}
          />
        )}

        {activeSection === 'eq' && (
          <UpgradeEQTab gameState={gameState} setGameState={setGameState} />
        )}

        {activeSection === 'negotiations' && (
          <MasterNegotiationsTab gameState={gameState} setGameState={setGameState} />
        )}
      </motion.div>
    </div>
  );
};

export default SelfLearnTab;
