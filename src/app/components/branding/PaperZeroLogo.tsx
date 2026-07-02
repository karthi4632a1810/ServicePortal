import { cn } from '../ui/utils';
import { LOGO_OUTLINE_URL } from '../../utils/branding';

interface PaperZeroLogoProps {
  className?: string;
  size?: number;
  rounded?: 'md' | 'lg' | 'xl' | 'none';
  /** Show accent-colored background (Settings → Appearance → Accent Color). Default true. */
  withBackground?: boolean;
}

export function PaperZeroLogo({
  className,
  size = 32,
  rounded = 'lg',
  withBackground = true,
}: PaperZeroLogoProps) {
  const radius =
    rounded === 'none' ? '' : rounded === 'xl' ? 'rounded-xl' : rounded === 'lg' ? 'rounded-lg' : 'rounded-md';

  const img = (
    <img
      src={LOGO_OUTLINE_URL}
      alt="PaperZero"
      className="w-full h-full object-contain"
      draggable={false}
    />
  );

  if (!withBackground) {
    return (
      <div className={cn('shrink-0 overflow-hidden', radius, className)} style={{ width: size, height: size }}>
        {img}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-primary shrink-0 overflow-hidden shadow-sm',
        radius,
        className,
      )}
      style={{
        width: size,
        height: size,
        padding: Math.max(2, Math.round(size * 0.14)),
      }}
      title="PaperZero"
    >
      <div className={cn('w-full h-full overflow-hidden bg-black/95 flex items-center justify-center', radius)}>
        {img}
      </div>
    </div>
  );
}
