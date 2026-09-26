import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { MOTION_DISABLED, springs } from './motion';

type ActivityRingProps = {
  /** 0–1; values above 1 draw a full ring. */
  progress: number;
  size?: number;
  stroke?: number;
  /** Two stops for the ring's gradient (start → end of the arc). */
  colors?: [string, string];
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
};

/**
 * An Activity-style ring. The arc draws in on a spring when it mounts and glides to each new
 * value; a small end cap catches the light so progress reads at a glance.
 */
const ActivityRing: React.FC<ActivityRingProps> = ({
  progress,
  size = 132,
  stroke = 14,
  colors = ['#30d158', '#64d2ff'],
  trackColor = 'rgb(118 118 128 / 0.22)',
  className = '',
  children,
  ariaLabel
}) => {
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const radius = (size - stroke) / 2;
  const center = size / 2;
  // A zero-length path still draws its round cap; keep a hair of arc so an empty ring shows a dot.
  const shown = Math.max(clamped, 0.002);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {MOTION_DISABLED ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${shown} 1`}
          />
        ) : (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: shown }}
            transition={{ ...springs.settle, duration: 1.2 }}
            style={{ filter: `drop-shadow(0 0 ${stroke / 2}px ${colors[1]}55)` }}
          />
        )}
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  );
};

export default ActivityRing;
