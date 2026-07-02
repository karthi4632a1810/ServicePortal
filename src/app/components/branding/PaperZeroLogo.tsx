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

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 overflow-hidden',
        withBackground ? 'bg-primary shadow-sm' : '',
        radius,
        className,
      )}
      style={{ width: size, height: size }}
      title="PaperZero"
    >
      <img
        src={LOGO_OUTLINE_URL}
        alt="PaperZero"
        className={cn(
          'object-contain',
          withBackground ? 'size-[72%] mix-blend-lighten' : 'w-full h-full',
        )}
        draggable={false}
      />
    </div>
  );
}
