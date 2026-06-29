import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from './utils';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  inputClassName?: string;
}

export function PasswordInput({
  className,
  inputClassName,
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn(
          'w-full h-10 pr-10 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50',
          inputClassName,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
