import React from 'react';
import { AlertTriangle, Bot } from 'lucide-react';
import { CAREER_PATHS } from '../../constants';
import { getEducationSalaryMultiplier } from '../../services/gameLogic';

type CareerTabProps = {
  gameState: any;
  careerPath: string;
  cashFlow: any;
  formatMoney: (value: number) => string;
  aiImpact: any;
};

const CareerTab: React.FC<CareerTabProps> = (props) => {
  const {
    gameState,
    careerPath,
    cashFlow,
    formatMoney,
    aiImpact
  } = props;

  return (
<div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${gameState.character?.avatarColor || 'from-slate-500 to-slate-600'} flex items-center justify-center text-4xl`}>
                  {CAREER_PATHS[careerPath]?.icon || '💼'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{gameState.career?.title || 'Unemployed'}</h2>
                  <p className="text-emerald-400">{CAREER_PATHS[careerPath]?.name || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm">Monthly Salary</p>
                  <p className="text-3xl font-bold text-emerald-400">{formatMoney(cashFlow.salary)}</p>
                  {getEducationSalaryMultiplier(gameState) > 1 && (
                    <p className="text-blue-400 text-xs">+{((getEducationSalaryMultiplier(gameState) - 1) * 100).toFixed(0)}% from education</p>
                  )}
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-sm">Experience</p>
                  <p className="text-3xl font-bold text-white">
                    {gameState.career?.experience || 0}<span className="text-lg text-slate-400"> mo</span>
                  </p>
                </div>
              </div>

              {(gameState.jobLossMonthsRemaining ?? 0) > 0 && (
                <div className="p-4 rounded-xl mb-4 bg-amber-900/20 border border-amber-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span className="font-medium text-amber-300">Job loss shock</span>
                  </div>
                  <p className="text-sm text-slate-200">
                    Your salary is paused for <span className="font-semibold text-white">{gameState.jobLossMonthsRemaining}</span>{' '}
                    more month{gameState.jobLossMonthsRemaining === 1 ? '' : 's'}. Use your emergency fund, reduce expenses, and avoid taking on new debt.
                  </p>
                </div>
              )}
              
              {/* AI Risk Warning */}
              <div className={`p-4 rounded-xl mb-4 ${
                (CAREER_PATHS[careerPath]?.futureProofScore || 50) >= 80 ? 'bg-emerald-900/20 border border-emerald-700/50' : 
                (CAREER_PATHS[careerPath]?.futureProofScore || 50) >= 50 ? 'bg-amber-900/20 border border-amber-700/50' : 
                'bg-red-900/20 border border-red-700/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={16} />
                  <span className="font-medium">AI Future-Proof Score: {CAREER_PATHS[careerPath]?.futureProofScore || 50}%</span>
                </div>
                <p className="text-sm text-slate-300">{CAREER_PATHS[careerPath]?.specialMechanic || 'Work hard and advance!'}</p>
                {aiImpact && aiImpact.salaryImpact !== 1 && (
                  <p className="text-xs text-slate-400 mt-2">
                    AI impact on salary: {aiImpact.salaryImpact > 1 ? '+' : ''}{((aiImpact.salaryImpact - 1) * 100).toFixed(0)}%
                  </p>
                )}
              </div>
              
              {/* Next Promotion */}
              <div className="bg-slate-900/30 rounded-xl p-4">
                <h4 className="text-white font-medium mb-2">📈 Career Path</h4>
                {CAREER_PATHS[careerPath]?.levels.map((level, idx) => {
                  const isCurrentLevel = (gameState.career?.level || 1) === idx + 1;
                  const isCompleted = (gameState.career?.level || 1) > idx + 1;
                  
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg mb-1 ${isCurrentLevel ? 'bg-emerald-900/30' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isCompleted ? 'bg-emerald-500 text-white' : 
                        isCurrentLevel ? 'bg-emerald-600 text-white' : 
                        'bg-slate-700 text-slate-400'}`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${isCurrentLevel ? 'text-white font-medium' : 'text-slate-400'}`}>{level.title}</p>
                        <p className="text-xs text-slate-500">{formatMoney(level.baseSalary)}/mo • {level.experienceRequired} mo exp</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
  );
};

export default CareerTab;
