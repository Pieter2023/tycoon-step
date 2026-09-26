import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { MOTION_DISABLED, springs } from '../ui/motion';
import { AUTO_INVEST_PRESETS, FINANCIAL_FREEDOM_TARGET_MULTIPLIER } from '../../constants';
import { useSheetReducedMotion } from './sheet';

// Step-through tips for new players. App owns the step counter and the
// dismissed/seen bookkeeping; the auto-invest step offers one-click presets.
export const TUTORIAL_TIPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to Tycoon!',
    message: `Your goal: build income you could live on for good until it covers ${Math.round(FINANCIAL_FREEDOM_TARGET_MULTIPLIER * 100)}% of your living costs. Investments count at a safe 4% of their value a year; businesses and rentals count what they pay. Click "Next Month" to advance time and watch your finances grow!`,
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

// A bottom sheet on phones (centred from md up). Each step's content slides in from the side it is
// heading to; the page dots stretch into a capsule for the current step.
const TutorialModal: React.FC<TutorialModalProps> = ({ step, onNext, onDismiss, onApplyAutoInvestPreset }) => {
  const reduce = useSheetReducedMotion();
  const tip = TUTORIAL_TIPS[step];
  if (!tip) return null;
  const Step = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;
  const stepMotion = MOTION_DISABLED
    ? {}
    : {
        initial: reduce ? { opacity: 0 } : { opacity: 0, x: 18 },
        animate: reduce ? { opacity: 1 } : { opacity: 1, x: 0 },
        transition: reduce ? { duration: 0.2 } : springs.smooth
      };
  const isLast = step >= TUTORIAL_TIPS.length - 1;
  return (
    <Modal
      isOpen
      onClose={onDismiss}
      ariaLabel="Tutorial"
      overlayClassName="bg-black/45 items-end md:items-center"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-md overflow-hidden"
      contentStyle={{ marginTop: 0, marginBottom: 0 }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(100%_90%_at_15%_0%,rgb(10_132_255/0.2),transparent_70%)]" />
      <div className="relative px-5 pb-5 pt-6 sm:px-6">
        <Step key={tip.id} {...stepMotion} className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4 sm:pr-8">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#0a84ff]/[0.18] text-[26px] shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] sm:h-14 sm:w-14 sm:rounded-[18px] sm:text-[30px]"
          >
            {tip.title.split(' ')[0]}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="t-headline text-[19px] text-white">{tip.title.split(' ').slice(1).join(' ')}</h3>
            <p className="mt-1.5 text-[15px] leading-[1.45] text-slate-300">{tip.message}</p>
            {tip.id === 'auto-invest' && (
              <div className="mt-3.5 grid gap-2 sm:grid-cols-3">
                {AUTO_INVEST_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onApplyAutoInvestPreset(preset.id)}
                    className="pressable rounded-full bg-[#0a84ff]/[0.16] px-3 py-2 text-[13px] font-semibold text-sky-200 hover:bg-[#0a84ff]/[0.26]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Step>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {TUTORIAL_TIPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-[7px] rounded-full transition-[width,background-color] duration-500 ease-spring ${
                  idx === step ? 'w-5 bg-[#0a84ff]' : idx < step ? 'w-[7px] bg-slate-400' : 'w-[7px] bg-slate-600'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onDismiss}
              className="pressable rounded-full px-3.5 py-2 text-[14px] font-medium text-slate-400 hover:text-white"
            >
              Skip Tutorial
            </button>
            <button
              type="button"
              onClick={() => {
                if (step < TUTORIAL_TIPS.length - 1) {
                  onNext();
                } else {
                  onDismiss();
                }
              }}
              className="pressable rounded-full bg-[#0a84ff] px-5 py-2 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_22px_-10px_rgb(10_132_255/0.7)] hover:bg-[#2b95ff]"
            >
              {!isLast ? 'Next →' : 'Got it! 🎮'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TutorialModal;
