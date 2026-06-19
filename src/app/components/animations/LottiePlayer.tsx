import React from 'react';
import Lottie from 'lottie-react';
import { motion } from 'motion/react';

/* ── Inline Lottie JSON animations ──────────────────────────── */

const SUCCESS_ANIMATION = {
  v: '5.7.4', fr: 60, ip: 0, op: 90, w: 120, h: 120, nm: 'Success', ddd: 0, assets: [],
  layers: [
    {
      ind: 1, ty: 4, nm: 'Circle', sr: 1, ks: {
        r: { k: 0 }, p: { k: [60, 60, 0] }, a: { k: [0, 0, 0] },
        s: { k: [{ t: 0, s: [0, 0, 100] }, { t: 20, s: [110, 110, 100] }, { t: 30, s: [100, 100, 100] }] },
        o: { k: 100 },
      },
      ip: 0, op: 90,
      shapes: [
        {
          ty: 'gr', it: [
            { ty: 'el', s: { k: [96, 96] }, p: { k: [0, 0] }, nm: 'Ellipse Path 1' },
            { ty: 'fl', c: { k: [0.149, 0.737, 0.51, 1] }, o: { k: 100 }, nm: 'Fill 1' },
          ],
        },
        {
          ty: 'gr', it: [
            {
              ty: 'sh', ks: {
                k: [{
                  t: 30, s: [{ i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-22, 0], [-6, 16], [22, -18]], c: false }],
                }],
              }, nm: 'Path 1',
            },
            { ty: 'st', c: { k: [1, 1, 1, 1] }, o: { k: 100 }, w: { k: 7 }, lc: 2, lj: 2, nm: 'Stroke 1' },
            {
              ty: 'tm',
              s: { k: [{ t: 30, s: [0] }] },
              e: { k: [{ t: 30, s: [0] }, { t: 60, s: [100] }] },
              nm: 'Trim Paths 1',
            },
          ],
        },
      ],
    },
  ],
};

const LOADING_ANIMATION = {
  v: '5.7.4', fr: 30, ip: 0, op: 60, w: 80, h: 80, nm: 'Loading', ddd: 0, assets: [],
  layers: [-20, 0, 20].map((offset, i) => ({
    ind: i + 1, ty: 4, nm: `Dot ${i}`, sr: 1,
    ks: {
      p: { k: [40 + offset, 40, 0] }, a: { k: [0, 0, 0] },
      s: {
        k: [
          { t: 0 + i * 6, s: [100, 100, 100] },
          { t: 10 + i * 6, s: [140, 140, 100] },
          { t: 20 + i * 6, s: [100, 100, 100] },
          { t: 60, s: [100, 100, 100] },
        ],
      },
      o: { k: 100 },
    },
    ip: 0, op: 60,
    shapes: [
      {
        ty: 'gr', it: [
          { ty: 'el', s: { k: [14, 14] }, p: { k: [0, 0] }, nm: 'Dot' },
          { ty: 'fl', c: { k: [0.149, 0.388, 0.922, 1] }, o: { k: 100 }, nm: 'Fill' },
        ],
      },
    ],
  })),
};

const EMPTY_ANIMATION = {
  v: '5.7.4', fr: 24, ip: 0, op: 120, w: 200, h: 200, nm: 'Empty', ddd: 0, assets: [],
  layers: [
    {
      ind: 1, ty: 4, nm: 'Box', sr: 1,
      ks: {
        p: { k: [100, 100, 0] }, a: { k: [0, 0, 0] }, r: { k: 0 },
        s: { k: [{ t: 0, s: [90, 90, 100] }, { t: 60, s: [100, 100, 100] }, { t: 120, s: [90, 90, 100] }] },
        o: { k: 100 },
      },
      ip: 0, op: 120,
      shapes: [
        {
          ty: 'gr', it: [
            { ty: 'rc', s: { k: [100, 80] }, p: { k: [0, 10] }, r: { k: 12 }, nm: 'Rect' },
            { ty: 'st', c: { k: [0.149, 0.388, 0.922, 0.3] }, o: { k: 100 }, w: { k: 3 }, lc: 2, lj: 2, nm: 'Stroke' },
            { ty: 'fl', c: { k: [0.149, 0.388, 0.922, 0.06] }, o: { k: 100 }, nm: 'Fill' },
          ],
        },
      ],
    },
  ],
};

export type LottieAnimationType = 'success' | 'loading' | 'empty';

const ANIMATIONS: Record<LottieAnimationType, object> = {
  success: SUCCESS_ANIMATION,
  loading: LOADING_ANIMATION,
  empty: EMPTY_ANIMATION,
};

interface LottiePlayerProps {
  animation: LottieAnimationType | object;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  onComplete?: () => void;
}

export function LottiePlayer({
  animation,
  size = 120,
  loop = false,
  autoplay = true,
  className,
  onComplete,
}: LottiePlayerProps) {
  const animationData =
    typeof animation === 'string'
      ? ANIMATIONS[animation as LottieAnimationType]
      : animation;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={className}
      style={{ width: size, height: size }}
    >
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: size, height: size }}
        onComplete={onComplete}
      />
    </motion.div>
  );
}
