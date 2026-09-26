import { useI18n, type Translate } from '../../i18n';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  usePresence,
  useReducedMotionConfig,
  useTransform,
  type AnimationPlaybackControls,
  type HTMLMotionProps,
  type MotionValue,
  type Transition
} from 'framer-motion';
import { Banknote, GraduationCap, Handshake, HeartPulse, Lock, X, Zap, type LucideIcon } from 'lucide-react';
import SegmentedControl from '../ui/SegmentedControl';
import { MOTION_DISABLED, project, riseIn, rubberband, springs, stagger } from '../ui/motion';
import { MonthlyActionId } from '../../types';
import { MonthlyActionCard, MonthlyActionCategory, MonthlyActionsSummary } from '../../services/monthlyActions';

type ActionsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  summary: MonthlyActionsSummary;
  onSelectAction: (id: MonthlyActionId) => void;
};

/* -------------------------------------------------------------------------------------------------
 * Shared action tile (also used by ActionsScreen): a tinted medallion, the title, what it gives,
 * and what it costs as small tabular chips.
 * ---------------------------------------------------------------------------------------------- */

/** Icon and system tint (as "r g b") for each monthly action; the same glyphs as the dashboard's tiles. */
export const MONTHLY_ACTION_TONES: Record<MonthlyActionId, { icon: LucideIcon; tint: string }> = {
  OVERTIME: { icon: Banknote, tint: '48 209 88' },
  NETWORK: { icon: Handshake, tint: '100 210 255' },
  TRAINING: { icon: GraduationCap, tint: '255 159 10' },
  HUSTLE_SPRINT: { icon: Zap, tint: '191 90 242' },
  RECOVER: { icon: HeartPulse, tint: '255 55 95' }
};

const FALLBACK_TONE = { icon: Zap, tint: '142 142 147' };

/** Spring a number to `to`, starting at `velocity` (px/s) so a released drag has no seam. */
const springTo = (value: MotionValue<number>, to: number, transition: Transition, velocity = 0) =>
  animate(value, to, { ...(transition as Record<string, unknown>), velocity } as never);

/** "Cost: $300 • -8 energy • +4 stress" → ["Cost: $300", "-8 energy", "+4 stress"]. */
const detailChips = (details: string) =>
  details
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean);

type MonthlyActionTileProps = Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'> & {
  action: MonthlyActionCard;
  onSelect: () => void;
};

export const MonthlyActionTile = React.forwardRef<HTMLButtonElement, MonthlyActionTileProps>(
  ({ action, onSelect, className = '', ...motionProps }, ref) => {
    const tone = MONTHLY_ACTION_TONES[action.id] ?? FALLBACK_TONE;
    const Icon = tone.icon;
    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onSelect}
        disabled={action.disabled}
        {...motionProps}
        className={`group relative flex w-full items-start gap-3.5 rounded-[18px] border border-white/[0.06] bg-white/[0.045] p-4 text-left ${
          action.disabled ? 'cursor-not-allowed' : 'surface-interactive hover:bg-white/[0.075]'
        } ${className}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${action.disabled ? 'opacity-50' : ''}`}
          style={{ background: `rgb(${tone.tint} / 0.16)`, color: `rgb(${tone.tint})`, boxShadow: `inset 0 0 0 1px rgb(${tone.tint} / 0.14)` }}
          aria-hidden
        >
          <Icon size={19} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-[15px] font-semibold leading-5 ${action.disabled ? 'text-slate-400' : 'text-white'}`}>
            {action.title}
          </span>
          <span className={`mt-0.5 block text-[13px] leading-[18px] ${action.disabled ? 'text-slate-500' : 'text-slate-300'}`}>
            {action.subtitle}
          </span>
          <span className="mt-2.5 flex flex-wrap gap-1.5">
            {detailChips(action.details).map((chip) => (
              <span
                key={chip}
                className={`num inline-flex items-center rounded-full px-2 py-[3px] text-[11.5px] font-medium leading-4 ${
                  action.disabled ? 'bg-white/[0.04] text-slate-500' : 'bg-white/[0.07] text-slate-200'
                }`}
              >
                {chip}
              </span>
            ))}
          </span>
          {action.disabledReason && (
            <span className="mt-2.5 flex items-start gap-1.5 text-[12.5px] leading-[17px] text-rose-300">
              <Lock size={12} className="mt-[2.5px] shrink-0" aria-hidden />
              {action.disabledReason}
            </span>
          )}
        </span>
      </motion.button>
    );
  }
);
MonthlyActionTile.displayName = 'MonthlyActionTile';

/** Remaining actions as a row of pips (decorative; the figure beside it carries the meaning). */
export const ActionPips: React.FC<{ remaining: number; max: number }> = ({ remaining, max }) => (
  <span className="flex items-center gap-[5px]" aria-hidden>
    {Array.from({ length: Math.max(0, Math.min(8, max)) }, (_, index) => (
      <span
        key={index}
        className={`h-[7px] w-[7px] rounded-full transition-[background-color,box-shadow] duration-500 ${
          index < remaining ? 'bg-emerald-400 shadow-[0_0_6px_rgb(48_209_88/0.55)]' : 'bg-white/[0.16]'
        }`}
      />
    ))}
  </span>
);

const filtersFor = (t: Translate): Array<{ id: 'all' | MonthlyActionCategory; label: string }> => [
  { id: 'all', label: t('shell.actionsDrawer.all') },
  { id: 'income', label: t('shell.actionsDrawer.income') },
  { id: 'growth', label: t('shell.actionsDrawer.growth') },
  { id: 'recovery', label: t('shell.actionsDrawer.recovery') }
];

/* -------------------------------------------------------------------------------------------------
 * The sheet
 *
 * Phones: a bottom sheet with a grabber. The header tracks the finger 1:1, rubber-bands past the
 * top, and on release projects the flick's momentum (Apple's `project`) to choose between dismissing
 * and snapping home; either way the spring starts at the finger's velocity. Wider screens: a floating
 * side sheet that slides in from the right and leaves the same way (touch can swipe it away too).
 *
 * One motion value (`offset`, px along the dismiss axis) drives the sheet and the scrim, so the dim
 * follows the finger. Reduced motion: no slide, a short cross-fade.
 *
 * Dialog behaviour matches `Modal`: role=dialog + aria-modal, the "Close modal" button, Escape, a
 * focus trap, focus restored on close, the page scroll-locked, the scrim closes it.
 * ---------------------------------------------------------------------------------------------- */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const focusablesIn = (container: HTMLElement | null) =>
  container
    ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0)
    : [];

/** The newest aria-modal dialog in the document is the one that owns keys and focus. */
const isTopDialog = (el: HTMLElement | null) => {
  if (!el) return false;
  const dialogs = document.querySelectorAll<HTMLElement>('[aria-modal="true"]');
  return dialogs[dialogs.length - 1] === el;
};

const WIDE_QUERY = '(min-width: 768px)';
const useWideLayout = () => {
  const read = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(WIDE_QUERY).matches : true);
  const [wide, setWide] = useState(read);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return wide;
};

/** Release velocity (px/s) from the last ~100 ms of samples; a finger that stopped before lifting throws nothing. */
const velocityFrom = (history: Array<{ t: number; p: number }>, now: number) => {
  const recent = history.filter((sample) => now - sample.t <= 100);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = (last.t - first.t) / 1000;
  return dt > 0 ? (last.p - first.p) / dt : 0;
};

type DragState = {
  id: number;
  start: number;
  cross: number;
  startOffset: number;
  active: boolean;
  history: Array<{ t: number; p: number }>;
};

const ActionsSheet: React.FC<Omit<ActionsDrawerProps, 'isOpen'> & { wide: boolean }> = ({
  onClose,
  summary,
  onSelectAction,
  wide
}) => {
  const { t } = useI18n();
  const reduce = !!useReducedMotionConfig();
  const [isPresent, safeToRemove] = usePresence();
  const title = t('shell.actionsDrawer.all_monthly_actions');
  const filters = filtersFor(t);
  const [filter, setFilter] = useState<'all' | MonthlyActionCategory>('all');
  const filteredActions = useMemo(() => {
    if (filter === 'all') return summary.actions;
    return summary.actions.filter((action) => action.category === filter);
  }, [filter, summary.actions]);

  const panelRef = useRef<HTMLDivElement>(null);
  const extentRef = useRef(wide ? 520 : 720);
  const slides = !MOTION_DISABLED && !reduce;
  const offset = useMotionValue(slides ? (typeof window !== 'undefined' ? (wide ? 560 : window.innerHeight) : 800) : 0);
  const fade = useMotionValue(MOTION_DISABLED || slides ? 1 : 0);
  const scrimOpacity = useTransform([offset, fade], ([o, f]: number[]) => f * Math.max(0, Math.min(1, 1 - o / extentRef.current)));
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const releaseVelocityRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  const run = (controls: AnimationPlaybackControls) => {
    controlsRef.current?.stop();
    controlsRef.current = controls;
    return controls;
  };

  const measure = useCallback(() => {
    const panel = panelRef.current;
    if (panel) extentRef.current = (wide ? panel.offsetWidth : panel.offsetHeight) + 32;
    return extentRef.current;
  }, [wide]);

  // Arrive: slide up (or in from the right) on the default spring; reduced motion cross-fades.
  useLayoutEffect(() => {
    const extent = measure();
    if (MOTION_DISABLED) return;
    if (!slides) {
      offset.set(0);
      run(animate(fade, 1, { duration: 0.2, ease: [0.22, 1, 0.36, 1] }));
      return;
    }
    offset.set(extent);
    run(springTo(offset, 0, springs.smooth));
    return () => controlsRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leave by the same path, carrying the flick's velocity when a drag dismissed it. Reopened while
  // still leaving, it turns around from wherever it is.
  const leavingRef = useRef(false);
  useEffect(() => {
    if (isPresent) {
      if (!leavingRef.current) return;
      leavingRef.current = false;
      run(slides ? springTo(offset, 0, springs.smooth) : animate(fade, 1, { duration: 0.2, ease: [0.22, 1, 0.36, 1] }));
      focusRestoredRef.current = false;
      (focusablesIn(panelRef.current)[0] || panelRef.current)?.focus({ preventScroll: true });
      return;
    }
    leavingRef.current = true;
    const velocity = releaseVelocityRef.current;
    releaseVelocityRef.current = 0;
    const done = () => safeToRemove?.();
    if (MOTION_DISABLED) {
      done();
      return;
    }
    const controls = slides
      ? run(springTo(offset, measure(), { type: 'spring', bounce: 0, duration: 0.36 }, velocity))
      : run(animate(fade, 0, { duration: 0.18, ease: [0.4, 0, 1, 1] }));
    controls.then(() => {
      if (leavingRef.current) done();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  // Page scroll lock (on <html>, so it never fights Modal's body lock) and focus in / focus back.
  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousPadding = root.style.paddingRight;
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
    return () => {
      root.style.overflow = previousOverflow;
      root.style.paddingRight = previousPadding;
    };
  }, []);

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusRestoredRef = useRef(false);
  const restoreFocus = useCallback(() => {
    if (focusRestoredRef.current) return;
    focusRestoredRef.current = true;
    const previous = previousFocusRef.current;
    if (previous && document.contains(previous)) window.setTimeout(() => previous.focus(), 0);
  }, []);

  useEffect(() => {
    focusRestoredRef.current = false;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const target = focusablesIn(panelRef.current)[0] || panelRef.current;
    const timer = window.setTimeout(() => target?.focus({ preventScroll: true }), 0);
    return () => {
      window.clearTimeout(timer);
      restoreFocus();
    };
  }, [restoreFocus]);

  useEffect(() => {
    if (!isPresent) restoreFocus();
  }, [isPresent, restoreFocus]);

  useEffect(() => {
    if (!isPresent) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopDialog(panelRef.current)) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = focusablesIn(panelRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && !!panelRef.current?.contains(active);
      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      const panel = panelRef.current;
      if (!panel || !isTopDialog(panel)) return;
      if (panel.contains(event.target as Node)) return;
      (focusablesIn(panel)[0] || panel).focus({ preventScroll: true });
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isPresent, onClose]);

  /* --- Drag to dismiss ------------------------------------------------------------------------ */
  const along = (event: React.PointerEvent) => (wide ? event.clientX : event.clientY);
  const across = (event: React.PointerEvent) => (wide ? event.clientY : event.clientX);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;
    if (!isPresent || event.button !== 0) return;
    // A mouse on the side sheet is pointing, not throwing; touch and pen can swipe it away.
    if (wide && event.pointerType === 'mouse') return;
    if ((event.target as HTMLElement).closest('[data-sheet-nodrag]')) return;
    dragRef.current = {
      id: event.pointerId,
      start: along(event),
      cross: across(event),
      startOffset: offset.get(),
      active: false,
      history: []
    };
    // Capture now: the grabber sits at the sheet's edge, so a quick pull up leaves it within a frame.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.active) {
      const delta = along(event) - drag.start;
      const crossDelta = Math.abs(across(event) - drag.cross);
      if (crossDelta > 12 && crossDelta > Math.abs(delta)) {
        dragRef.current = null; // the finger meant something else
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      if (Math.abs(delta) < 8) return; // hysteresis before committing to a drag
      drag.active = true;
      controlsRef.current?.stop(); // grab it mid-flight, from where it is on screen
      drag.startOffset = offset.get();
      drag.start = along(event);
      measure();
    }
    const raw = drag.startOffset + (along(event) - drag.start);
    const next = raw < 0 ? rubberband(raw, extentRef.current) : raw;
    offset.set(next);
    drag.history.push({ t: event.timeStamp, p: next });
    if (drag.history.length > 12) drag.history.shift();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag.active) return;
    suppressClickRef.current = true;
    const velocity = cancelled ? 0 : velocityFrom(drag.history, event.timeStamp);
    const current = offset.get();
    // Aim for where the gesture is going, not where the finger let go.
    const projected = current + project(velocity);
    if (!cancelled && projected > extentRef.current / 2) {
      releaseVelocityRef.current = velocity;
      onClose();
      return;
    }
    // Home again; a little bounce only because momentum preceded it.
    run(springTo(offset, 0, slides ? springs.bouncy : springs.smooth, velocity));
  };

  const handleClickCapture = (event: React.MouseEvent) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  /* --- Content -------------------------------------------------------------------------------- */
  const tiles = filteredActions.map((action) => (
    <MonthlyActionTile
      key={action.id}
      action={action}
      onSelect={() => {
        if (action.disabled) return;
        onSelectAction(action.id);
        onClose();
      }}
      {...(MOTION_DISABLED
        ? {}
        : {
            layout: 'position' as const,
            variants: {
              hidden: riseIn.hidden,
              show: riseIn.show,
              exit: { opacity: 0, scale: 0.96, transition: { type: 'spring', bounce: 0, duration: 0.22 } }
            },
            exit: 'exit',
            transition: springs.smooth
          })}
    />
  ));

  const panelMotionStyle = wide ? { x: offset, opacity: fade } : { y: offset, opacity: fade };
  const Panel = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;
  const Scrim = (MOTION_DISABLED ? 'div' : motion.div) as React.ElementType;

  return (
    <div className="fixed inset-0" style={{ zIndex: 1000, pointerEvents: isPresent ? 'auto' : 'none' }}>
      <Scrim
        aria-hidden
        className="absolute inset-0 bg-black/50"
        style={MOTION_DISABLED ? undefined : { opacity: scrimOpacity }}
        onClick={() => {
          if (isTopDialog(panelRef.current)) onClose();
        }}
      />
      <Panel
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={MOTION_DISABLED ? undefined : panelMotionStyle}
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        onClickCapture={handleClickCapture}
        className={
          wide
            ? 'mat-sheet absolute bottom-3 right-3 top-3 flex w-[min(460px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px] outline-none'
            : // A phone sheet covers most of the screen, so its material is thicker than a dialog's. The
              // block under it keeps that material showing when it is pulled up past its rest.
              "mat-sheet absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-48px)] flex-col rounded-b-none rounded-t-[28px] border-b-0 bg-[rgb(28_28_30/0.94)] outline-none after:pointer-events-none after:absolute after:inset-x-[-1px] after:top-full after:h-[40vh] after:bg-[rgb(28_28_30/0.94)] after:content-['']"
        }
      >
        {/* Drag zone: grabber + title. Touch-action none so the browser leaves the gesture to us. */}
        <div
          className={`relative shrink-0 select-none px-5 pb-3 ${wide ? 'touch-pan-y pt-5' : 'cursor-grab touch-none pt-2 active:cursor-grabbing'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endDrag(event, false)}
          onPointerCancel={(event) => endDrag(event, true)}
        >
          {!wide && <div aria-hidden className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-white/25" />}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="t-title-2 text-white">{t('shell.actionsDrawer.monthly_actions')}</h2>
              <div className="mt-2 flex items-center gap-2.5">
                <ActionPips remaining={summary.remaining} max={summary.max} />
                <span className="num text-[13px] font-medium text-slate-200">
                  {summary.remaining} / {summary.max} remaining
                </span>
              </div>
              {summary.reason && <p className="mt-1.5 text-[13px] leading-[18px] text-slate-400">{summary.reason}</p>}
            </div>
            <button
              type="button"
              data-sheet-nodrag
              onClick={onClose}
              aria-label={t('modal.close')}
              className="pressable group -mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-300 hover:text-white"
            >
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[rgb(118_118_128/0.28)] transition-colors group-hover:bg-[rgb(118_118_128/0.42)]">
                <X size={15} strokeWidth={2.6} />
              </span>
            </button>
          </div>
        </div>

        <div data-sheet-nodrag className="shrink-0 px-5 pb-3">
          <SegmentedControl<'all' | MonthlyActionCategory>
            role="radiogroup"
            ariaLabel={t('shell.actionsDrawer.filter')}
            size="sm"
            fill
            value={filter}
            onChange={setFilter}
            options={filters.map((item) => ({ value: item.id, label: item.label }))}
          />
        </div>

        {/* Scroll edge: a hairline appears only once content passes under the header. */}
        <div
          aria-hidden
          className={`mx-5 h-px shrink-0 bg-white/[0.09] transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
        />

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-2"
          onScroll={(event) => {
            const next = event.currentTarget.scrollTop > 2;
            if (next !== scrolled) setScrolled(next);
          }}
        >
          {MOTION_DISABLED ? (
            <div className="grid gap-2.5">{tiles}</div>
          ) : (
            <motion.div className="relative grid gap-2.5" variants={stagger(0.045, 0.12)} initial="hidden" animate="show">
              <AnimatePresence mode="popLayout">
                {tiles}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </Panel>
    </div>
  );
};

const ActionsDrawer: React.FC<ActionsDrawerProps> = ({ isOpen, onClose, summary, onSelectAction }) => {
  const wide = useWideLayout();
  if (typeof document === 'undefined') return null;
  if (!isOpen && MOTION_DISABLED) return null;
  const sheet = isOpen ? (
    <ActionsSheet key="actions-sheet" onClose={onClose} summary={summary} onSelectAction={onSelectAction} wide={wide} />
  ) : null;
  return createPortal(MOTION_DISABLED ? sheet : <AnimatePresence>{sheet}</AnimatePresence>, document.body);
};

export default ActionsDrawer;
