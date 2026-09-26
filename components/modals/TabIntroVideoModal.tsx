import React from 'react';
import { Pause, Play } from 'lucide-react';
import Modal from '../Modal';
import { TabId } from '../../types';
import { SheetItem, SheetStagger, Switch } from './sheet';

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
    overlayClassName="bg-black/70 overflow-y-auto"
    overlayStyle={{
      paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
      paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
      paddingRight: 'calc(env(safe-area-inset-right) + 1rem)'
    }}
    contentClassName="max-w-4xl! overflow-y-auto overscroll-contain"
    contentStyle={{ maxHeight: 'calc(100dvh - 2rem)' }}
    closeOnOverlayClick
    closeOnEsc
  >
    {/* The title bar is translucent chrome: the content scrolls under it. */}
    <div className="mat-bar sticky top-0 z-[5] flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 pb-4 pr-16 pt-5 sm:px-6 sm:pr-16">
      <div className="min-w-0">
        <h2 className="t-title-2 flex items-center gap-2.5 text-white">
          {config.icon}
          {config.title}
        </h2>
        <p className="mt-1 text-[14px] leading-snug text-slate-400">
          {config.description}
        </p>
      </div>
      {config.duration && (
        <div className="num mt-1.5 shrink-0 rounded-full bg-[rgb(118_118_128/0.2)] px-2.5 py-1 text-[12px] font-medium text-slate-300">Duration {config.duration}</div>
      )}
    </div>

    <SheetStagger className="px-5 pb-6 pt-5 sm:px-6" gap={0.05}>
      <SheetItem>
        <div className="overflow-hidden rounded-[18px] bg-black shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] ring-1 ring-white/[0.08]">
          <div style={{ aspectRatio: '16 / 9' }} className="relative w-full">
            {/* Poster thumbnail (never steals input) */}
            {config.poster && !hasStarted && (
              <img
                src={config.poster}
                alt="Intro video thumbnail"
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                draggable={false}
              />
            )}

            <video
              ref={videoRef}
              poster={config.poster}
              className="h-full w-full bg-black object-contain"
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
      </SheetItem>

      {/* Always-visible playback controls */}
      <SheetItem className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlayback}
            className="pressable inline-flex items-center gap-2 rounded-full bg-[rgb(118_118_128/0.24)] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[rgb(118_118_128/0.36)]"
          >
            {isPlaying ? <Pause size={15} strokeWidth={2.6} className="fill-current" /> : <Play size={15} strokeWidth={2.6} className="fill-current" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="pressable rounded-full bg-[rgb(118_118_128/0.24)] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[rgb(118_118_128/0.36)]"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div className="text-[13px] text-slate-500">
          Tap Play — sound will turn on.
        </div>
      </SheetItem>

      {playbackError && (
        <SheetItem className="mt-3">
          <div className="rounded-[16px] bg-red-500/[0.1] p-3.5 ring-1 ring-inset ring-red-500/20">
            <p className="text-[14px] font-semibold text-red-200">Video couldn&apos;t start.</p>
            <p className="mt-1 break-words text-[13px] text-red-200/80">
              {playbackError}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="pressable rounded-full bg-red-500/[0.2] px-3.5 py-1.5 text-[13px] font-semibold text-red-100 hover:bg-red-500/[0.28]"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.open(config.src, '_blank', 'noopener,noreferrer');
                  } catch (e) {
                    console.warn('Failed to open video in new tab:', e);
                  }
                }}
                className="pressable rounded-full bg-[rgb(118_118_128/0.24)] px-3.5 py-1.5 text-[13px] font-semibold text-slate-200 hover:bg-[rgb(118_118_128/0.36)]"
              >
                Open video
              </button>
            </div>
          </div>
        </SheetItem>
      )}

      {(config.quickTips || config.transcript) && (
        <SheetItem className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="list-group p-4">
            <p className="mb-2 text-[15px] font-semibold text-white">Quick guide</p>
            <ul className="space-y-2 text-[14px] leading-snug text-slate-300">
              {(config.quickTips || []).map((tip, idx) => (
                <li key={`${config.title}-tip-${idx}`} className="flex gap-2.5">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="list-group p-4">
            <p className="mb-2 text-[15px] font-semibold text-white">Transcript</p>
            <div className="space-y-2 text-[14px] leading-[1.5] text-slate-400">
              {(config.transcript || []).map((line, idx) => (
                <p key={`${config.title}-transcript-${idx}`}>{line}</p>
              ))}
            </div>
          </div>
        </SheetItem>
      )}

      {/* Action buttons */}
      <SheetItem className="mt-5 flex flex-col gap-2.5">
        <label className="mb-1 flex cursor-pointer select-none items-center gap-2.5 text-[14px] text-slate-300">
          <Switch checked={dontShowAgain} onChange={(e) => onDontShowAgainChange(e.target.checked)} />
          <span>Don&apos;t show this video again</span>
        </label>

        <button type="button" onClick={onContinue} className="btn-primary min-h-[50px] w-full px-5 text-[16px]">
          {config.continueLabel || 'Continue'}
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onSkip} className="btn-secondary touch-target min-h-[46px] w-full px-4 text-[15px]">
            Skip video
          </button>
          <button type="button" onClick={onCloseRemember} className="btn-secondary touch-target min-h-[46px] w-full px-4 text-[15px]">
            Close
          </button>
        </div>
      </SheetItem>
    </SheetStagger>
  </Modal>
);

export default TabIntroVideoModal;
