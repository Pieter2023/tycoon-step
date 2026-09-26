import React from 'react';
import Modal from '../Modal';
import { GameState } from '../../types';
import { playClick } from '../../services/audioService';
import { formatCurrencyCompactValue } from '../../i18n';
import { SheetEmblem, SheetItem, SheetStagger } from './sheet';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

// Game-over screen for normal (non-challenge) games. Blocking by design.
// Calm on purpose: no shaking or bouncing, a quiet red, and the way back in front.
interface BankruptcyModalProps {
  gameState: GameState;
  onShare: () => void;
  onPlayAgain: () => void;
}

const BankruptcyModal: React.FC<BankruptcyModalProps> = ({ gameState, onShare, onPlayAgain }) => {
  const years = Math.floor(gameState.month / 12);
  const stats: { label: string; value: React.ReactNode; tone: string }[] = [
    { label: 'Time Survived', value: `${years}y ${gameState.month % 12}m`, tone: 'text-white' },
    { label: 'Credit Rating', value: <>{gameState.creditRating || 'N/A'} 📉</>, tone: 'text-red-300' },
    { label: 'Missed Payments', value: <>{gameState.missedPayments || 0} 😅</>, tone: 'text-red-300' },
    { label: 'Final Debt', value: formatMoney(gameState.liabilities.reduce((s, l) => s + l.balance, 0)), tone: 'text-red-300' }
  ];
  return (
    <Modal
      isOpen={gameState.isBankrupt}
      onClose={() => undefined}
      ariaLabel="Bankruptcy"
      overlayClassName="bg-black/80"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="max-w-md overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(100%_90%_at_50%_0%,rgb(255_69_58/0.14),transparent_75%)]" />
      <SheetStagger className="relative px-6 pb-6 pt-8 text-center" gap={0.06} delay={0.12}>
        <SheetEmblem className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/[0.14] ring-1 ring-inset ring-red-400/20">
          <span className="text-[40px] leading-none" aria-hidden>💸</span>
        </SheetEmblem>

        <SheetItem className="mt-5">
          <h2 className="font-display text-[34px] font-bold leading-[1.1] tracking-[-0.025em] text-red-300">BROKE!</h2>
          <p className="mt-2 text-[15px] text-slate-200">Your wallet has filed for emotional support.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[14px] italic text-slate-400">
            {years < 2
              ? "Speedrun bankruptcy! That's... actually impressive in a way? 😬"
              : years < 5
                ? "The bank called. They said 'LOL.' Then hung up. 📞"
                : "Your credit score is now a cautionary tale told to finance students. 📚"}
          </p>
        </SheetItem>

        <SheetItem className="mt-5 text-left">
          <p className="eyebrow mb-2 px-1">📊 The Damage Report</p>
          <div className="list-group grid grid-cols-2">
            {stats.map((s, i) => (
              <div key={s.label} className={`p-3.5 ${i < 2 ? 'border-b border-white/[0.06]' : ''} ${i % 2 === 0 ? 'border-r border-white/[0.06]' : ''}`}>
                <p className="text-[12px] text-slate-400">{s.label}</p>
                <p className={`num mt-0.5 text-[18px] font-bold ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </SheetItem>

        <SheetItem className="mt-4">
          <p className="rounded-[14px] bg-yellow-400/[0.08] px-4 py-3 text-left text-[14px] leading-snug text-yellow-200">
            💡 Pro tip: Emergency funds are like umbrellas. You never need one until you REALLY need one.
          </p>
        </SheetItem>

        <SheetItem className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => { playClick(); onPlayAgain(); }}
            className="btn-primary min-h-[50px] w-full px-5 text-[16px]"
          >
            🎮 Redemption Arc Time
          </button>
          <button
            type="button"
            onClick={() => { playClick(); onShare(); }}
            className="btn-secondary min-h-[50px] w-full px-5 text-[16px]"
          >
            📤 Share the damage report
          </button>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default BankruptcyModal;
