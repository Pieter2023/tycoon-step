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
            {/* Warning Banner */}
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 mb-6">
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
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 mb-6">
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
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-blue-500 transition-all" style={{ 
                    width: `${100 - (gameState.education.currentlyEnrolled.monthsRemaining / (EDUCATION_OPTIONS.find(e => e.id === gameState.education.currentlyEnrolled?.educationId)?.duration || 1)) * 100}%` 
                  }} />
                </div>
              </div>
            )}
            
            {/* Completed Degrees */}
            {gameState.education.degrees.length > 0 && (
              <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-emerald-400 mb-2">🎓 Completed Degrees</h4>
                <div className="flex flex-wrap gap-2">
                  {gameState.education.degrees.map(degId => {
                    const deg = EDUCATION_OPTIONS.find(e => e.id === degId);
                    const isRelevant = deg?.relevantCareers.includes(careerPath);
                    return (
                      <span key={degId} className={`px-3 py-1 rounded-full text-sm ${
                        isRelevant ? 'bg-emerald-600/30 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
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
                  <div key={edu.id} className={`rounded-xl p-4 border transition-all ${
                    alreadyHave ? 'bg-slate-800/30 border-slate-700 opacity-60' :
                    !hasPrerequisites ? 'bg-slate-800/30 border-slate-700 opacity-60' :
                    isRelevant ? 'bg-emerald-900/10 border-emerald-700/50 hover:border-emerald-600/50' : 
                    'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{edu.icon}</span>
                        <div>
                          <h4 className="text-white font-bold">{edu.name}</h4>
                          <p className="text-slate-400 text-xs">{edu.category} • {edu.duration} months</p>
                        </div>
                      </div>
                      {alreadyHave ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">✓ Completed</span>
                      ) : isRelevant ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">✓ Relevant</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">✗ Not Relevant</span>
                      )}
                    </div>
                    
                    <p className="text-slate-400 text-xs mb-2">{edu.description}</p>
                    
                    {edu.requirements && (
                      <p className={`text-xs mb-2 ${hasPrerequisites ? 'text-emerald-400' : 'text-red-400'}`}>
                        Requires: {edu.requirements.join(' or ')} degree {hasPrerequisites ? '✓' : '✗'}
                      </p>
                    )}
                    
                    <div className="flex justify-between text-xs mb-3">
                      <span className="text-slate-500">Cost: {formatMoney(edu.cost)} ({formatMoney(deposit)} deposit)</span>
                      <span className={isRelevant ? 'text-emerald-400' : 'text-slate-500'}>
                        Salary Boost: {isRelevant ? `+${((edu.salaryBoost - 1) * 100).toFixed(0)}%` : 'None'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-900/40 rounded-lg p-2">
                        <p className="text-slate-500">Time</p>
                        <p className="text-white font-semibold">{edu.duration} mo</p>
                      </div>
                      <div className="bg-slate-900/40 rounded-lg p-2">
                        <p className="text-slate-500">Salary delta</p>
                        <p className={isRelevant ? 'text-emerald-400 font-semibold' : 'text-slate-500 font-semibold'}>
                          {isRelevant ? `+${formatMoney(salaryDelta)}/mo` : '—'}
                        </p>
                      </div>
                      <div className="bg-slate-900/40 rounded-lg p-2 col-span-2">
                        <p className="text-slate-500">Est. payback</p>
                        <p className={isRelevant && paybackMonths ? 'text-emerald-300 font-semibold' : 'text-slate-500 font-semibold'}>
                          {isRelevant && paybackMonths ? `${paybackMonths} months` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <button onClick={() => handleEnrollEducation(edu)} 
                      disabled={alreadyHave || isEnrolled || !canAfford || !hasPrerequisites}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                        alreadyHave ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 
                        !hasPrerequisites ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
                        isEnrolled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 
                        !canAfford ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
                        isRelevant ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 
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
