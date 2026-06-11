import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { GameState } from '../../types';
import { playClick } from '../../services/audioService';
import { formatCurrencyCompactValue } from '../../i18n';

const formatMoney = (val: number): string => formatCurrencyCompactValue(val);

// Game-over screen for normal (non-challenge) games. Blocking by design.
interface BankruptcyModalProps {
  gameState: GameState;
  onShare: () => void;
  onPlayAgain: () => void;
}

const BankruptcyModal: React.FC<BankruptcyModalProps> = ({ gameState, onShare, onPlayAgain }) => (
  <Modal
    isOpen={gameState.isBankrupt}
    onClose={() => undefined}
    ariaLabel="Bankruptcy"
    overlayClassName="bg-black/90"
    closeOnOverlayClick={false}
    closeOnEsc={false}
    showCloseButton={false}
    contentClassName="bg-transparent border-0 shadow-none max-w-md w-full"
  >
    <motion.div
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      className="bg-gradient-to-br from-red-900/50 to-slate-900/50 border border-red-500/50 rounded-2xl p-8 w-full text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-7xl mb-4"
      >💸</motion.div>
      <h2 className="text-4xl font-bold text-red-400 mb-2">BROKE!</h2>
      <p className="text-white mb-2">Your wallet has filed for emotional support.</p>
      <p className="text-slate-400 text-sm mb-4 italic">
        {Math.floor(gameState.month / 12) < 2
          ? "Speedrun bankruptcy! That's... actually impressive in a way? 😬"
          : Math.floor(gameState.month / 12) < 5
            ? "The bank called. They said 'LOL.' Then hung up. 📞"
            : "Your credit score is now a cautionary tale told to finance students. 📚"}
      </p>
      <div className="bg-black/30 rounded-xl p-4 mb-6 text-sm">
        <p className="text-slate-400 mb-2">📊 The Damage Report</p>
        <div className="grid grid-cols-2 gap-2">
          <div><p className="text-slate-400">Time Survived</p><p className="text-white font-bold">{Math.floor(gameState.month / 12)}y {gameState.month % 12}m</p></div>
          <div><p className="text-slate-400">Credit Rating</p><p className="text-red-400 font-bold">{gameState.creditRating || 'N/A'} 📉</p></div>
          <div><p className="text-slate-400">Missed Payments</p><p className="text-red-400 font-bold">{gameState.missedPayments || 0} 😅</p></div>
          <div><p className="text-slate-400">Final Debt</p><p className="text-red-400 font-bold">{formatMoney(gameState.liabilities.reduce((s, l) => s + l.balance, 0))}</p></div>
        </div>
      </div>
      <p className="text-yellow-400 text-sm mb-4">
        💡 Pro tip: Emergency funds are like umbrellas. You never need one until you REALLY need one.
      </p>
      <button
        onClick={() => { playClick(); onShare(); }}
        className="w-full py-3 mb-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all"
      >
        📤 Share the damage report
      </button>
      <button
        onClick={() => { playClick(); onPlayAgain(); }}
        className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all"
      >
        🎮 Redemption Arc Time
      </button>
    </motion.div>
  </Modal>
);

export default BankruptcyModal;
