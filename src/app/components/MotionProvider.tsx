import React from 'react';
import { MotionConfig } from 'motion/react';
import { useApp } from '../context/AppContext';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = useApp();
  const enabled = preferences.animations;

  return (
    <MotionConfig reducedMotion={enabled ? 'never' : 'always'} transition={{ duration: 0 }}>
      {children}
    </MotionConfig>
  );
}
