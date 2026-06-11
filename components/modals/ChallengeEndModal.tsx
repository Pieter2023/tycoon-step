import React from 'react';
import Modal from '../Modal';
import ChallengeShareCard from '../ChallengeShareCard';
import DailyLeaderboard from '../DailyLeaderboard';
import { GameState } from '../../types';
import { getDailyStreak } from '../../services/dailyChallenge';

// Daily Challenge end screen (run complete or bust): share card + leaderboard.
// Blocking; the only exit is "back to menu" via the share card's close.
interface ChallengeEndModalProps {
  gameState: GameState;
  netWorth: number;
  onBackToMenu?: () => void;
}

const ChallengeEndModal: React.FC<ChallengeEndModalProps> = ({ gameState, netWorth, onBackToMenu }) => {
  const challenge = gameState.challenge;
  if (!challenge) return null;
  return (
    <Modal
      isOpen
      onClose={() => undefined}
      ariaLabel="Daily challenge complete"
      overlayClassName="bg-black/90"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full p-6"
    >
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">
          {gameState.isBankrupt ? 'Challenge over' : 'Challenge complete!'}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Daily Challenge · {challenge.id} — everyone plays the same world. Share your run:
        </p>
        {(() => {
          const streak = getDailyStreak();
          if (!streak || streak.streak < 2) return null;
          return (
            <p className="text-amber-300 text-sm font-bold mt-2">
              🔥 {streak.streak}-day streak{streak.best > streak.streak ? ` · best ${streak.best}` : ''} — come back tomorrow to keep it going!
            </p>
          );
        })()}
      </div>
      <ChallengeShareCard
        gameState={gameState}
        netWorth={netWorth}
        onClose={onBackToMenu}
      />
      <div className="mt-4 flex justify-center">
        <DailyLeaderboard gameState={gameState} netWorth={netWorth} />
      </div>
    </Modal>
  );
};

export default ChallengeEndModal;
