import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '../ui/utils';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  rippleColor?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_STYLES = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
  ghost: 'text-foreground hover:bg-muted border border-transparent hover:border-border',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

const SIZE_STYLES = {
  sm: 'h-8 px-3 gap-1.5',
  md: 'h-9 px-4 gap-2',
  lg: 'h-11 px-6 gap-2.5',
};

const RIPPLE_COLORS = {
  primary: 'rgba(255,255,255,0.3)',
  secondary: 'rgba(37,99,235,0.15)',
  ghost: 'rgba(37,99,235,0.1)',
  destructive: 'rgba(255,255,255,0.3)',
  success: 'rgba(255,255,255,0.3)',
};

export function RippleButton({
  children,
  variant = 'primary',
  size = 'md',
  rippleColor,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  disabled,
  ...props
}: RippleButtonProps) {
  const reducedMotion = useReducedMotion();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (!btn || disabled || loading) return;

    if (!reducedMotion) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2.2;
      const id = Date.now();

      setRipples(prev => [...prev, { id, x, y, size }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    }

    onClick?.(e);
  };

  const rColor = rippleColor ?? RIPPLE_COLORS[variant];
  const sharedClassName = cn(
    'relative overflow-hidden inline-flex items-center justify-center rounded-lg font-medium transition-colors select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    className
  );
  const sharedStyle = { fontSize: size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13px' };

  const content = (
    <>
      {!reducedMotion && (
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x - ripple.size / 2,
                top: ripple.y - ripple.size / 2,
                width: ripple.size,
                height: ripple.size,
                background: rColor,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      )}

      {loading && (
        reducedMotion ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="size-4 border-2 border-current border-t-transparent rounded-full" />
          </span>
        ) : (
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="size-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.span>
        )
      )}

      <span className={cn('relative z-10 flex items-center gap-[inherit]', loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </>
  );

  if (reducedMotion) {
    return (
      <button
        ref={buttonRef}
        onClick={addRipple}
        disabled={disabled || loading}
        className={sharedClassName}
        style={sharedStyle}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={addRipple}
      disabled={disabled || loading}
      className={sharedClassName}
      style={sharedStyle}
      {...(props as object)}
    >
      {content}
    </motion.button>
  );
}
