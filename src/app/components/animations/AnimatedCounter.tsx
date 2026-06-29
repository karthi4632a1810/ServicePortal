import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { easeOutExpo } from '../../lib/animations';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  once?: boolean;
}

export function AnimatedCounter({
  target,
  duration = 1400,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  once = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once });
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(reducedMotion ? target : 0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion) {
      setCount(target);
      return;
    }
    if (!inView) return;

    const startTime = performance.now();
    const startValue = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = startValue + eased * (target - startValue);
      setCount(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, target, duration, reducedMotion]);

  const formatted =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.floor(count).toLocaleString('en-IN');

  return (
    <motion.span
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={reducedMotion ? undefined : (inView ? { opacity: 1, y: 0 } : {})}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}
