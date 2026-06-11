import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TabId } from '../types';
import { TabIntroVideoConfig } from '../components/modals';

// QW-3: the tab intro-video state machine, consolidated from 8 loose useState
// hooks in App.tsx. Owns modal open/close, mute/playback/error state, the
// mobile fullscreen dance, and per-tab "minimized replay" panels. The modal
// UI itself is components/modals/TabIntroVideoModal.
export const useTabIntroVideo = (config: Partial<Record<TabId, TabIntroVideoConfig>>) => {
  const [tabId, setTabId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [autoplayOnOpen, setAutoplayOnOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [minimizedTabVideos, setMinimizedTabVideos] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeConfig = useMemo(() => {
    if (!tabId) return null;
    return config[tabId] || null;
  }, [config, tabId]);

  const markAsSeen = useCallback((seenTabId: string) => {
    const cfg = config[seenTabId];
    if (!cfg) return;
    try {
      localStorage.setItem(cfg.storageKey, '1');
    } catch (e) {
      console.warn('Failed to save intro video preference:', e);
    }
  }, [config]);

  const open = useCallback((nextTabId: string, opts?: { autoplay?: boolean }) => {
    const cfg = config[nextTabId];
    if (!cfg) return;

    setMuted(true);
    setIsPlaying(false);
    setHasStarted(false);
    setPlaybackError(null);
    setAutoplayOnOpen(!!opts?.autoplay);
    setDontShowAgain(false);

    // If the tab has a minimized "replay" panel showing, hide it while the modal is open.
    setMinimizedTabVideos((prev) => ({ ...prev, [nextTabId]: false }));

    setTabId(nextTabId);
  }, [config]);

  const close = useCallback((opts?: { remember?: boolean }) => {
    if (!tabId) return;

    const remember = opts?.remember !== undefined ? opts.remember : true;
    if (remember || dontShowAgain) markAsSeen(tabId);

    setAutoplayOnOpen(false);

    setTabId(null);

    const vid = videoRef.current;
    if (vid) {
      try {
        vid.pause();
        vid.currentTime = 0;
      } catch (e) {
        console.debug('Video pause/reset failed:', e);
      }
    }

    setIsPlaying(false);
    setHasStarted(false);
    setPlaybackError(null);
  }, [tabId, markAsSeen, dontShowAgain]);

  const requestPlayback = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;

    setPlaybackError(null);
    setHasStarted(true);

    try {
      // If we're paused because we've reached the end, restart before playing.
      const nearEnd = Number.isFinite(vid.duration) && vid.duration > 0
        ? vid.currentTime >= Math.max(0, vid.duration - 0.05)
        : false;

      if (vid.ended || nearEnd) {
        try {
          vid.currentTime = 0;
        } catch (e) {
          console.debug('Video currentTime reset failed:', e);
        }
      }

      // If the user clicks Play, automatically unmute (applies to all tab intro videos).
      try {
        vid.muted = false;
      } catch (e) {
        console.debug('Video unmute failed:', e);
      }
      setMuted(false);

      const p = vid.play();
      // Some browsers return undefined; some return a Promise
      if (p && typeof (p as Promise<void>).then === 'function') {
        await (p as Promise<void>);
      }
    } catch (err: any) {
      const name = err?.name ? String(err.name) : '';
      const msg = err?.message ? String(err.message) : '';
      const pretty = name && msg ? `${name}: ${msg}` : name || msg || 'Unable to start playback.';
      setPlaybackError(pretty);
      setIsPlaying(false);
    }
  }, []);

  const tryEnterFullscreen = useCallback((vid: HTMLVideoElement | null) => {
    if (!vid) return;
    try {
      // Only force fullscreen on small screens (mobile/tablet).
      const isSmall = typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 768px)').matches;

      if (!isSmall) return;

      // Avoid repeated fullscreen requests if already fullscreen.
      if (typeof document !== 'undefined' && (document as any).fullscreenElement) return;

      const anyVid = vid as any;

      // iOS Safari supports this on <video> elements.
      if (typeof anyVid.webkitEnterFullscreen === 'function') {
        anyVid.webkitEnterFullscreen();
        return;
      }

      // Standard Fullscreen API
      if (typeof vid.requestFullscreen === 'function') {
        const p = vid.requestFullscreen();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => {});
        }
        return;
      }

      // Older WebKit fallback
      if (typeof anyVid.webkitRequestFullscreen === 'function') {
        anyVid.webkitRequestFullscreen();
      }
    } catch (e) {
      console.debug('Fullscreen request failed:', e);
    }
  }, []);

  // When the user explicitly clicks "Watch Video", we attempt to autoplay
  // (this is considered a user gesture in most browsers).
  useEffect(() => {
    if (!tabId) return;
    if (!autoplayOnOpen) return;
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    const tryPlay = () => {
      if (cancelled) return;
      void requestPlayback();
      setAutoplayOnOpen(false);
    };

    // If the video is already ready, try immediately on next tick.
    if (vid.readyState >= 2) {
      const t = window.setTimeout(tryPlay, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }

    vid.addEventListener('canplay', tryPlay, { once: true });
    return () => {
      cancelled = true;
      vid.removeEventListener('canplay', tryPlay);
    };
  }, [autoplayOnOpen, tabId, requestPlayback]);

  const togglePlayback = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (vid.paused) {
        tryEnterFullscreen(vid);
        void requestPlayback();
      } else {
        vid.pause();
      }
    } catch (e) {
      console.debug('Video playback state toggle failed:', e);
    }
  }, [requestPlayback, tryEnterFullscreen]);

  // <video> element event handlers (passed to TabIntroVideoModal).
  const handleVideoPlay = useCallback(() => {
    // If the user presses Play (native controls or our button), unmute automatically.
    const vid = videoRef.current;
    if (vid) {
      try {
        vid.muted = false;
      } catch (e) {
        console.debug('Video unmute on play failed:', e);
      }
    }
    setMuted(false);

    // On mobile, automatically expand to fullscreen when playback starts.
    tryEnterFullscreen(videoRef.current);

    setIsPlaying(true);
    setHasStarted(true);
    setPlaybackError(null);
  }, [tryEnterFullscreen]);

  const handleVideoPause = useCallback(() => setIsPlaying(false), []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    if (tabId) {
      setMinimizedTabVideos((prev) => ({ ...prev, [tabId]: true }));
    }
    close({ remember: true });
  }, [tabId, close]);

  const handleVideoError = useCallback(() => {
    const vid = videoRef.current;
    const code = vid?.error?.code;
    const codeLabel = code === 1
      ? 'MEDIA_ERR_ABORTED'
      : code === 2
        ? 'MEDIA_ERR_NETWORK'
        : code === 3
          ? 'MEDIA_ERR_DECODE'
          : code === 4
            ? 'MEDIA_ERR_SRC_NOT_SUPPORTED'
            : code
              ? `MEDIA_ERR_${code}`
              : '';
    setPlaybackError(codeLabel ? `Video error: ${codeLabel}` : 'Video failed to load.');
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const vid = videoRef.current;
      if (vid) vid.muted = next;
      return next;
    });
  }, []);

  return {
    tabId,
    activeConfig,
    videoRef,
    muted,
    isPlaying,
    hasStarted,
    playbackError,
    dontShowAgain,
    setDontShowAgain,
    minimizedTabVideos,
    setMinimizedTabVideos,
    open,
    close,
    requestPlayback,
    togglePlayback,
    handleVideoPlay,
    handleVideoPause,
    handleVideoEnded,
    handleVideoError,
    toggleMute
  };
};
