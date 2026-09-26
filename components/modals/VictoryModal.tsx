import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import { ActivityRing, AnimatedNumber } from '../ui';
import { MOTION_DISABLED } from '../ui/motion';
import { GameState } from '../../types';
import { FINANCIAL_FREEDOM_TARGET_MULTIPLIER } from '../../constants';
import { playClick } from '../../services/audioService';
import { formatCurrencyCompactValue } from '../../i18n';
import { SheetEmblem, SheetItem, SheetStagger } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

// Win celebration for normal (non-challenge) games. Blocking by design — the
// run is over; the only ways out are sharing the run card or restarting.
interface VictoryModalProps {
  gameState: GameState;
  netWorth: number;
  passiveIncome: number;
  monthlyExpenses: number;
  onShare: () => void;
  onPlayAgain: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({
  gameState,
  netWorth,
  passiveIncome,
  monthlyExpenses,
  onShare,
  onPlayAgain
}) => {
  // The figures count up once the ring has closed (display only; the values come from App).
  const [counted, setCounted] = useState(MOTION_DISABLED);
  useEffect(() => {
    if (counted) return;
    const id = window.setTimeout(() => setCounted(true), 520);
    return () => window.clearTimeout(id);
  }, [counted]);
  const shown = (value: number) => (counted ? value : 0);
  const years = Math.floor(gameState.month / 12);

  return (
    <Modal
      isOpen={gameState.hasWon}
      onClose={() => undefined}
      ariaLabel="Financial freedom achieved"
      overlayClassName="bg-black/70"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="max-w-md overflow-hidden"
    >
      {/* Morning light: a gold wash behind the emblem. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(90%_80%_at_50%_0%,rgb(255_214_10/0.24),rgb(48_209_88/0.08)_55%,transparent_80%)]" />

      <SheetStagger className="relative px-6 pb-6 pt-8 text-center" gap={0.06} delay={0.28}>
        <SheetEmblem bouncy delay={0.08} className="mx-auto w-fit">
          <ActivityRing progress={1} size={132} stroke={12} colors={['#ffd60a', '#30d158']} ariaLabel="Financial freedom reached">
            <span className="text-[56px] leading-none" aria-hidden>👑</span>
          </ActivityRing>
        </SheetEmblem>

        <SheetItem className="mt-5">
          <h2 className="bg-gradient-to-b from-[#ffe58a] to-[#ffb340] bg-clip-text pb-0.5 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.025em] text-transparent">Financial Freedom!</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-snug text-slate-200">Your freedom income covers {Math.round(FINANCIAL_FREEDOM_TARGET_MULTIPLIER * 100)}% of your living costs, with investments counted at a safe 4% a year!</p>
          <p className="mx-auto mt-2 max-w-sm text-[14px] italic text-amber-200/80">
            {years < 5
              ? "🚀 Speed run champion! Did you even sleep?"
              : years < 10
                ? "🎯 Impressive! You beat the system faster than most!"
                : years < 20
                  ? "💪 Solid performance! Your future self is sending thank-you notes."
                  : "🐢 Slow and steady wins the race! (The race was with a snail, but still!)"
            }
          </p>
        </SheetItem>

        <SheetItem className="mt-5">
          <div className="grid grid-cols-2 overflow-hidden rounded-[18px] bg-white/[0.05] text-left ring-1 ring-inset ring-white/[0.06]">
            <div className="border-b border-r border-white/[0.06] p-3.5">
              <p className="text-[12px] text-slate-400">Time</p>
              <p className="num mt-0.5 text-[20px] font-bold text-white">{years}y {gameState.month % 12}m</p>
            </div>
            <div className="border-b border-white/[0.06] p-3.5">
              <p className="text-[12px] text-slate-400">Net Worth</p>
              <p className="mt-0.5 text-[20px] font-bold text-emerald-300"><AnimatedNumber value={shown(netWorth)} format={formatMoney} flash={false} /></p>
            </div>
            <div className="border-r border-white/[0.06] p-3.5">
              <p className="text-[12px] text-slate-400">Passive Income</p>
              <p className="mt-0.5 text-[20px] font-bold text-amber-300"><AnimatedNumber value={shown(passiveIncome)} format={formatMoney} flash={false} /><span className="text-[14px] font-semibold text-amber-300/70">/mo</span></p>
            </div>
            <div className="p-3.5">
              <p className="text-[12px] text-slate-400">Expenses</p>
              <p className="mt-0.5 text-[20px] font-bold text-white"><AnimatedNumber value={shown(monthlyExpenses)} format={formatMoney} flash={false} /><span className="text-[14px] font-semibold text-slate-400">/mo</span></p>
            </div>
          </div>
        </SheetItem>

        <SheetItem>
          <p className="mt-4 text-[13px] text-slate-400">🏆 Game Over - You escaped the rat race!</p>
        </SheetItem>

        <SheetItem className="mt-4 space-y-2.5">
          <button
            type="button"
            onClick={() => { playClick(); onShare(); }}
            className="btn-primary min-h-[50px] w-full px-5 text-[16px]"
          >
            📤 Send this to someone who needs it
          </button>
          <button
            type="button"
            onClick={() => { playClick(); onPlayAgain(); }}
            className="btn-secondary min-h-[50px] w-full px-5 text-[16px]"
          >
            🎮 Play Again
          </button>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default VictoryModal;
