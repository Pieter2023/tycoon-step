import React from 'react';
import { motion, useReducedMotionConfig, type Transition, type Variants } from 'framer-motion';
import { MOTION_DISABLED, riseIn, springs, stagger } from '../ui/motion';

/**
 * Shared building blocks for the dialogs in this folder (docs/ui-design-system.md):
 * a staggered entrance for sheet content, the iOS switch, and tinted money chips.
 *
 * Under Vitest (MOTION_DISABLED) everything renders as plain elements at their final state, so
 * tests never see a half-faded row. Under "Reduce motion" (the in-app setting or the OS one)
 * content only cross-fades.
 */

const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } }
};

/** The in-app Reduce motion setting (html.tycoon-reduce-motion) or the OS / MotionConfig one. */
export const useSheetReducedMotion = (): boolean => {
  const config = useReducedMotionConfig();
  const inApp = typeof document !== 'undefined' && document.documentElement.classList.contains('tycoon-reduce-motion');
  return !!config || inApp;
};

type StaggerProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** Seconds between children. */
  gap?: number;
  /** Seconds before the first child, so content assembles as the sheet materialises. */
  delay?: number;
};

/** Parent of SheetItem: its items rise in one after another (a short stagger, never blocking input). */
export const SheetStagger = React.forwardRef<HTMLDivElement, StaggerProps>(
  ({ className, style, children, gap = 0.045, delay = 0.05 }, ref) => {
    if (MOTION_DISABLED) {
      return (
        <div ref={ref} className={className} style={style}>
          {children}
        </div>
      );
    }
    return (
      <motion.div ref={ref} className={className} style={style} variants={stagger(gap, delay)} initial="hidden" animate="show">
        {children}
      </motion.div>
    );
  }
);
SheetStagger.displayName = 'SheetStagger';

type ItemProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/** One piece of sheet content that rises a few points and fades in (a cross-fade under reduce motion). */
export const SheetItem: React.FC<ItemProps> = ({ className, style, children }) => {
  const reduce = useSheetReducedMotion();
  if (MOTION_DISABLED) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div className={className} style={style} variants={reduce ? fadeOnly : riseIn}>
      {children}
    </motion.div>
  );
};

/**
 * An emblem that arrives on a spring (scale up from a little smaller). `bouncy` is for
 * celebrations only; everything else settles without overshoot.
 */
export const SheetEmblem: React.FC<ItemProps & { bouncy?: boolean; delay?: number }> = ({
  className,
  style,
  children,
  bouncy = false,
  delay = 0.05
}) => {
  const reduce = useSheetReducedMotion();
  if (MOTION_DISABLED) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  const transition: Transition = reduce
    ? { duration: 0.2, delay }
    : { ...(bouncy ? { type: 'spring', bounce: 0.42, duration: 0.7 } : springs.smooth), delay };
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

type SwitchProps = {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  ariaLabel?: string;
  /** Tint when on (Apple green by default). */
  tint?: string;
};

/**
 * The iOS switch (51×31): a real checkbox (role="switch") under a capsule track whose knob glides
 * on a spring, re-targeted from wherever it is, so rapid taps never jump. Wrap it in a <label>
 * with the row's text so the whole row toggles it.
 */
export const Switch: React.FC<SwitchProps> = ({ checked, onChange, id, ariaLabel, tint = '#30d158' }) => {
  const reduce = useSheetReducedMotion();
  const knobClass =
    'pointer-events-none absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.25),0_1px_1px_rgb(0_0_0/0.16),0_3px_1px_rgb(0_0_0/0.06)]';
  return (
    <span className="relative inline-flex h-[31px] w-[51px] shrink-0">
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-label={ariaLabel}
        checked={checked}
        onChange={onChange}
        className="peer absolute inset-0 z-[1] m-0 h-full w-full cursor-pointer appearance-none rounded-full opacity-0"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full transition-colors duration-200 ease-out peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgb(10_132_255/0.75)]"
        style={{ backgroundColor: checked ? tint : 'rgb(120 120 128 / 0.32)' }}
      />
      {MOTION_DISABLED ? (
        <span aria-hidden className={knobClass} style={{ transform: `translateX(${checked ? 20 : 0}px)` }} />
      ) : (
        <motion.span
          aria-hidden
          className={knobClass}
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.18, duration: 0.38 }}
        />
      )}
    </span>
  );
};

/** Tint classes for a money change: red for a cost, green for a gain, gray for nothing. */
export const deltaTone = (value: number) =>
  value < 0
    ? 'bg-red-500/[0.16] text-red-300'
    : value > 0
      ? 'bg-emerald-400/[0.16] text-emerald-300'
      : 'bg-[rgb(118_118_128/0.24)] text-slate-300';

/** A capsule that carries a money figure (tabular digits), tinted by sign. */
export const DeltaChip: React.FC<{ value: number; children: React.ReactNode; className?: string }> = ({
  value,
  children,
  className = ''
}) => (
  <span
    className={`num inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none ${deltaTone(value)} ${className}`.trim()}
  >
    {children}
  </span>
);

/** Recharts tooltip on dark material (shared by the chart dialogs). */
export const chartTooltipStyle: React.CSSProperties = {
  background: 'rgba(36, 36, 40, 0.88)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 12,
  boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.55)',
  color: '#fff',
  fontSize: 12,
  padding: '8px 12px'
};

export const chartAxisTick = { fill: '#8e8e93', fontSize: 11 };
