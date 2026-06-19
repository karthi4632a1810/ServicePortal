import React from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { cn } from '../ui/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  height?: number;
  showLabel?: boolean;
  color?: string;
  rounded?: boolean;
  delay?: number;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  trackClassName,
  barClassName,
  height = 6,
  showLabel = false,
  color,
  rounded = true,
  delay = 0,
}: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div ref={ref} className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{value}</span>
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={cn('w-full bg-muted overflow-hidden', rounded && 'rounded-full', trackClassName)}
        style={{ height }}
      >
        <motion.div
          className={cn('h-full', rounded && 'rounded-full', barClassName)}
          style={{
            background: color ?? 'var(--primary)',
            boxShadow: `0 0 8px 0 ${color ?? 'var(--primary)'}66`,
          }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 1, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}

/* ── Circular progress ───────────────────────────────────────── */
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = 'var(--primary)',
  trackColor = 'var(--muted)',
  className,
  children,
}: CircularProgressProps) {
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true });

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = Math.min(value, 100);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
