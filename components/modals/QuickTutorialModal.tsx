import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import Modal from '../Modal';
import { SheetItem, SheetStagger, Switch } from './sheet';

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
      contentClassName="max-w-3xl!"
    >
      <SheetStagger className="flex flex-col gap-4 px-5 pb-5 pt-6 sm:px-6" gap={0.06}>
        <SheetItem className="pr-10">
          <h2 className="t-title-2 text-white">Quick Tutorial</h2>
        </SheetItem>
        <SheetItem>
          <div className="aspect-video overflow-hidden rounded-[18px] bg-black shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] ring-1 ring-white/[0.08]">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
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
        </SheetItem>
        <SheetItem className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-[14px] text-slate-300">
            <Switch checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            Do not show again
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={close}
              className="btn-secondary min-h-[44px] flex-1 px-5 text-[15px] sm:flex-none"
            >
              Close
            </button>
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
              className="btn-primary min-h-[44px] flex-1 px-6 text-[15px] sm:flex-none"
            >
              <Play size={15} strokeWidth={2.6} className="fill-current" aria-hidden />
              Play
            </button>
          </div>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default QuickTutorialModal;
