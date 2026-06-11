import React from 'react';
import Modal from '../Modal';
import { AUTO_INVEST_PRESETS, FINANCIAL_FREEDOM_TARGET_MULTIPLIER } from '../../constants';

// Step-through tips for new players. App owns the step counter and the
// dismissed/seen bookkeeping; the auto-invest step offers one-click presets.
export const TUTORIAL_TIPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to Tycoon!',
    message: `Your goal: Build enough passive income to cover ${Math.round(FINANCIAL_FREEDOM_TARGET_MULTIPLIER * 100)}% of your expenses. Click "Next Month" to advance time and watch your finances grow!`,
    highlight: 'next-month'
  },
  {
    id: 'overview',
    title: '💰 Track Your Progress',
    message: 'The Overview tab shows your net worth, cash flow, and important stats. Watch your passive income grow!',
    highlight: 'overview'
  },
  {
    id: 'invest',
    title: '📈 Invest to Build Wealth',
    message: 'Go to the Invest tab to buy stocks, real estate, and businesses. These generate passive income!',
    highlight: 'invest'
  },
  {
    id: 'auto-invest',
    title: '⚡ Auto-Invest',
    message: 'Auto-invest puts a percent of last month’s disposable income to work automatically. Choose a preset to enable it now (you can pause anytime).',
    highlight: 'invest'
  },
  {
    id: 'career',
    title: '💼 Career & Education',
    message: 'Boost your salary through education and side hustles. Higher income = more to invest!',
    highlight: 'career'
  },
  {
    id: 'lifestyle',
    title: '❤️ Watch Your Health!',
    message: 'Check the Lifestyle tab for health, stress, and energy. Low health can trigger expensive medical emergencies!',
    highlight: 'lifestyle'
  },
  {
    id: 'financial-iq',
    title: '🧠 Financial IQ',
    message: 'Increase Financial IQ by making smart investment decisions and surviving market events. Higher IQ = better negotiation outcomes!',
    highlight: 'stats'
  }
];

interface TutorialModalProps {
  step: number;
  onNext: () => void;
  onDismiss: () => void;
  onApplyAutoInvestPreset: (presetId: string) => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ step, onNext, onDismiss, onApplyAutoInvestPreset }) => {
  const tip = TUTORIAL_TIPS[step];
  if (!tip) return null;
  return (
    <Modal
      isOpen
      onClose={onDismiss}
      ariaLabel="Tutorial"
      overlayClassName="bg-black/60 items-end md:items-center"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="bg-gradient-to-br from-blue-900/90 to-slate-900/90 border border-blue-500/50 rounded-2xl p-6 max-w-md w-full backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{tip.title.split(' ')[0]}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">{tip.title.split(' ').slice(1).join(' ')}</h3>
          <p className="text-slate-300 text-sm mb-4">{tip.message}</p>
          {tip.id === 'auto-invest' && (
            <div className="grid gap-2 sm:grid-cols-3">
              {AUTO_INVEST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyAutoInvestPreset(preset.id)}
                  className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-100 hover:border-blue-400 hover:bg-blue-500/20"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1">
          {TUTORIAL_TIPS.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === step ? 'bg-blue-400' : 'bg-slate-600'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-all"
          >
            Skip Tutorial
          </button>
          <button
            onClick={() => {
              if (step < TUTORIAL_TIPS.length - 1) {
                onNext();
              } else {
                onDismiss();
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all"
          >
            {step < TUTORIAL_TIPS.length - 1 ? 'Next →' : 'Got it! 🎮'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TutorialModal;
