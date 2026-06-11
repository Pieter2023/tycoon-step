import React from 'react';
import Modal from '../Modal';
import ChallengeShareCard from '../ChallengeShareCard';
import { GameState } from '../../types';

// Run summary card for normal games: win, bankruptcy, or anytime via menu.
interface RunSummaryModalProps {
  gameState: GameState;
  netWorth: number;
  onClose: () => void;
}

const RunSummaryModal: React.FC<RunSummaryModalProps> = ({ gameState, netWorth, onClose }) => (
  <Modal
    isOpen
    onClose={onClose}
    ariaLabel="Run summary"
    overlayClassName="bg-black/90"
    contentClassName="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full p-6"
  >
    <div className="text-center mb-4">
      <h2 className="text-2xl font-bold text-white">
        {gameState.hasWon ? 'Financial freedom — pass it on' : gameState.isBankrupt ? 'The damage report' : 'Your run so far'}
      </h2>
      <p className="text-slate-400 text-sm mt-1">
        {gameState.hasWon
          ? 'Send this to someone who needs it — most people never see what the path looks like.'
          : 'Download or share your story.'}
      </p>
    </div>
    <ChallengeShareCard
      gameState={gameState}
      netWorth={netWorth}
      onClose={onClose}
    />
  </Modal>
);

export default RunSummaryModal;
