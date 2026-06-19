import type { Variants, Transition } from 'motion/react';

/* ── Easings ─────────────────────────────────────────────────── */
export const ease = {
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  snappy: [0.4, 0, 0.2, 1] as const,
  out: [0, 0, 0.58, 1] as const,
};

/* ── Spring configs ──────────────────────────────────────────── */
export const spring = {
  stiff: { type: 'spring', stiffness: 500, damping: 40 } as Transition,
  medium: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  gentle: { type: 'spring', stiffness: 150, damping: 25 } as Transition,
  bouncy: { type: 'spring', stiffness: 400, damping: 20 } as Transition,
  slow: { type: 'spring', stiffness: 80, damping: 20 } as Transition,
};

/* ── Fade variants ───────────────────────────────────────────── */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: ease.smooth } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.smooth } },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.smooth } },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: ease.smooth } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: ease.smooth } },
};

/* ── Scale variants ──────────────────────────────────────────── */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: ease.spring } },
};

export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: spring.bouncy },
};

export const scaleOut: Variants = {
  hidden: { opacity: 0, scale: 1.1 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: ease.smooth } },
};

/* ── Slide variants ──────────────────────────────────────────── */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: spring.medium },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  show: { opacity: 1, y: 0, transition: spring.medium },
};

/* ── Stagger container helpers ───────────────────────────────── */
export const stagger = (delay = 0.07, initial = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren: initial } },
});

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export const staggerSlow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

/* ── Page transition ─────────────────────────────────────────── */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: ease.smooth },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: ease.snappy },
  },
};

/* ── Hover/tap presets (use in whileHover / whileTap) ────────── */
export const hoverLift = {
  y: -4,
  boxShadow: '0 16px 32px -8px rgba(0,0,0,0.12)',
  transition: { duration: 0.2, ease: ease.out },
};

export const hoverGlow = (color = '#2563EB') => ({
  boxShadow: `0 0 20px 0 ${color}33`,
  transition: { duration: 0.2 },
});

export const tapShrink = { scale: 0.96, transition: { duration: 0.1 } };
export const tapBounce = { scale: 0.94, transition: spring.stiff };

/* ── Floating animation (use in animate prop) ────────────────── */
export const float = (amplitude = 12, duration = 4) => ({
  y: [0, -amplitude, 0],
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut',
  },
});

/* ── Pulse animation ─────────────────────────────────────────── */
export const pulse = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

/* ── Spin ────────────────────────────────────────────────────── */
export const spin = {
  rotate: 360,
  transition: { duration: 1.2, repeat: Infinity, ease: 'linear' },
};

/* ── Shimmer (for skeleton) ──────────────────────────────────── */
export const shimmerVariants: Variants = {
  hidden: { backgroundPosition: '-1000px 0' },
  show: {
    backgroundPosition: '1000px 0',
    transition: { duration: 1.6, repeat: Infinity, ease: 'linear' },
  },
};

/* ── Number counter easing ───────────────────────────────────── */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
