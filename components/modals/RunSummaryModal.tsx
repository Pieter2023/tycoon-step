import React from 'react';
import Modal from '../Modal';
import ChallengeShareCard from '../ChallengeShareCard';
import { GameState } from '../../types';
import { SheetItem, SheetStagger } from './sheet';

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
    overlayClassName="bg-black/75"
    contentClassName="max-w-3xl!"
  >
    <SheetStagger className="px-5 pb-6 pt-7 sm:px-7" gap={0.07}>
      <SheetItem className="mx-auto mb-5 max-w-xl px-8 text-center">
        <h2 className="t-title-1 text-white text-balance">
          {gameState.hasWon ? 'Financial freedom — pass it on' : gameState.isBankrupt ? 'The damage report' : 'Your run so far'}
        </h2>
        <p className="mt-1.5 text-[15px] leading-snug text-slate-400">
          {gameState.hasWon
            ? 'Send this to someone who needs it — most people never see what the path looks like.'
            : 'Download or share your story.'}
        </p>
      </SheetItem>
      <SheetItem>
        <ChallengeShareCard
          gameState={gameState}
          netWorth={netWorth}
          onClose={onClose}
        />
      </SheetItem>
    </SheetStagger>
  </Modal>
);

export default RunSummaryModal;
