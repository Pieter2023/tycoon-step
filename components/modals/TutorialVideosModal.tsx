import React from 'react';
import { Play } from 'lucide-react';
import Modal from '../Modal';
import { TabId } from '../../types';
import { TabIntroVideoConfig } from './TabIntroVideoModal';

// Tutorial video library: lists every tab intro video so v2-shell players
// can reach them (the per-tab Watch buttons only exist in the legacy shell).
interface TutorialVideosModalProps {
  configs: Partial<Record<TabId, TabIntroVideoConfig>>;
  onWatch: (tabId: string) => void;
  onClose: () => void;
}

const TutorialVideosModal: React.FC<TutorialVideosModalProps> = ({ configs, onWatch, onClose }) => {
  const entries = Object.entries(configs).filter(([, cfg]) => !!cfg) as [string, TabIntroVideoConfig][];
  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel="Tutorial videos"
      closeOnOverlayClick
      closeOnEsc
      contentClassName="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full"
    >
      <h2 className="text-xl font-bold text-white mb-1">🎬 Tutorial videos</h2>
      <p className="text-slate-400 text-sm mb-4">
        Short guides for each part of the game — watch any of them anytime.
      </p>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {entries.map(([tabId, cfg]) => (
          <button
            key={tabId}
            onClick={() => onWatch(tabId)}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-600 p-3 text-left transition-all"
          >
            {cfg.poster ? (
              <img
                src={cfg.poster}
                alt={`${cfg.title} video thumbnail`}
                className="w-24 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                onError={(e) => {
                  // Missing poster file — hide the broken image, keep the row.
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-24 h-14 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center justify-center shrink-0">
                <Play size={16} className="text-slate-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{cfg.title}</p>
              <p className="text-xs text-slate-400 truncate">{cfg.description}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs text-slate-400">
              {cfg.duration && <span>{cfg.duration}</span>}
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-300">
                <Play size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default TutorialVideosModal;
