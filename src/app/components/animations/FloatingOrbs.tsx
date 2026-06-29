import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface OrbConfig {
  size: number;
  x: string;
  y: string;
  color: string;
  duration: number;
  delay: number;
  amplitude: number;
  opacity: number;
}

const DEFAULT_ORBS: OrbConfig[] = [
  { size: 280, x: '-8%', y: '-12%', color: '#2563EB', duration: 8, delay: 0, amplitude: 24, opacity: 0.06 },
  { size: 200, x: '80%', y: '5%', color: '#7C3AED', duration: 10, delay: 1.5, amplitude: 18, opacity: 0.05 },
  { size: 160, x: '60%', y: '65%', color: '#10B981', duration: 7, delay: 0.8, amplitude: 20, opacity: 0.05 },
  { size: 120, x: '15%', y: '70%', color: '#F59E0B', duration: 9, delay: 2, amplitude: 16, opacity: 0.05 },
  { size: 90, x: '45%', y: '40%', color: '#EC4899', duration: 6, delay: 0.4, amplitude: 28, opacity: 0.04 },
];

interface FloatingOrbsProps {
  orbs?: OrbConfig[];
  className?: string;
}

export function FloatingOrbs({ orbs = DEFAULT_ORBS, className }: FloatingOrbsProps) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ''}`}
      aria-hidden="true"
    >
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
            opacity: orb.opacity,
          }}
          animate={{
            y: [0, -orb.amplitude, 0, orb.amplitude * 0.6, 0],
            x: [0, orb.amplitude * 0.4, 0, -orb.amplitude * 0.3, 0],
            scale: [1, 1.08, 1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Floating particles variant ──────────────────────────────── */
interface ParticleProps {
  count?: number;
  color?: string;
}

export function FloatingParticles({ count = 20, color = '#2563EB' }: ParticleProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const size = Math.random() * 4 + 2;
        const x = `${Math.random() * 100}%`;
        const duration = Math.random() * 8 + 6;
        const delay = Math.random() * -10;
        const opacity = Math.random() * 0.15 + 0.05;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: x,
              bottom: '-10px',
              background: color,
              opacity,
            }}
            animate={{
              y: [0, -(Math.random() * 300 + 200)],
              x: [0, (Math.random() - 0.5) * 60],
              opacity: [opacity, 0],
              scale: [1, Math.random() * 0.5 + 0.5],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}
