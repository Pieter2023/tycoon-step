import React, { useRef, useState } from 'react';
import Modal from '../Modal';

export const QUICK_TUTORIAL_STORAGE_KEY = 'tycoon_quick_tutorial_seen_v1';
const QUICK_TUTORIAL_SRC = '/videos/quick-tutorial.mp4';

// Quick tutorial video. Owns the "do not show again" checkbox + video ref;
// the preference is persisted on close when the box is checked.
interface QuickTutorialModalProps {
  onClose: () => void;
}

const QuickTutorialModal: React.FC<QuickTutorialModalProps> = ({ onClose }) => {
  const [dontShow, setDontShow] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const close = () => {
    onClose();
    if (dontShow) {
      try {
        localStorage.setItem(QUICK_TUTORIAL_STORAGE_KEY, '1');
      } catch (e) {
        console.warn('Failed to save quick tutorial preference:', e);
      }
    }
  };

  return (
    <Modal
      isOpen
      onClose={close}
      ariaLabel="Quick Tutorial"
      overlayClassName="bg-black/70 items-center"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Quick Tutorial</h2>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-600 bg-slate-900"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            Do not show again
          </label>
        </div>
        <div className="rounded-xl border border-slate-700 bg-black/40 overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            preload="metadata"
            controls
            playsInline
            muted
            src={QUICK_TUTORIAL_SRC}
            onPlay={(e) => {
              const vid = e.currentTarget;
              if (vid.muted) vid.muted = false;
            }}
          >
            Your browser can’t play this video.
          </video>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              const vid = videoRef.current;
              if (!vid) return;
              vid.muted = false;
              vid.play().catch(() => {
                window.open(QUICK_TUTORIAL_SRC, '_blank', 'noopener,noreferrer');
              });
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            Play
          </button>
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickTutorialModal;
