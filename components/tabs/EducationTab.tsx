import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CAREER_PATHS, EDUCATION_OPTIONS } from '../../constants';
import { CareerPath, EducationOption } from '../../types';

type EducationTabProps = {
  gameState: any;
  careerPath: CareerPath;
  formatMoney: (value: number) => string;
  handleEnrollEducation: (education: EducationOption) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
};

const EducationTab: React.FC<EducationTabProps> = (props) => {
  const {
    gameState,
    careerPath,
    formatMoney,
    handleEnrollEducation,
    coachLifestyleGridRef,
    coachHighlight
  } = props;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-amber-900/10 border border-amber-700/30 glass-tile p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="text-amber-400" size={18} />
          <span className="font-bold text-amber-400">Education Relevance Warning</span>
        </div>
        <p className="text-slate-300 text-sm">
          Only education relevant to your career path (<strong>{CAREER_PATHS[careerPath]?.name}</strong>) will boost your salary.
          Irrelevant degrees are a waste of time and money!
        </p>
      </div>

      {/* Currently Enrolled */}
      {gameState.education.currentlyEnrolled?.educationId && (
        <div className="bg-blue-900/10 border border-blue-700/30 glass-tile p-4 mb-6">
          <h4 className="font-bold text-blue-400 mb-2">📚 Currently Enrolled</h4>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-medium">
                {EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId)?.name}
              </p>
              <p className="text-slate-400 text-sm">
                {gameState.education.currentlyEnrolled.monthsRemaining} months remaining
              </p>
            </div>
            <div className="text-right">
              {/* Show student loan info if exists */}
              {gameState.liabilities.find(l => l.name?.includes('Student Loan') && l.name?.includes(
                EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId)?.name || ''
              )) && (
                  <p className="text-amber-400 text-sm">
                    Loan: {formatMoney(gameState.liabilities.find(l => l.name?.includes('Student Loan'))?.monthlyPayment || 0)}/mo
                  </p>
                )}
            </div>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{
              width: `${100 - (gameState.education.currentlyEnrolled.monthsRemaining / (EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId)?.duration || 1)) * 100}%`
            }} />
          </div>
        </div>
      )}

      {/* Completed Degrees */}
      {gameState.education.degrees.length > 0 && (
        <div className="bg-emerald-900/10 border border-emerald-700/30 glass-tile p-4 mb-6">
          <h4 className="font-bold text-emerald-400 mb-2">🎓 Completed Degrees</h4>
          <div className="flex flex-wrap gap-2">
            {gameState.education.degrees.map(degId => {
              const deg = EDUCATION_OPTIONS.find(e => e.id === degId);
              const isRelevant = deg?.relevantCareers.includes(careerPath);
              return (
                <span key={degId} className={`px-3 py-1 rounded-full text-sm font-medium border ${isRelevant
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-slate-700/50 text-slate-400 border-slate-600/50'}`}>
                  {deg?.icon} {deg?.name} {isRelevant ? '✓' : '(not relevant)'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold text-white mb-4">Available Programs</h3>
      <div
        ref={coachLifestyleGridRef}
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${coachHighlight('lifestyle-grid')}`}
      >
        {EDUCATION_OPTIONS.map(edu => {
          const isRelevant = edu.relevantCareers.includes(careerPath);
          const alreadyHave = gameState.education.degrees.includes(edu.id);
          const isEnrolled = !!(gameState.education.currentlyEnrolled?.educationId);
          const isExpensive = edu.cost > 20000;
          const deposit = isExpensive ? Math.round(edu.cost * 0.1) : edu.cost;
          const canAfford = gameState.cash >= deposit;
          const baseSalary = gameState.career?.salary || gameState.playerJob?.salary || 0;
          const salaryDelta = isRelevant ? Math.round(baseSalary * (edu.salaryBoost - 1)) : 0;
          const paybackMonths = salaryDelta > 0 ? Math.ceil(edu.cost / salaryDelta) : null;

          // Check prerequisites
          const hasPrerequisites = !edu.requirements || edu.requirements.some(req =>
            gameState.education.degrees.some(d => {
              const degree = EDUCATION_OPTIONS.find(e => e.id === d);
              return degree && degree.level === req;
            })
          );

          return (
            <div key={edu.id} className={`glass-panel p-5 transition-all ${alreadyHave ? 'opacity-60 grayscale-[0.5]' :
                !hasPrerequisites ? 'opacity-60' :
                  isRelevant ? 'border-emerald-500/40 hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                    'hover:border-slate-500/50'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{edu.icon}</span>
                  <div>
                    <h4 className="text-white font-bold">{edu.name}</h4>
                    <p className="text-slate-400 text-xs">{edu.category} • {edu.duration} months</p>
                  </div>
                </div>
                {alreadyHave ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">✓ Completed</span>
                ) : isRelevant ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">✓ Relevant</span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold uppercase tracking-wider">✗ Not Relevant</span>
                )}
              </div>

              <p className="text-slate-300 text-xs mb-3 leading-relaxed">{edu.description}</p>

              {edu.requirements && (
                <p className={`text-xs mb-3 font-medium ${hasPrerequisites ? 'text-emerald-400' : 'text-red-400'}`}>
                  Requires: {edu.requirements.join(' or ')} degree {hasPrerequisites ? '✓' : '✗'}
                </p>
              )}

              <div className="flex justify-between text-xs mb-3 p-2 bg-black/20 rounded-lg">
                <span className="text-slate-400 font-medium">Cost: <span className="text-white">{formatMoney(edu.cost)}</span> <span className="text-slate-500">({formatMoney(deposit)} down)</span></span>
                <span className={isRelevant ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  Boost: {isRelevant ? `+${((edu.salaryBoost - 1) * 100).toFixed(0)}%` : 'None'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="glass-tile p-2">
                  <p className="text-slate-500 text-[10px] uppercase">Time</p>
                  <p className="text-white font-bold">{edu.duration} mo</p>
                </div>
                <div className="glass-tile p-2">
                  <p className="text-slate-500 text-[10px] uppercase">Salary delta</p>
                  <p className={isRelevant ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                    {isRelevant ? `+${formatMoney(salaryDelta)}/mo` : '—'}
                  </p>
                </div>
                <div className="glass-tile p-2 col-span-2">
                  <p className="text-slate-500 text-[10px] uppercase">Est. payback</p>
                  <p className={isRelevant && paybackMonths ? 'text-emerald-300 font-bold' : 'text-slate-500 font-bold'}>
                    {isRelevant && paybackMonths ? `${paybackMonths} months` : 'N/A'}
                  </p>
                </div>
              </div>

              <button onClick={() => handleEnrollEducation(edu)}
                disabled={alreadyHave || isEnrolled || !canAfford || !hasPrerequisites}
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg ${alreadyHave ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                    !hasPrerequisites ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                      isEnrolled ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                        !canAfford ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                          isRelevant ? 'bg-emerald-600 hover:bg-emerald-500 text-emerald-50 neon-outline-green hover:-translate-y-0.5' :
                            'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/50'}`}>
                {alreadyHave ? '✓ Completed' :
                  !hasPrerequisites ? `Need ${edu.requirements?.join(' or ')} first` :
                    isEnrolled ? 'Already Enrolled' :
                      !canAfford ? `Need ${formatMoney(deposit)} deposit` :
                        isRelevant ? 'Enroll Now' : '⚠️ Enroll (Not Recommended)'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EducationTab;
