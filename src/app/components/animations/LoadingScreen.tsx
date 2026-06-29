import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList } from 'lucide-react';
import { FloatingOrbs } from './FloatingOrbs';
import { APP_NAME, APP_TAGLINE } from '../../utils/branding';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
  skipAnimation?: boolean;
}

const LOADING_STEPS = [
  'Initializing PaperZero...',
  'Loading forms...',
  'Loading employee details...',
  'Ready!',
];

export function LoadingScreen({ onComplete, duration = 2800, skipAnimation = false }: LoadingScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (skipAnimation || duration <= 0) {
      onComplete?.();
      setDone(true);
      return;
    }

    const stepDuration = duration / LOADING_STEPS.length;

    const stepInterval = setInterval(() => {
      setStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, stepDuration);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 100 / (duration / 30);
      });
    }, 30);

    const timeout = setTimeout(() => {
      setDone(true);
      setTimeout(() => onComplete?.(), 500);
    }, duration);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [duration, onComplete, skipAnimation]);

  if (skipAnimation || duration <= 0) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          <FloatingOrbs />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="relative mb-8"
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative size-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <ClipboardList className="size-10 text-primary-foreground" />
              </motion.div>
            </div>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-foreground mb-1" style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {APP_NAME}
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{APP_TAGLINE}</p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-64 space-y-3"
          >
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Step text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-center text-muted-foreground"
                style={{ fontSize: '12px' }}
              >
                {LOADING_STEPS[step]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-1.5 mt-8"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="size-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
