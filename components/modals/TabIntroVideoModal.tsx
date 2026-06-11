import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import Modal from '../Modal';
import { TabId } from '../../types';

export type TabIntroVideoConfig = {
  storageKey: string;
  src: string;
  captionsSrc?: string;
  poster?: string;
  title: string;
  duration?: string;
  description: string;
  quickTips?: string[];
  transcript?: string[];
  icon?: React.ReactNode;
  continueLabel?: string;
  continueToTab?: TabId;
};

// First-visit tab intro video. Fully controlled: the video element state
// machine (mute/fullscreen/error juggling) still lives in App — consolidating
// it into a hook is the separate QW-3 refactor.
interface TabIntroVideoModalProps {
  config: TabIntroVideoConfig;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  isPlaying: boolean;
  hasStarted: boolean;
  playbackError: string | null;
  dontShowAgain: boolean;
  shouldPreload: boolean;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoEnded: () => void;
  onVideoError: () => void;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onRetry: () => void;
  onDontShowAgainChange: (checked: boolean) => void;
  onContinue: () => void;
  onSkip: () => void;
  onCloseRemember: () => void;
  onDismiss: () => void;
}

const TabIntroVideoModal: React.FC<TabIntroVideoModalProps> = ({
  config,
  videoRef,
  muted,
  isPlaying,
  hasStarted,
  playbackError,
  dontShowAgain,
  shouldPreload,
  onVideoPlay,
  onVideoPause,
  onVideoEnded,
  onVideoError,
  onTogglePlayback,
  onToggleMute,
  onRetry,
  onDontShowAgainChange,
  onContinue,
  onSkip,
  onCloseRemember,
  onDismiss
}) => (
  <Modal
    isOpen
    onClose={onDismiss}
    ariaLabel={`${config.title} intro video`}
    overlayClassName="bg-black/80 backdrop-blur-sm overflow-y-auto"
    overlayStyle={{
      paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
      paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
    }}
    contentClassName="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-y-auto"
    contentStyle={{ maxHeight: 'calc(100dvh - 2rem)' }}
    closeOnOverlayClick
    closeOnEsc
  >
    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-5 border-b border-slate-700/60 bg-slate-800/95 backdrop-blur">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {config.icon}
          {config.title}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {config.description}
        </p>
      </div>
      <div className="text-right">
        {config.duration && (
          <div className="text-xs text-slate-400">Duration {config.duration}</div>
        )}
      </div>
    </div>

    <div className="p-5">
      <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
        <div style={{ aspectRatio: '16 / 9' }} className="w-full relative">
          {/* Poster thumbnail (never steals input) */}
          {config.poster && !hasStarted && (
            <img
              src={config.poster}
              alt="Intro video thumbnail"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          )}

          <video
            ref={videoRef}
            poster={config.poster}
            className="w-full h-full object-contain bg-black"
            playsInline
            muted={muted}
            preload={shouldPreload ? 'metadata' : 'none'}
            controls
            onPlay={onVideoPlay}
            onPause={onVideoPause}
            onEnded={onVideoEnded}
            onError={onVideoError}
          >
            <source src={config.src} type="video/mp4" />
            {config.captionsSrc && (
              <track
                kind="subtitles"
                src={config.captionsSrc}
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>
        </div>
      </div>

      {/* Always-visible playback controls */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onTogglePlayback}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold flex items-center gap-2"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onToggleMute}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Tap Play — sound will turn on.
        </div>
      </div>

      {playbackError && (
        <div className="mt-3 rounded-xl border border-red-700/30 bg-red-950/30 p-3">
          <p className="text-red-200 font-semibold text-sm">Video couldn&apos;t start.</p>
          <p className="text-red-200/80 text-xs mt-1 break-words">
            {playbackError}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={onRetry}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/25 border border-red-500/30 text-red-100 text-xs font-semibold"
            >
              Try again
            </button>
            <button
              onClick={() => {
                try {
                  window.open(config.src, '_blank', 'noopener,noreferrer');
                } catch (e) {
                  console.warn('Failed to open video in new tab:', e);
                }
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold"
            >
              Open video
            </button>
          </div>
        </div>
      )}

      {(config.quickTips || config.transcript) && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <p className="text-sm font-semibold text-white mb-2">Quick guide</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {(config.quickTips || []).map((tip, idx) => (
                <li key={`${config.title}-tip-${idx}`} className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
            <p className="text-sm font-semibold text-white mb-2">Transcript</p>
            <div className="space-y-2 text-sm text-slate-300">
              {(config.transcript || []).map((line, idx) => (
                <p key={`${config.title}-transcript-${idx}`}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-5 flex flex-col gap-2">
        <label className="flex items-start gap-3 cursor-pointer select-none text-sm text-slate-300">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => onDontShowAgainChange(e.target.checked)}
            className="mt-1"
          />
          <span>Don&apos;t show this video again</span>
        </label>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onContinue}
          className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          {config.continueLabel || 'Continue'}
        </motion.button>

        <button
          onClick={onSkip}
          className="w-full px-5 py-3 rounded-xl bg-slate-900/40 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold touch-target"
        >
          Skip video
        </button>

        <button
          onClick={onCloseRemember}
          className="w-full px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold touch-target"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
);

export default TabIntroVideoModal;
