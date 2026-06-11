import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { GameState } from '../../types';
import { FINANCIAL_FREEDOM_TARGET_MULTIPLIER } from '../../constants';
import { playClick } from '../../services/audioService';
import { formatCurrencyCompactValue } from '../../i18n';

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
}) => (
  <Modal
    isOpen={gameState.hasWon}
    onClose={() => undefined}
    ariaLabel="Financial freedom achieved"
    overlayClassName="bg-black/80"
    closeOnOverlayClick={false}
    closeOnEsc={false}
    showCloseButton={false}
    contentClassName="bg-transparent border-0 shadow-none max-w-md w-full"
  >
    <motion.div
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      className="bg-gradient-to-br from-amber-900/50 to-amber-800/50 border border-amber-500/50 rounded-2xl p-8 w-full text-center"
    >
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity }}
        className="text-7xl mb-4">👑</motion.div>
      <h2 className="text-4xl font-bold text-amber-400 mb-2">Financial Freedom!</h2>
      <p className="text-white mb-2">Your passive income covers {Math.round(FINANCIAL_FREEDOM_TARGET_MULTIPLIER * 100)}% of your expenses!</p>
      <p className="text-amber-300/80 text-sm mb-6 italic">
        {Math.floor(gameState.month / 12) < 5
          ? "🚀 Speed run champion! Did you even sleep?"
          : Math.floor(gameState.month / 12) < 10
            ? "🎯 Impressive! You beat the system faster than most!"
            : Math.floor(gameState.month / 12) < 20
              ? "💪 Solid performance! Your future self is sending thank-you notes."
              : "🐢 Slow and steady wins the race! (The race was with a snail, but still!)"
        }
      </p>
      <div className="bg-black/30 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-slate-400">Time</p><p className="text-white font-bold">{Math.floor(gameState.month / 12)}y {gameState.month % 12}m</p></div>
        <div><p className="text-slate-400">Net Worth</p><p className="text-emerald-400 font-bold">{formatMoney(netWorth)}</p></div>
        <div><p className="text-slate-400">Passive Income</p><p className="text-amber-400 font-bold">{formatMoney(passiveIncome)}/mo</p></div>
        <div><p className="text-slate-400">Expenses</p><p className="text-white font-bold">{formatMoney(monthlyExpenses)}/mo</p></div>
      </div>
      <p className="text-slate-400 text-xs mb-4">🏆 Game Over - You escaped the rat race!</p>
      <button
        onClick={() => { playClick(); onShare(); }}
        className="w-full py-3 mb-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-all"
      >
        📤 Send this to someone who needs it
      </button>
      <button
        onClick={() => { playClick(); onPlayAgain(); }}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition-all"
      >
        🎮 Play Again
      </button>
    </motion.div>
  </Modal>
);

export default VictoryModal;
