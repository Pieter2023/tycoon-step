import React from 'react';
import { Trophy } from 'lucide-react';
import { GameState } from '../types';
import Modal from './Modal';
import { useI18n } from '../i18n';
import { FreedomTrackLog } from './FreedomTrack';
import { freedomTrack } from '../services/freedomTrack';
import { SheetItem, SheetStagger } from './modals/sheet';

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

// The list scrolls under a soft fade where it meets the header, not under a hard divider.
const SCROLL_FADE = 'linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 24px), transparent 100%)';

const QuestLog: React.FC<QuestLogProps> = ({ isOpen, onClose, gameState, onClaim, onClaimAll, isProcessing }) => {
  const { t } = useI18n();
  const view = freedomTrack(gameState);
  const readyCount = view.ready.length;
  const claimable = readyCount > 0 && !isProcessing;
  const share = view.total > 0 ? view.done / view.total : 0;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('track.title')}
      overlayClassName="bg-black/60"
      contentClassName="max-w-3xl! overflow-hidden"
    >
      <SheetStagger className="flex flex-col" gap={0.05}>
        <SheetItem className="px-5 pb-3 pt-6 sm:px-6">
          <div className="flex items-start gap-3.5 pr-10">
            <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-amber-400/[0.18] text-amber-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
              <Trophy size={22} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="t-title-2 text-white">{t('track.title')}</h2>
              <p className="num mt-0.5 text-[13px] leading-snug text-slate-400">{t('track.progress', { done: view.done, total: view.total })} · {t('track.subtitle')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="meter h-[6px] flex-1" aria-hidden>
              <div className="meter-fill bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${Math.round(share * 100)}%` }} />
            </div>
            <button
              onClick={onClaimAll}
              disabled={readyCount === 0 || !!isProcessing}
              className={`pressable shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold ${
                claimable
                  ? 'bg-emerald-400 text-[#03170a] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_8px_22px_-10px_rgb(48_209_88/0.65)] hover:bg-[#34e064]'
                  : 'cursor-not-allowed bg-[rgb(118_118_128/0.2)] text-slate-500'
              }`}
            >
              {t('quests.claimAll')}
            </button>
          </div>
        </SheetItem>
        <SheetItem>
          <div
            className="max-h-[70vh] overflow-y-auto overscroll-contain px-5 pb-6 pt-2 sm:px-6"
            style={{ WebkitMaskImage: SCROLL_FADE, maskImage: SCROLL_FADE }}
          >
            <FreedomTrackLog gameState={gameState} isProcessing={!!isProcessing} onClaimQuest={onClaim} />
          </div>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default QuestLog;
