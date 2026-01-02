import React, { useMemo, useState } from 'react';
import { Award, Bot, Briefcase, ChevronRight, Sparkles } from 'lucide-react';
import Modal from '../Modal';
import CareerTab from '../tabs/CareerTab';
import { CAREER_PATHS } from '../../constants';
import { GameState } from '../../types';

type CareerPageLayoutProps = {
  gameState: GameState;
  careerPath: string;
  cashFlow: any;
  formatMoney: (value: number) => string;
  aiImpact: any;
};

const buildSkillCard = (label: string, course?: { certified?: boolean; bestScore?: number; failedAttempts?: number }) => {
  const certified = !!course?.certified;
  const score = course?.bestScore ?? 0;
  const attempts = course?.failedAttempts ?? 0;
  return { label, certified, score, attempts };
};

export const CareerPageLayout: React.FC<CareerPageLayoutProps> = ({
  gameState,
  careerPath,
  cashFlow,
  formatMoney,
  aiImpact
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const career = gameState.career;
  const levels = CAREER_PATHS[careerPath]?.levels || [];
  const currentLevel = career?.level || 1;
  const nextLevel = levels[currentLevel] || null;

  const skills = useMemo(() => {
    return [
      buildSkillCard('EQ', gameState.eqCourse),
      buildSkillCard('Negotiation', gameState.negotiationsCourse),
      buildSkillCard('Sales', gameState.salesAcceleratorCourse)
    ];
  }, [gameState.eqCourse, gameState.negotiationsCourse, gameState.salesAcceleratorCourse]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-2xl`}>
              {CAREER_PATHS[careerPath]?.icon || '💼'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{career?.title || 'Unemployed'}</h2>
              <p className="text-sm text-emerald-300">{CAREER_PATHS[careerPath]?.name || 'Unknown Path'}</p>
              <p className="text-xs text-slate-400 mt-1">Monthly salary: {formatMoney(cashFlow.salary)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
          >
            View full career details
            <ChevronRight size={14} />
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-300" /> Career Summary
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-400">Current Level</p>
              <p className="text-lg font-semibold text-white">{career?.level || 1}</p>
              <p className="text-xs text-slate-500 mt-1">Experience: {career?.experience || 0} mo</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-400">Next Growth Option</p>
              {nextLevel ? (
                <>
                  <p className="text-sm font-semibold text-white">{nextLevel.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatMoney(nextLevel.baseSalary)}/mo • {nextLevel.experienceRequired} mo exp
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-300">Max level reached.</p>
              )}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-purple-300" />
              <p className="text-sm font-semibold text-white">AI Disruption Impact</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Disruption level: {(gameState.aiDisruption?.disruptionLevel || 0).toFixed(0)}% • Risk:{' '}
              {aiImpact?.automationRisk || 'LOW'}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-amber-300" /> Skills
          </h3>
          <div className="mt-4 space-y-3">
            {skills.map((skill) => (
              <div key={skill.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{skill.label}</p>
                  <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${skill.certified ? 'border-emerald-500/40 bg-emerald-600/20 text-emerald-200' : 'border-slate-700 text-slate-400'}`}>
                    <Award size={12} />
                    {skill.certified ? 'Certified' : 'Not certified'}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Best score: {skill.score}</p>
                {!skill.certified && <p className="text-[11px] text-slate-500 mt-1">Attempts: {skill.attempts}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold">Progression</h3>
        <div className="mt-4 space-y-2">
          {levels.map((level, idx) => {
            const isCurrent = currentLevel === idx + 1;
            const isCompleted = currentLevel > idx + 1;
            return (
              <div
                key={level.title}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  isCurrent ? 'border-emerald-500/40 bg-emerald-600/10' : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${isCurrent ? 'text-white font-semibold' : 'text-slate-300'}`}>{level.title}</p>
                  <p className="text-xs text-slate-500">{formatMoney(level.baseSalary)}/mo • {level.experienceRequired} mo exp</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        ariaLabel="Career details"
        overlayClassName="items-stretch justify-end"
        contentClassName="h-full max-w-2xl rounded-none rounded-l-3xl p-6 overflow-y-auto"
      >
        <CareerTab
          gameState={gameState}
          careerPath={careerPath}
          cashFlow={cashFlow}
          formatMoney={formatMoney}
          aiImpact={aiImpact}
        />
      </Modal>
    </div>
  );
};

const CareerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-bold">Career</h2>
        <p className="mt-2 text-sm text-slate-400">
          Career progression, salary growth, and AI disruption insights will be organized here.
        </p>
      </section>
    </div>
  );
};

export default CareerPage;
