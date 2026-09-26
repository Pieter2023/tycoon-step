import type { Transition, Variants } from 'framer-motion';

/**
 * Motion vocabulary for the 2D UI (docs/ui-design-system.md).
 *
 * Springs follow Apple's two-parameter model: `bounce` 0 is critically damped (the default for
 * anything that simply appears or moves), and a little bounce is reserved for things the player
 * threw or grabbed. `duration` is the spring's response time, not a fixed length.
 *
 * App wraps the tree in <MotionConfig reducedMotion>, so under "reduce motion" framer-motion drops
 * transforms and keeps only opacity: every variant here must still read as a cross-fade.
 */
export const springs = {
  /** Default for appear / move / resize. */
  smooth: { type: 'spring', bounce: 0, duration: 0.42 } as Transition,
  /** Small, quick UI responses: toggles, highlights, chips. */
  snappy: { type: 'spring', bounce: 0, duration: 0.28 } as Transition,
  /** Selection indicators that slide between options. */
  glide: { type: 'spring', bounce: 0.12, duration: 0.45 } as Transition,
  /** Momentum-driven: a sheet released after a drag, a flicked card. */
  bouncy: { type: 'spring', bounce: 0.24, duration: 0.5 } as Transition,
  /** Numbers and meters that settle on a new value. */
  settle: { type: 'spring', bounce: 0, duration: 0.9 } as Transition
} as const;

/** Vitest renders synchronously; animated values would lag the assertions, so tests get none. */
export const MOTION_DISABLED = import.meta.env.MODE === 'test';

/** Content that arrives: rises a few points and fades in. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: springs.smooth }
};

/** Parent of `riseIn` children: short stagger so a page assembles rather than pops. */
export const stagger = (gap = 0.04, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } }
});

/** Glass surfaces arriving: scale up slightly out of a blur (materialise, not just fade). */
export const materialize: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8, filter: 'blur(6px)' },
  // transitionEnd clears the filter: a lingering blur(0px) keeps an extra render surface (costly over
  // the 3D city's canvas) and makes the surface a containing block for fixed-position children.
  show: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { ...springs.smooth, filter: { duration: 0.25 } }, transitionEnd: { filter: 'none' } },
  exit: { opacity: 0, scale: 0.97, y: 6, filter: 'blur(4px)', transition: { type: 'spring', bounce: 0, duration: 0.26 } }
};

/**
 * Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest.
 * decelerationRate 0.998 matches normal scrolling; 0.99 stops sooner.
 */
export const project = (velocity: number, decelerationRate = 0.998) =>
  ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);

/** Soft boundary: the further past the edge, the less the element follows. */
export const rubberband = (overshoot: number, dimension: number, constant = 0.55) =>
  (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
