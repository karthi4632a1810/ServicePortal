import React from 'react';
import { motion } from 'motion/react';
import { stagger, fadeUp, scaleIn, slideUp } from '../../lib/animations';

type AnimationType = 'fadeUp' | 'scaleIn' | 'slideUp';

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  animation?: AnimationType;
  as?: React.ElementType;
}

const CHILD_VARIANTS: Record<AnimationType, object> = {
  fadeUp,
  scaleIn,
  slideUp,
};

export function StaggerList({
  children,
  className,
  delay = 0,
  staggerDelay = 0.07,
  animation = 'fadeUp',
  as: Tag = 'div',
}: StaggerListProps) {
  const containerVariants = stagger(staggerDelay, delay);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={CHILD_VARIANTS[animation]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Individual stagger item ─────────────────────────────────── */
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
}

export function StaggerItem({ children, className, animation = 'fadeUp' }: StaggerItemProps) {
  return (
    <motion.div variants={CHILD_VARIANTS[animation]} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Reveal on scroll ────────────────────────────────────────── */
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
  once?: boolean;
}

export function ScrollReveal({ children, className, animation = 'fadeUp', once = true }: ScrollRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10%' }}
      variants={CHILD_VARIANTS[animation]}
      className={className}
    >
      {children}
    </motion.div>
  );
}
