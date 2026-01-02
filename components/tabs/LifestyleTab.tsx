import React from 'react';
import { motion } from 'framer-motion';
import { LIFESTYLE_OPTS } from '../../constants';
import { Lifestyle, TABS, TabId } from '../../types';

type LifestyleTabProps = {
  gameState: any;
  formatMoney: (value: number) => string;
  handleChangeLifestyle: (value: Lifestyle) => void;
  coachLifestyleGridRef: React.RefObject<HTMLDivElement>;
  coachHighlight: (target: string) => string;
  coachHint: any;
  activeTab: TabId;
  InfoTip: React.FC<{ id: string; text: string }>;
};

const LifestyleTab: React.FC<LifestyleTabProps> = (props) => {
  const {
    gameState,
    formatMoney,
    handleChangeLifestyle,
    coachLifestyleGridRef,
    coachHighlight,
    coachHint,
    activeTab,
    InfoTip
  } = props;

  return (
<div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">Choose Your Lifestyle</h2>
            <p className="text-slate-400 mb-6">Your lifestyle determines your monthly expenses and happiness.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(LIFESTYLE_OPTS) as [Lifestyle, typeof LIFESTYLE_OPTS[Lifestyle]][]).map(([key, opt]) => (
                <motion.div key={key} whileHover={{ scale: 1.02 }} 
                  onClick={() => handleChangeLifestyle(key)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    gameState.lifestyle === key 
                      ? 'bg-emerald-600/20 border-2 border-emerald-500' 
                      : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{opt.icon}</span>
                    <div>
                      <h3 className="text-white font-bold capitalize">{key.toLowerCase()}</h3>
                      <p className="text-slate-400 text-sm">{opt.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3 text-sm">
                    <span className="text-slate-400">Monthly Cost:</span>
                    <span className="text-white font-medium">{formatMoney(opt.cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Happiness:</span>
                    <span className={opt.happiness >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {opt.happiness >= 0 ? '+' : ''}{opt.happiness}
                    </span>
                  </div>
                  {gameState.lifestyle === key && (
                    <div className="mt-3 text-center">
                      <span className="px-3 py-1 bg-emerald-600/30 text-emerald-400 rounded-full text-sm">Current Lifestyle</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Stats Overview */}
            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Happiness',
                    value: gameState.stats.happiness,
                    color: 'emerald',
                    tipId: 'stat-happiness',
                    tipText:
                      'Happiness affects promotions: above ~50 increases promotion chance, below ~50 reduces it.',
                  },
                  {
                    label: 'Health',
                    value: gameState.stats.health,
                    color: 'red',
                    tipId: 'stat-health',
                    tipText:
                      'Health affects productivity: Health < 30 reduces Monthly Actions by 1. Low health also increases the chance of costly medical events.',
                  },
                  {
                    label: 'Energy',
                    value: gameState.stats.energy,
                    color: 'amber',
                    tipId: 'stat-energy',
                    tipText:
                      'Energy drives productivity: Energy < 35 reduces Monthly Actions by 1. Energy ≥ 70 and Stress ≤ 60 gives +1 Monthly Action.',
                  },
                  {
                    label: 'Stress',
                    value: gameState.stats.stress,
                    color: 'purple',
                    invert: true,
                    tipId: 'stat-stress',
                    tipText:
                      'Stress reduces promotions and productivity: above ~30 lowers promotion chance; Stress ≥ 85 reduces Monthly Actions by 1. High stress drains health over time.',
                  },
                  {
                    label: 'Networking',
                    value: gameState.stats.networking,
                    color: 'blue',
                    tipId: 'stat-networking',
                    tipText:
                      'Networking improves promotion odds. Networking actions raise this stat, helping you grow salary faster.',
                  },
                  {
                    label: 'Financial IQ',
                    value: gameState.stats.financialIQ,
                    color: 'cyan',
                    tipId: 'stat-financialiq',
                    tipText:
                      'Financial IQ boosts passive income (up to ~5%) and helps you make better investment decisions over time.',
                  },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                      <span>{stat.label}</span>
                      <InfoTip id={stat.tipId} text={stat.tipText} />
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-${stat.color}-500 transition-all`} 
                          style={{ width: `${stat.value}%` }} />
                      </div>
                      <span className="text-white text-sm font-medium w-8">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick feedback on impact */}
              <div className="mt-4 bg-slate-900/40 border border-slate-700/60 rounded-lg p-3">
                <p className="text-white text-sm font-semibold mb-1">How this impacts you</p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>
                    • Monthly Actions: <span className="text-white font-medium">{gameState.monthlyActionsMax}</span> (energy/health/stress thresholds apply)
                  </li>
                  <li>
                    • Promotion odds are driven by Networking + Happiness − Stress (higher stats = faster salary growth)
                  </li>
                  <li>
                    • Low Health / high Stress increases the chance of expensive medical events
                  </li>
                </ul>
              </div>
            </div>
          </div>
  );
};

export default LifestyleTab;
