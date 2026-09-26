import React from 'react';
import Modal from '../Modal';
import ChallengeShareCard from '../ChallengeShareCard';
import DailyLeaderboard from '../DailyLeaderboard';
import { GameState } from '../../types';
import { getDailyStreak } from '../../services/dailyChallenge';
import { SheetItem, SheetStagger } from './sheet';

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
  const streak = getDailyStreak();
  return (
    <Modal
      isOpen
      onClose={() => undefined}
      ariaLabel="Daily challenge complete"
      overlayClassName="bg-black/80"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      contentClassName="max-w-3xl! overflow-hidden"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-56 ${
          gameState.isBankrupt
            ? 'bg-[radial-gradient(90%_80%_at_50%_0%,rgb(255_69_58/0.12),transparent_75%)]'
            : 'bg-[radial-gradient(90%_80%_at_50%_0%,rgb(191_90_242/0.16),rgb(48_209_88/0.06)_55%,transparent_80%)]'
        }`}
      />
      <SheetStagger className="relative px-5 pb-6 pt-7 sm:px-7" gap={0.07}>
        <SheetItem className="mb-5 text-center">
          <h2 className="t-title-1 text-white">
            {gameState.isBankrupt ? 'Challenge over' : 'Challenge complete!'}
          </h2>
          <p className="num mt-1.5 text-[15px] text-slate-400">
            Daily Challenge · {challenge.id} — everyone plays the same world. Share your run:
          </p>
          {streak && streak.streak >= 2 && (
            <p className="num mt-3 inline-flex items-center rounded-full bg-amber-400/[0.14] px-3 py-1 text-[14px] font-semibold text-amber-300">
              🔥 {streak.streak}-day streak{streak.best > streak.streak ? ` · best ${streak.best}` : ''} — come back tomorrow to keep it going!
            </p>
          )}
        </SheetItem>
        <SheetItem>
          <ChallengeShareCard
            gameState={gameState}
            netWorth={netWorth}
            onClose={onBackToMenu}
          />
        </SheetItem>
        <SheetItem className="mt-5 flex justify-center">
          <DailyLeaderboard gameState={gameState} netWorth={netWorth} />
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default ChallengeEndModal;
