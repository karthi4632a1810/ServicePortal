import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from './utils';
import { getStaffPhotoUrl, isStaffPhotoUrl } from '../../utils/staffPhoto';

interface UserAvatarProps {
  name: string;
  initials: string;
  employeeId?: string | null;
  avatar?: string;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  name,
  initials,
  employeeId,
  avatar,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const photoUrl = getStaffPhotoUrl(employeeId) || (isStaffPhotoUrl(avatar) ? avatar : undefined);

  return (
    <Avatar className={cn('size-8', className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name} className="object-cover object-top" />}
      <AvatarFallback
        className={cn(
          'bg-primary text-primary-foreground font-semibold',
          fallbackClassName,
        )}
        style={{ fontSize: '11px' }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
