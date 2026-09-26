import React from 'react';
import { Play } from 'lucide-react';
import Modal from '../Modal';
import { TabId } from '../../types';
import { TabIntroVideoConfig } from './TabIntroVideoModal';
import { SheetItem, SheetStagger } from './sheet';

// Tutorial video library: lists every tab intro video so v2-shell players
// can reach them (the per-tab Watch buttons only exist in the legacy shell).
interface TutorialVideosModalProps {
  configs: Partial<Record<TabId, TabIntroVideoConfig>>;
  onWatch: (tabId: string) => void;
  onClose: () => void;
}

const SCROLL_FADE = 'linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 20px), transparent 100%)';

const TutorialVideosModal: React.FC<TutorialVideosModalProps> = ({ configs, onWatch, onClose }) => {
  const entries = Object.entries(configs).filter(([, cfg]) => !!cfg) as [string, TabIntroVideoConfig][];
  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Tutorial videos"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="max-w-2xl! overflow-hidden"
    >
      <SheetStagger className="flex flex-col" gap={0.05}>
        <SheetItem className="px-5 pb-3 pr-14 pt-6 sm:px-6">
          <h2 className="t-title-2 text-white">🎬 Tutorial videos</h2>
          <p className="mt-1 text-[15px] text-slate-400">
            Short guides for each part of the game — watch any of them anytime.
          </p>
        </SheetItem>
        <SheetItem>
          <div
            className="max-h-[60vh] overflow-y-auto overscroll-contain px-5 pb-6 pt-1 sm:px-6"
            style={{ WebkitMaskImage: SCROLL_FADE, maskImage: SCROLL_FADE }}
          >
            <div className="list-group">
              {entries.map(([tabId, cfg]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => onWatch(tabId)}
                  className="list-row group w-full gap-3.5 py-3 text-left"
                >
                  <span className="relative block h-[54px] w-24 shrink-0 overflow-hidden rounded-[10px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">
                    {cfg.poster ? (
                      <img
                        src={cfg.poster}
                        alt={`${cfg.title} video thumbnail`}
                        className="h-full w-full object-cover transition-[scale] duration-500 ease-spring group-hover:scale-[1.04]"
                        onError={(e) => {
                          // Missing poster file — hide the broken image, keep the row.
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Play size={16} className="text-slate-300" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">{cfg.title}</p>
                    <p className="truncate text-[13px] text-slate-400">{cfg.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 text-[13px] text-slate-500">
                    {cfg.duration && <span className="num">{cfg.duration}</span>}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/[0.16] text-emerald-300 transition-colors group-hover:bg-emerald-400/[0.26]">
                      <Play size={13} strokeWidth={2.6} className="ml-0.5 fill-current" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </SheetItem>
      </SheetStagger>
    </Modal>
  );
};

export default TutorialVideosModal;
