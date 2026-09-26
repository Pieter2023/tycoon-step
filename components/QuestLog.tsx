import React from 'react';
import { Trophy } from 'lucide-react';
import { GameState } from '../types';
import Modal from './Modal';
import { useI18n } from '../i18n';
import { FreedomTrackLog } from './FreedomTrack';
import { freedomTrack } from '../services/freedomTrack';

// The goals log (Quick actions → Quests, the dashboard, the city's notice board). Since Phase 1 slice 5 it shows the
// one Freedom Track: four chapters, the character's story and the side goals (components/FreedomTrack.tsx).
type QuestLogProps = {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onClaim: (questId: string) => void;
  onClaimAll: () => void;
  isProcessing?: boolean;
};

const QuestLog: React.FC<QuestLogProps> = ({ isOpen, onClose, gameState, onClaim, onClaimAll, isProcessing }) => {
  const { t } = useI18n();
  const view = freedomTrack(gameState);
  const readyCount = view.ready.length;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('track.title')}
      overlayClassName="bg-black/70"
      contentClassName="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={20} />
          <div>
            <h2 className="text-white font-bold text-lg">{t('track.title')}</h2>
            <p className="text-slate-400 text-xs">{t('track.progress', { done: view.done, total: view.total })} · {t('track.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={onClaimAll}
          disabled={readyCount === 0 || !!isProcessing}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border transition ${
            readyCount === 0 || isProcessing
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30'
          }`}
        >
          {t('quests.claimAll')}
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-6">
        <FreedomTrackLog gameState={gameState} isProcessing={!!isProcessing} onClaimQuest={onClaim} />
      </div>
    </Modal>
  );
};

export default QuestLog;
