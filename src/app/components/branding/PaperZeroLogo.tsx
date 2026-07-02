import { cn } from '../ui/utils';
import { LOGO_OUTLINE_URL } from '../../utils/branding';

interface PaperZeroLogoProps {
  className?: string;
  size?: number;
  rounded?: 'md' | 'lg' | 'xl' | 'none';
}

export function PaperZeroLogo({ className, size = 32, rounded = 'lg' }: PaperZeroLogoProps) {
  const radius = rounded === 'none' ? '' : rounded === 'xl' ? 'rounded-xl' : rounded === 'lg' ? 'rounded-lg' : 'rounded-md';

  return (
    <img
      src={LOGO_OUTLINE_URL}
      alt="PaperZero"
      width={size}
      height={size}
      className={cn('object-contain shrink-0', radius, className)}
      draggable={false}
    />
  );
}
