import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotionConfig, useTransform } from 'framer-motion';
import { MOTION_DISABLED } from './motion';

type AnimatedNumberProps = {
  value: number;
  /** Formats every intermediate value, e.g. formatMoney. */
  format: (value: number) => string;
  className?: string;
  /** Tint the figure green or red for a moment when it rises or falls. */
  flash?: boolean;
};

/**
 * A figure that counts to its new value on a critically damped spring (tabular digits, so the
 * width holds still while it rolls). The text is written by framer-motion outside React's render,
 * so a month's worth of changes costs no re-renders. Reduced motion jumps straight to the value.
 */
const AnimatedNumberLive: React.FC<AnimatedNumberProps> = ({ value, format, className = '', flash = true }) => {
  const reduce = useReducedMotionConfig();
  const mv = useMotionValue(value);
  const formatRef = useRef(format);
  formatRef.current = format;
  const text = useTransform(mv, (v) => formatRef.current(v));
  const previous = useRef(value);
  const [tone, setTone] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    let toneTimer: number | undefined;
    if (flash) {
      setTone(value > from ? 'up' : 'down');
      toneTimer = window.setTimeout(() => setTone(null), 1100);
    }
    if (reduce) {
      mv.jump(value);
      return () => window.clearTimeout(toneTimer);
    }
    const controls = animate(mv, value, { type: 'spring', bounce: 0, duration: 0.9 });
    return () => {
      controls.stop();
      window.clearTimeout(toneTimer);
    };
  }, [value, flash, reduce, mv]);

  return (
    <motion.span
      className={`num transition-colors duration-700 ${tone === 'up' ? 'text-emerald-300' : tone === 'down' ? 'text-rose-300' : ''} ${className}`.trim()}
      data-tone={tone ?? undefined}
    >
      {text}
    </motion.span>
  );
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = (props) => {
  if (MOTION_DISABLED) {
    return <span className={`num ${props.className ?? ''}`.trim()}>{props.format(props.value)}</span>;
  }
  return <AnimatedNumberLive {...props} />;
};

export default AnimatedNumber;
